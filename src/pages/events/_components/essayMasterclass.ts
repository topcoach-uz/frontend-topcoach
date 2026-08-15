/**
 * "How to write the essay that gets in" — live masterclass with
 * Shakhnoza Salimjonova (Princeton SPIA), August 16, 2026 at 20:00.
 *
 * Single source of truth for the events-page featured announcement and
 * the dashboard "Top Coach presents" promo. Paid entry, seats limited,
 * live only (not recorded) — seats are reserved through a Telegram DM.
 */
export const MASTERCLASS_TITLE = 'How to write the essay that gets in';
export const MASTERCLASS_SPEAKER = 'Shakhnoza Salimjonova';
export const MASTERCLASS_SPEAKER_SCHOOL =
  'Princeton University · School of Public and International Affairs';
export const MASTERCLASS_DATE_LABEL = 'August 16 · 20:00';
export const MASTERCLASS_RESERVE_URL = 'https://t.me/m/tsWjSwDEMGM6';
export const MASTERCLASS_BANNER_IMG = '/img/Artboard2.jpg';

/**
 * Auto-hide cutoff: two hours after the session starts (Tashkent time),
 * so the announcement never lingers for an event that already happened.
 */
const MASTERCLASS_HIDE_AFTER = new Date('2026-08-16T22:00:00+05:00');

export const isEssayMasterclassLive = () => new Date() < MASTERCLASS_HIDE_AFTER;
