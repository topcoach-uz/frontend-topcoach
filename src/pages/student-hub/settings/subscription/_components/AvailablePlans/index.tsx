import { useEffect, useMemo, useState } from 'react';
import { Button } from 'antd';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PlanDto } from '../../types';
import { COMMUNITY_PLAN_FEATURES } from '../plan-features';
import styles from './AvailablePlans.module.scss';

export interface AvailablePlansProps {
  /** Plans to render (Monthly + Yearly of the same membership). */
  plans: PlanDto[];
  /** Plan id of the user's live plan (used for the "switching back" path). */
  currentPlanId?: string;
  /**
   * Plan id queued for the next billing cycle, if any. When set, this
   * becomes the *effective* current plan in the picker, its CTA shows
   * "Current plan" and is non-clickable; the other period's CTA reverts to
   * the live plan (an undo flow handled upstream).
   */
  scheduledPlanId?: string;
  /** Header context: 'choose' for empty state, 'switch' when already subscribed. */
  variant?: 'choose' | 'switch';
  /**
   * Fired when the user clicks the primary CTA. Page entry uses this to
   * lift state, store the picked plan, open the add-card form, and
   * surface a "card needed to start trial" banner.
   */
  onSelectPlan?: (plan: PlanDto) => void;
}

/**
 * Plan picker.
 *
 * Monthly and Yearly are the same membership at two billing periods, so
 * they're presented as a period switch over ONE panel rather than two
 * cards. The previous two-card layout printed the identical eight-item
 * feature list twice, which made the periods look like different products
 * and left no room for each feature's supporting line, so the panel now
 * shows the descriptions that `COMMUNITY_PLAN_FEATURES` already carries.
 *
 * Everything about subscription state (current plan, a switch queued for
 * next cycle, the undo path) is unchanged, only the presentation moved.
 */
export default function AvailablePlans({
  plans,
  currentPlanId,
  scheduledPlanId,
  variant = 'choose',
  onSelectPlan,
}: AvailablePlansProps) {
  const { t } = useTranslation();

  // The picker reflects the plan the user has *chosen*, not just what's
  // live today. While a switch is queued, the scheduled plan is the
  // effective choice; picking the other period reverts it (handled by
  // `handleSelectPlan` upstream, which detects the same-as-live target).
  const effectiveCurrentId = scheduledPlanId ?? currentPlanId;
  const hasScheduledSwitch =
    !!scheduledPlanId && !!currentPlanId && scheduledPlanId !== currentPlanId;

  const monthlyPlan = plans.find((p) => p.period === 'monthly');
  const yearlyPlan = plans.find((p) => p.period === 'yearly');

  // Open on the period the user is already on; otherwise lead with yearly,
  // which is the better deal and the one worth defaulting to.
  const [period, setPeriod] = useState<'monthly' | 'yearly'>(() => {
    const current = plans.find((p) => p.id === (scheduledPlanId ?? currentPlanId));
    if (current) return current.period === 'yearly' ? 'yearly' : 'monthly';
    return yearlyPlan ? 'yearly' : 'monthly';
  });

  // Live-derived yearly savings, the anchor price and the percentage come
  // from the same admin-edited numbers, computed together so they can
  // never disagree. Floored, never rounded up: 31.7% reads as 31%, so the
  // discount is never over-promised.
  const savings = useMemo(() => {
    const monthlyPrice = monthlyPlan?.priceUsd ?? 0;
    const yearlyPrice = yearlyPlan?.priceUsd ?? 0;
    const monthlyTimes12 = monthlyPrice * 12;
    if (!(monthlyPrice > 0 && yearlyPrice > 0 && monthlyTimes12 - yearlyPrice > 0)) {
      return null;
    }
    return {
      anchor: Math.round(monthlyTimes12),
      percent: Math.floor((1 - yearlyPrice / monthlyTimes12) * 100),
    };
  }, [monthlyPlan?.priceUsd, yearlyPlan?.priceUsd]);

  // Follow the effective current plan when it actually changes, e.g. right
  // after a switch is confirmed, so the picker shows the plan the user just
  // chose. Keyed on the id alone, so a manual toggle isn't yanked back by an
  // unrelated refetch.
  const effectivePeriod = plans.find((p) => p.id === effectiveCurrentId)?.period;
  useEffect(() => {
    if (effectivePeriod) setPeriod(effectivePeriod);
  }, [effectivePeriod, effectiveCurrentId]);

  const periodOptions = useMemo(
    () =>
      (
        [
          { id: 'monthly' as const, plan: monthlyPlan },
          { id: 'yearly' as const, plan: yearlyPlan },
        ] satisfies { id: 'monthly' | 'yearly'; plan?: PlanDto }[]
      ).filter((option) => !!option.plan),
    [monthlyPlan, yearlyPlan],
  );

  if (plans.length === 0) return null;

  const activePlan = (period === 'yearly' ? yearlyPlan : monthlyPlan) ?? plans[0];
  if (!activePlan) return null;

  const isCurrent = effectiveCurrentId === activePlan.id;
  const isUndoTarget = hasScheduledSwitch && currentPlanId === activePlan.id;

  const ctaLabel = (): string => {
    if (isCurrent) {
      // The scheduled plan masquerades as "Current plan", it's the user's
      // chosen plan from this point forward.
      return t('settings.subscription.cta.currentPlan', 'Current plan');
    }
    if (isUndoTarget) {
      return t('settings.subscription.cta.undoSwitchTo', 'Switch back to this plan');
    }
    if (variant === 'switch') {
      return t('settings.subscription.cta.switchTo', 'Switch to this plan');
    }
    return activePlan.trialDays > 0
      ? t('settings.subscription.cta.startTrial', 'Start {{days}}-day free trial', {
          days: activePlan.trialDays,
        })
      : t('settings.subscription.cta.subscribe', 'Subscribe');
  };

  // One honest sentence about what the price actually means, instead of a
  // strikethrough floating next to the number. Distinct keys from
  // `billedYearly`/`billedMonthly`, which are short fragments CurrentPlanCard
  // splices mid-sentence.
  const billingNote = (): string => {
    if (period === 'yearly' && savings) {
      return t(
        'settings.subscription.billingNoteYearly',
        'Billed once a year. That is ${{anchor}} at the monthly rate, you keep ${{saved}}.',
        { anchor: savings.anchor, saved: savings.anchor - Math.round(activePlan.priceUsd) },
      );
    }
    if (period === 'yearly') {
      return t('settings.subscription.billingNoteYearlyPlain', 'Billed once a year.');
    }
    return t('settings.subscription.billingNoteMonthly', 'Billed every month.');
  };

  return (
    <div className={styles.picker}>
      {/* Period switch. Two segments, so a segmented control reads faster
          than a dropdown and shows the yearly discount without a click. */}
      {periodOptions.length > 1 && (
        <div
          className={styles.periodSwitch}
          role="radiogroup"
          aria-label={t('settings.subscription.billingPeriod', 'Billing period')}
        >
          {periodOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={period === option.id}
              className={`${styles.periodOption} ${
                period === option.id ? styles.periodOptionActive : ''
              }`}
              onClick={() => setPeriod(option.id)}
            >
              {option.id === 'yearly'
                ? t('settings.subscription.period.yearly', 'Yearly')
                : t('settings.subscription.period.monthly', 'Monthly')}
              {option.id === 'yearly' && (savings || yearlyPlan?.saveBadge) && (
                <span className={styles.periodSave}>
                  {savings
                    ? t('settings.subscription.saveShort', 'Save {{percent}}%', {
                        percent: savings.percent,
                      })
                    : yearlyPlan?.saveBadge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <article className={styles.panel}>
        <div className={styles.panelTop}>
          <div className={styles.priceBlock}>
            <p className={styles.planLabel}>
              {t('settings.subscription.membership', 'Community membership')}
            </p>
            <p className={styles.price}>
              <span className={styles.priceCurrency}>$</span>
              <span className={styles.priceAmount}>
                {Number.isInteger(activePlan.priceUsd)
                  ? activePlan.priceUsd
                  : activePlan.priceUsd.toFixed(2)}
              </span>
              <span className={styles.pricePer}>
                {period === 'yearly'
                  ? t('settings.subscription.perYear', '/ year')
                  : t('settings.subscription.perMonth', '/ month')}
              </span>
            </p>
            {/* Admin-authored unit price ("$8.25/month equivalent"), the
                number people actually compare across periods. */}
            {activePlan.subline && (
              <p className={styles.subline}>{activePlan.subline}</p>
            )}
            <p className={styles.billingNote}>{billingNote()}</p>
          </div>

          <div className={styles.actionBlock}>
            {isCurrent && (
              <p className={styles.currentBadge}>
                {t('settings.subscription.cta.currentPlan', 'Current plan')}
              </p>
            )}
            <Button
              type="primary"
              size="large"
              disabled={isCurrent}
              className={styles.cta}
              onClick={() => {
                if (isCurrent) return;
                onSelectPlan?.(activePlan);
              }}
            >
              {ctaLabel()}
            </Button>
            <p className={styles.reassurance}>
              {activePlan.trialDays > 0 && variant === 'choose'
                ? t(
                    'settings.subscription.reassuranceTrial',
                    '{{days}} days free, then ${{price}}. Cancel anytime.',
                    {
                      days: activePlan.trialDays,
                      price: Number.isInteger(activePlan.priceUsd)
                        ? activePlan.priceUsd
                        : activePlan.priceUsd.toFixed(2),
                    },
                  )
                : t('settings.subscription.reassurance', 'Switch or cancel anytime.')}
            </p>
          </div>
        </div>

        <div className={styles.featureBlock}>
          <h4 className={styles.featureHeading}>
            {t('settings.subscription.everythingIncluded', 'Everything included')}
          </h4>
          <ul className={styles.featureList}>
            {COMMUNITY_PLAN_FEATURES.map((feature) => (
              <li key={feature.key} className={styles.featureItem}>
                <Check className={styles.featureTick} size={14} strokeWidth={2.75} aria-hidden />
                <div>
                  <p className={styles.featureTitle}>{feature.title}</p>
                  <p className={styles.featureDesc}>{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </div>
  );
}
