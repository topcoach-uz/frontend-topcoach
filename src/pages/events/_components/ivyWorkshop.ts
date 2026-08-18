/**
 * "What do Ivy League & top universities actually look for in applicants?"
 * Live workshop with Komron Ergashev (Stanford University, rising junior,
 * double major in Mathematics and Philosophy) — Thursday, August 20, 2026
 * at 20:00, hosted on the TopCoach platform over Google Meet.
 *
 * Single source of truth for the events-page featured announcement and
 * the dashboard "Top Coach presents" promo.
 *
 * The Meet link is for logged-in users only: the featured card renders a
 * "Log in to join" CTA for anonymous visitors and never puts the URL in
 * their DOM.
 */
export const IVY_WORKSHOP_TITLE =
  'What do Ivy League & top universities actually look for in applicants?';
export const IVY_WORKSHOP_SPEAKER = 'Komron Ergashev';
export const IVY_WORKSHOP_SPEAKER_SCHOOL =
  'Stanford University · Mathematics & Philosophy';
export const IVY_WORKSHOP_DATE_LABEL = 'Thursday, August 20 · 20:00';
export const IVY_WORKSHOP_MEET_URL = 'https://meet.google.com/rqo-oazm-sar';
export const IVY_WORKSHOP_BANNER_IMG = '/img/Komronergashev.png';

/**
 * Auto-hide cutoff: two hours after the session starts (Tashkent time),
 * so the announcement never lingers for a workshop that already happened.
 */
const IVY_WORKSHOP_HIDE_AFTER = new Date('2026-08-20T22:00:00+05:00');

export const isIvyWorkshopLive = () => new Date() < IVY_WORKSHOP_HIDE_AFTER;
