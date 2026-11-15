import { useEffect, useState } from 'react';
import { Alert, Button, Modal, message } from 'antd';
import { isAxiosError } from 'axios';
import { ArrowRight, Check, CalendarCheck, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { paymentRedirectWithTimeout } from 'src/app/services/paymentRedirect';
import { PAYMENT_MERCHANT_RETURN_ORIGIN } from 'src/constants/paymentMerchantReturn';
import type { PlanDto, SubscriptionDto } from '../../types';
import { COMMUNITY_PLAN_FEATURES } from '../plan-features';
import styles from './CommunityPlans.module.scss';

type Props = {
  plans: PlanDto[];
  subscription: SubscriptionDto | null;
  onRefresh: () => unknown;
};

const formatUzs = (value: number) => Math.round(value).toLocaleString('ru-RU').replace(/,/g, ' ');

/** The plan we nudge toward: the one with a savings badge, else the longest period. */
function recommendedPlanId(plans: PlanDto[]) {
  const badged = plans.find((plan) => plan.saveBadge);
  if (badged) return badged.id;
  return [...plans].sort((a, b) => (b.billingPeriodDays ?? 0) - (a.billingPeriodDays ?? 0))[0]?.id;
}

export default function ClickCommunityCheckout({ plans, subscription, onRefresh }: Props) {
  const { t, i18n } = useTranslation();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [returned] = useState(
    () => new URLSearchParams(window.location.search).get('clickCheckout') === 'returned',
  );
  const paid = subscription?.autoRenew === false && subscription.status === 'active';
  const available = plans
    .filter((plan) => plan.name === 'community' && plan.priceUzs > 0)
    .sort((a, b) => (a.billingPeriodDays ?? 0) - (b.billingPeriodDays ?? 0));
  const recommended = available.length > 1 ? recommendedPlanId(available) : undefined;

  useEffect(() => {
    if (!returned || paid) return;
    // A browser return is not proof of payment. Wait for the verified webhook.
    let tries = 0;
    const timer = window.setInterval(() => {
      void onRefresh();
      if (++tries >= 10) window.clearInterval(timer);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [returned, paid, onRefresh]);

  const purchase = async (plan: PlanDto) => {
    if (openingId) return;
    setOpeningId(plan.id);
    try {
      const returnUrl = `${PAYMENT_MERCHANT_RETURN_ORIGIN}/student-hub?section=account&target=settings&tab=subscription&clickCheckout=returned`;
      const result = await paymentRedirectWithTimeout('click', { planId: plan.id, returnUrl });
      const destination = new URL(result.url ?? result.redirectUrl ?? '');
      if (destination.origin !== 'https://my.click.uz' || destination.pathname !== '/services/pay') {
        throw new Error('Invalid Click payment link');
      }
      const open = () => window.location.assign(destination.toString());
      // An existing prepared order retains its original server price.
      if (result.amountUzs !== undefined && result.amountUzs !== Math.round(plan.priceUzs)) {
        Modal.confirm({
          title: t('settings.subscription.click.confirmPrice', 'Confirm payment amount'),
          content: t(
            'settings.subscription.click.pendingPrice',
            'Click will charge {{amount}} UZS for this purchase. Continue?',
            { amount: result.amountUzs.toLocaleString() },
          ),
          okText: t('settings.subscription.click.continue', 'Continue to Click'),
          onOk: open,
          onCancel: () => setOpeningId(null),
        });
      } else open();
    } catch (error: unknown) {
      const detail = isAxiosError<{ message?: string | string[] }>(error)
        ? error.response?.data?.message
        : undefined;
      message.error(
        (Array.isArray(detail) ? detail.join(' · ') : detail) ??
          t('settings.subscription.click.failed', 'Could not open Click checkout. Please try again.'),
      );
      setOpeningId(null);
    }
  };

  if (subscription && subscription.autoRenew !== false) return null;
  if (!available.length && !paid) return null;

  // ---------- Already paid: membership status ----------
  if (paid) {
    const accessDate = subscription?.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd).toLocaleDateString(i18n?.language, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '';
    return (
      <section className={styles.status} aria-label={t('accountNav.community', 'Community membership')}>
        <div className={styles.statusIcon} aria-hidden>
          <CalendarCheck size={22} strokeWidth={1.75} />
        </div>
        <div className={styles.statusBody}>
          <div className={styles.statusHead}>
            <h2>{t('accountNav.community', 'Community membership')}</h2>
            <span className={styles.activePill}>{t('accountNav.active', 'Active')}</span>
          </div>
          <p className={styles.statusLabel}>{t('accountNav.accessUntil', 'Access until')}</p>
          <p className={styles.statusDate}>{accessDate}</p>
          <p className={styles.note}>
            {t('accountNav.noRenewal', 'Paid with Click. Your access will not renew automatically.')}
          </p>
        </div>
      </section>
    );
  }

  // ---------- Choose a period: two plan cards ----------
  const planLabel = (plan: PlanDto) =>
    plan.period === 'yearly'
      ? t('settings.subscription.plans.yearly', 'Yearly')
      : plan.period === 'monthly'
        ? t('settings.subscription.plans.monthly', 'Monthly')
        : t('settings.subscription.plans.days', '{{days}} days', { days: plan.billingPeriodDays });
  const periodLabel = (plan: PlanDto) =>
    t('settings.subscription.plans.accessFor', '{{days}} days of access', { days: plan.billingPeriodDays });

  return (
    <section className={styles.plans} aria-labelledby="community-plans-title">
      <header className={styles.head}>
        <p className={styles.eyebrow}>
          <Sparkles size={14} strokeWidth={2} aria-hidden />
          {t('accountNav.community', 'Community membership')}
        </p>
        <h2 id="community-plans-title">
          {t('settings.subscription.plans.title', 'Choose your Community access')}
        </h2>
        <p className={styles.lead}>
          {t(
            'accountNav.checkoutHint',
            'Choose your access period. You’ll pay securely on Click’s page, and access starts after payment is confirmed.',
          )}
        </p>
      </header>

      <div className={styles.grid} role="list">
        {available.map((plan) => {
          const featured = plan.id === recommended;
          const months = (plan.billingPeriodDays ?? 0) / 30;
          const perMonth = months > 1.5 ? plan.priceUzs / Math.round(months > 11 ? 12 : months) : null;
          return (
            <article
              key={plan.id}
              role="listitem"
              className={`${styles.card}${featured ? ` ${styles.featured}` : ''}`}
              aria-label={planLabel(plan)}
            >
              <div className={styles.cardTop}>
                <h3>{planLabel(plan)}</h3>
                {featured ? (
                  <span className={styles.badge}>
                    {plan.saveBadge ?? t('settings.subscription.plans.bestValue', 'Best value')}
                  </span>
                ) : (
                  plan.saveBadge && <span className={styles.badgeQuiet}>{plan.saveBadge}</span>
                )}
              </div>
              <p className={styles.period}>{periodLabel(plan)}</p>

              <div className={styles.price}>
                <span className={styles.amount}>{formatUzs(plan.priceUzs)}</span>
                <span className={styles.currency}>UZS</span>
              </div>
              <p className={styles.sub}>
                {perMonth
                  ? t('settings.subscription.plans.perMonth', '≈ {{amount}} UZS per month', {
                      amount: formatUzs(perMonth),
                    })
                  : // Backend sublines describe recurring billing; this checkout is one-time.
                    t('settings.subscription.plans.oneTime', 'One payment · no renewal')}
                {plan.priceUsd ? <span className={styles.usd}> · ${plan.priceUsd}</span> : null}
              </p>

              <Button
                type="primary"
                size="large"
                block
                className={`${styles.cta}${featured ? '' : ` ${styles.ctaQuiet}`}`}
                onClick={() => void purchase(plan)}
                loading={openingId === plan.id}
                disabled={!!openingId && openingId !== plan.id}
              >
                {t('settings.subscription.click.continue', 'Continue to Click')}
                <ArrowRight size={16} aria-hidden />
              </Button>
            </article>
          );
        })}
      </div>

      <div className={styles.features}>
        <h3>{t('settings.subscription.plans.included', 'Everything in Community')}</h3>
        <ul>
          {COMMUNITY_PLAN_FEATURES.map((feature) => (
            <li key={feature.key}>
              <span className={styles.check} aria-hidden>
                <Check size={13} strokeWidth={2.5} />
              </span>
              <span>
                <strong>{feature.title}</strong>
                <small>{feature.description}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ul className={styles.assurances}>
        <li>
          <ShieldCheck size={15} strokeWidth={1.75} aria-hidden />
          {t('settings.subscription.plans.secure', 'Secure payment on Click')}
        </li>
        <li>
          <Lock size={15} strokeWidth={1.75} aria-hidden />
          {t('accountNav.onePeriod', 'One payment for one period. No automatic renewal.')}
        </li>
      </ul>

      {returned && (
        <Alert
          type="info"
          showIcon
          role="status"
          message={t(
            'settings.subscription.click.checking',
            'Checking payment confirmation. Access activates after Click confirms payment.',
          )}
          action={
            <Button onClick={() => void onRefresh()}>
              {t('settings.subscription.click.refresh', 'Refresh status')}
            </Button>
          }
        />
      )}
    </section>
  );
}
