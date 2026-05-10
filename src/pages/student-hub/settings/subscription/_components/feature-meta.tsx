/**
 * Editorial-style metadata for a plan feature.
 *
 * Each feature row renders as a "what's included" checklist item:
 * one shared tick glyph, an uppercase letter-spaced eyebrow, and the
 * full label below. No per-feature icons — the eyebrow carries the
 * categorical signal so the bullet stays clean.
 *
 * The actual label comes from i18n
 * (`settings.subscription.features.<key>`).
 */
export interface FeatureMeta {
  /** Decorative serif numeral, e.g. "01" — sets the magazine cadence. */
  numeral: string;
  /** Tiny uppercase tag printed above the title. */
  eyebrow: string;
}

export const FEATURE_META: Record<string, FeatureMeta> = {
  unlimited_messages: { numeral: '01', eyebrow: 'Community' },
  find_study_buddy:   { numeral: '02', eyebrow: 'Connect' },
  full_sat_prep:      { numeral: '03', eyebrow: 'Prepare' },
  research_prep:      { numeral: '04', eyebrow: 'Research' },
  earn_coins:         { numeral: '05', eyebrow: 'Reward' },
};

export const FEATURE_FALLBACK: Record<string, string> = {
  unlimited_messages: 'Unlimited messages with peers',
  find_study_buddy: 'Find a study buddy match',
  full_sat_prep: 'Full SAT prep platform',
  research_prep: 'Research Prep · 8-week structured course',
  earn_coins: 'Earn coins and redeem rewards',
};
