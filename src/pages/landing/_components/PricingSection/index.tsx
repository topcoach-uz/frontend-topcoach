import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useGetSubscriptionPlansQuery } from 'src/app/services/subscription';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { COMMUNITY_FUNNEL_PATHS } from 'src/lib/communityAccess';
import { COMMUNITY_PLAN_FEATURES } from 'src/pages/student-hub/settings/subscription/_components/plan-features';
import type { PlanDto } from 'src/pages/student-hub/settings/subscription/types';

import styles from './pricing.module.scss';

const planTitle = (
  plan: PlanDto,
  t: (k: string, d: string) => string,
): string =>
  plan.period === 'yearly'
    ? t('landing.pricing.plan.yearly', 'Yearly Plan')
    : t('landing.pricing.plan.monthly', 'Monthly Plan');

export default function PricingSection() {
  const colors = useColors();
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);

  const { data: plans = [], isLoading } = useGetSubscriptionPlansQuery();

  // Monthly first, Yearly second — mirrors every other surface so the
  // "save" pill consistently lives on the right card.
  const orderedPlans = useMemo(
    () =>
      [...plans].sort((a, b) =>
        a.period === b.period ? 0 : a.period === 'monthly' ? -1 : 1,
      ),
    [plans],
  );

  // Live-derived yearly savings — anchor + percent pill both computed
  // from admin-edited prices, in lockstep so they never disagree.
  // Floor the % so we never over-promise (31.7 → 31, never 32).
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
  const yearlySavePercent = hasGenuineYearlySaving
    ? Math.floor((1 - yearlyPriceRaw / monthlyTimes12) * 100)
    : null;
  const liveSaveBadge =
    yearlySavePercent && yearlySavePercent > 0
      ? `SAVE ${yearlySavePercent}%`
      : null;

  const handleStart = () => {
    if (isAuthenticated) {
      navigate(COMMUNITY_FUNNEL_PATHS.subscriptionTab);
    } else {
      localStorage.setItem(
        'redirectAfterLogin',
        COMMUNITY_FUNNEL_PATHS.subscriptionTab,
      );
      navigate('/auth/signin');
    }
  };

  if (!isLoading && orderedPlans.length === 0) return null;

  return (
    <section className={styles.section} data-section="pricing">
      <div className={'container ' + styles.container}>
        <header className={styles.header}>
          <span className={styles.kicker}>
            {t('landing.pricing.kicker', 'Membership')}
          </span>
          <CustomText
            fontSize={screenSize > 768 ? 36 : themeFontSize.fontSizeTitle4}
            fontWeight={themeFontWeight.fontWeightSemibold}
            color={colors.colorTextBase ?? '#1a1a1a'}
            mt={0}
            mb={8}
          >
            {t(
              'landing.pricing.title',
              'One plan. Every tool to get into your dream university.',
            )}
          </CustomText>
          <CustomText
            fontSize={themeFontSize.fontSizeTitle5}
            color={colors.colorTextDescription}
            lineHeight={1.5}
          >
            {t(
              'landing.pricing.lede',
              'Pick monthly to stay flexible, or save with the yearly plan. Both unlock the full Community.',
            )}
          </CustomText>
        </header>

        {isLoading ? (
          <div className={styles.skeletonGrid} aria-hidden>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
          </div>
        ) : (
          <div className={styles.cards}>
            {orderedPlans.map((plan) => {
              const isYearly = plan.period === 'yearly';
              return (
                <article
                  key={plan.id}
                  className={`${styles.card} ${isYearly ? styles.cardFeatured : ''}`}
                >
                  <header className={styles.cardHead}>
                    <h3 className={styles.cardTitle}>{planTitle(plan, t)}</h3>
                    {(() => {
                      const badge =
                        isYearly && liveSaveBadge
                          ? liveSaveBadge
                          : plan.saveBadge;
                      return badge ? (
                        <span className={styles.saveBadge}>{badge}</span>
                      ) : null;
                    })()}
                  </header>

                  <div className={styles.priceRow}>
                    <span className={styles.priceCurrency}>$</span>
                    <span className={styles.priceAmount}>
                      {(plan.priceUsd ?? 0).toFixed(0)}
                    </span>
                    <span className={styles.pricePer}>
                      {isYearly
                        ? t('landing.pricing.perYear', '/ yr')
                        : t('landing.pricing.perMonth', '/ mo')}
                    </span>
                    {isYearly && anchorYearlyPrice != null ? (
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
                    <p className={styles.subline}>{plan.subline}</p>
                  )}

                  <ul className={styles.featureList}>
                    {COMMUNITY_PLAN_FEATURES.map((feature) => (
                      <li key={feature.key} className={styles.featureItem}>
                        <Check
                          className={styles.featureTick}
                          size={14}
                          strokeWidth={2.5}
                          aria-hidden
                        />
                        <div className={styles.featureCopy}>
                          <span className={styles.featureTitle}>
                            {feature.title}
                          </span>
                          <span className={styles.featureDesc}>
                            {feature.description}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={`${styles.cta} ${
                      isYearly ? styles.ctaPrimary : styles.ctaGhost
                    }`}
                    onClick={handleStart}
                  >
                    {t('landing.pricing.continueToClick', 'Pay with Click')}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
