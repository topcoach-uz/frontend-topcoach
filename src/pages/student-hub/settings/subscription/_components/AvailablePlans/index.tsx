import { useState } from 'react';
import { Button } from 'antd';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PlanDto } from '../../types';
import { FEATURE_FALLBACK } from '../feature-meta';
import styles from './AvailablePlans.module.scss';

export interface AvailablePlansProps {
  /** Plans to render side-by-side (Monthly + Yearly). */
  plans: PlanDto[];
  /** Plan id of the user's current plan, if any (drives the radio dot). */
  currentPlanId?: string;
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

const planDisplayName = (plan: PlanDto, lang: string): string => {
  const key = (lang || 'en').slice(0, 2) as keyof typeof plan.displayName;
  return plan.displayName[key] ?? plan.displayName.en;
};

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
  variant = 'choose',
  onSelectPlan,
}: AvailablePlansProps) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<string>(
    () =>
      currentPlanId ??
      plans.find((p) => p.period === 'yearly')?.id ??
      plans[0]?.id ??
      '',
  );

  if (plans.length === 0) return null;

  const ctaLabel = (plan: PlanDto): string => {
    if (currentPlanId === plan.id) {
      return t('settings.subscription.cta.currentPlan', 'Current plan');
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
        const isCurrent = currentPlanId === plan.id;
        const rawFeatures = plan.features;
        const features = Array.isArray(rawFeatures)
          ? rawFeatures
          : rawFeatures && typeof rawFeatures === 'object'
            ? Object.keys(rawFeatures).map((key) => ({ key }))
            : [];

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
              <h3 className={styles.planName}>
                {planDisplayName(plan, i18n.language)}
              </h3>
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
              </div>
              {plan.subline && (
                <div className={styles.subline}>{plan.subline}</div>
              )}
            </div>

            <ul className={styles.featureList}>
              {features.map((feature) => (
                <li key={feature.key} className={styles.featureItem}>
                  <Check
                    className={styles.featureTick}
                    size={14}
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span className={styles.featureLabel}>
                    {t(
                      `settings.subscription.features.${feature.key}`,
                      FEATURE_FALLBACK[feature.key] ?? feature.key,
                    )}
                  </span>
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
