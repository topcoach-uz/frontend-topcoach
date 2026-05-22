import { useState } from 'react';
import { Button } from 'antd';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PlanDto } from '../../types';
import { COMMUNITY_PLAN_FEATURES } from '../plan-features';
import styles from './AvailablePlans.module.scss';

export interface AvailablePlansProps {
  /** Plans to render side-by-side (Monthly + Yearly). */
  plans: PlanDto[];
  /** Plan id of the user's live plan (used for the "switching back" path). */
  currentPlanId?: string;
  /**
   * Plan id queued for the next billing cycle, if any. When set, this
   * becomes the *effective* current plan in the picker — its card shows
   * "Current plan" and is non-clickable; the other card's CTA reverts to
   * the live plan (an undo flow handled upstream).
   */
  scheduledPlanId?: string;
  /** Header context: 'choose' for empty state, 'switch' when already subscribed. */
  variant?: 'choose' | 'switch';
  /**
   * Fired when the user clicks the primary CTA on a plan card. Page
   * entry uses this to lift state — store the picked plan, open the
   * add-card form, and surface a "card needed to start trial" banner.
   * Until the Phase 3 subscribe API exists this is the meaningful
   * action a click translates to.
   */
  onSelectPlan?: (plan: PlanDto) => void;
}

/**
 * Plan card title. We intentionally use period-driven copy ("Monthly
 * Plan" / "Yearly Plan") instead of the backend `displayName` ("Community")
 * — the period is what users actually compare across cards, and the
 * brand name is already obvious from the page context.
 */
const planTitle = (plan: PlanDto, t: (k: string, d: string) => string): string =>
  plan.period === 'yearly'
    ? t('settings.subscription.plan.yearly', 'Yearly Plan')
    : t('settings.subscription.plan.monthly', 'Monthly Plan');

/**
 * Plan picker — two cards side-by-side, each fully self-contained:
 * eyebrow + price + UZS conversion + features checklist + primary CTA.
 *
 * Cards click to "select" (visual highlight + radio dot). The CTA inside
 * each card is the action — Phase 3 wires this to the subscribe flow.
 */
export default function AvailablePlans({
  plans,
  currentPlanId,
  scheduledPlanId,
  variant = 'choose',
  onSelectPlan,
}: AvailablePlansProps) {
  const { t } = useTranslation();

  // The picker should reflect the plan the user has *chosen* — not just
  // what's live today. While a switch is queued, the scheduled plan is
  // the user's effective choice; the other card's CTA reverts that
  // choice (handled by `handleSelectPlan` upstream — it detects the
  // same-as-live target and forwards as an undo).
  const effectiveCurrentId = scheduledPlanId ?? currentPlanId;
  const hasScheduledSwitch =
    !!scheduledPlanId &&
    !!currentPlanId &&
    scheduledPlanId !== currentPlanId;

  const [selected, setSelected] = useState<string>(
    () =>
      effectiveCurrentId ??
      plans.find((p) => p.period === 'yearly')?.id ??
      plans[0]?.id ??
      '',
  );

  if (plans.length === 0) return null;

  // "If billed monthly" anchor for the yearly card. Dynamic from
  // admin-edited prices: anchor = monthly × 12. The yearly card
  // already shows a SAVE 30% pill in the header, so the price block
  // just needs the struck-through anchor — no second savings badge
  // (avoids the "trying too hard" feel of triple-signaling the same
  // discount). Only render the anchor when there's an actual saving,
  // i.e. yearly < monthly × 12.
  const monthlyPlan = plans.find((p) => p.period === 'monthly');
  const yearlyPlan = plans.find((p) => p.period === 'yearly');
  const monthlyPriceRaw = monthlyPlan?.priceUsd ?? 0;
  const yearlyPriceRaw = yearlyPlan?.priceUsd ?? 0;
  const monthlyTimes12 = monthlyPriceRaw * 12;
  const hasGenuineYearlySaving =
    monthlyPriceRaw > 0 &&
    yearlyPriceRaw > 0 &&
    monthlyTimes12 - yearlyPriceRaw > 0;
  const anchorYearlyPrice = hasGenuineYearlySaving
    ? Math.round(monthlyTimes12)
    : null;

  const ctaLabel = (plan: PlanDto): string => {
    if (effectiveCurrentId === plan.id) {
      // The scheduled plan masquerades as "Current plan" (it's the
      // user's chosen plan from this point forward).
      return t('settings.subscription.cta.currentPlan', 'Current plan');
    }
    if (hasScheduledSwitch && currentPlanId === plan.id) {
      // Other card during a scheduled switch = undo affordance.
      return t(
        'settings.subscription.cta.undoSwitchTo',
        'Switch back to this plan',
      );
    }
    if (variant === 'switch') {
      return t('settings.subscription.cta.switchTo', 'Switch to this plan');
    }
    return plan.trialDays > 0
      ? t('settings.subscription.cta.startTrial', 'Start {{days}}-day free trial', {
          days: plan.trialDays,
        })
      : t('settings.subscription.cta.subscribe', 'Subscribe');
  };

  return (
    <div className={styles.cards}>
      {plans.map((plan) => {
        const isSelected = plan.id === selected;
        // "isCurrent" drives the disabled state + the visual highlight.
        // We mark the *effective* current (scheduled when set, else live)
        // so the picker is consistent with the status block.
        const isCurrent = effectiveCurrentId === plan.id;

        return (
          <article
            key={plan.id}
            className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${
              isCurrent ? styles.cardCurrent : ''
            }`}
            onClick={() => setSelected(plan.id)}
          >
            <header className={styles.cardHead}>
              <div className={styles.headLine}>
                <span
                  className={`${styles.radio} ${isSelected ? styles.radioSelected : ''}`}
                  aria-hidden
                />
                <span className={styles.eyebrow}>
                  {plan.period === 'yearly'
                    ? t('settings.subscription.period.yearly', 'Yearly')
                    : t('settings.subscription.period.monthly', 'Monthly')}
                </span>
                {plan.saveBadge && (
                  <span className={styles.saveBadge}>{plan.saveBadge}</span>
                )}
              </div>
              <h3 className={styles.planName}>{planTitle(plan, t)}</h3>
            </header>

            <div className={styles.priceBlock}>
              <div className={styles.price}>
                <span className={styles.priceCurrency}>$</span>
                <span className={styles.priceAmount}>
                  {(plan.priceUsd ?? 0).toFixed(2)}
                </span>
                <span className={styles.pricePer}>
                  {plan.period === 'yearly' ? '/ yr' : '/ mo'}
                </span>
                {plan.period === 'yearly' && anchorYearlyPrice != null ? (
                  <span
                    className={styles.priceAnchor}
                    aria-label={`Billed monthly would be $${anchorYearlyPrice} per year`}
                  >
                    <span className={styles.priceAnchor__was}>
                      ${anchorYearlyPrice}
                    </span>
                  </span>
                ) : null}
              </div>
              {plan.subline && (
                <div className={styles.subline}>{plan.subline}</div>
              )}
            </div>

            <ul className={styles.featureList}>
              {COMMUNITY_PLAN_FEATURES.map((feature) => (
                <li key={feature.key} className={styles.featureItem}>
                  <Check
                    className={styles.featureTick}
                    size={14}
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span className={styles.featureTitle}>{feature.title}</span>
                </li>
              ))}
            </ul>

            <Button
              type="primary"
              size="large"
              block
              disabled={isCurrent}
              className={styles.ctaButton}
              onClick={(e) => {
                e.stopPropagation();
                if (isCurrent) return;
                setSelected(plan.id);
                onSelectPlan?.(plan);
              }}
            >
              {ctaLabel(plan)}
            </Button>
          </article>
        );
      })}
    </div>
  );
}
