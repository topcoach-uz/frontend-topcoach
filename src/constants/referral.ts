/**
 * Default referral rate as a percentage, mirroring REFERRAL_DEFAULT_PERCENT in
 * the backend's src/common/constants.ts.
 *
 * Only a display fallback for the moment before the server has answered. The
 * authoritative rate for any given code is whatever `validate` returns, since
 * codes carry their own percentage.
 */
export const REFERRAL_DEFAULT_PERCENT = 1;

/**
 * Checkout `type` values a referral code may NOT be applied to.
 *
 * A denylist rather than an allowlist because some session entry points reach
 * checkout with no `type` param at all, and an allowlist would silently hide
 * the input for them. The backend is the real gate: it refuses ineligible
 * products regardless of what the page shows.
 *
 * Events (the CAAF forum among them) and webinars are excluded by product
 * decision. Webinar payments additionally have no buyer identity server-side,
 * so there is nobody to credit.
 */
export const REFERRAL_INELIGIBLE_PAYMENT_TYPES = ['caaf', 'event', 'webinar'];
