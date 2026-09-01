/**
 * "How to Craft an Ivy League-Worthy Personal Essay" — live workshop with
 * Kenza (Princeton University, BA in Public and International Affairs),
 * Wednesday, August 26, 2026 at 20:00, hosted on the TopCoach platform.
 *
 * Single source of truth for the events-page featured announcement, the
 * past-events grid card, the standalone page and the dashboard
 * "Top Coach presents" promo.
 *
 * The join link is members-only: the featured card renders a "Log in to
 * join" CTA for anonymous visitors and never puts the URL in their DOM.
 * Paste the Meet/room link into IVY_ESSAY_WORKSHOP_JOIN_URL once and every
 * surface picks it up; while it is empty the CTA says the link is still
 * to come instead of pointing nowhere.
 */
export const IVY_ESSAY_WORKSHOP_TITLE =
  'How to Craft an Ivy League-Worthy Personal Essay';
export const IVY_ESSAY_WORKSHOP_SPEAKER = 'Kenza';
export const IVY_ESSAY_WORKSHOP_SPEAKER_SCHOOL =
  'Princeton University · BA in Public and International Affairs';
export const IVY_ESSAY_WORKSHOP_DATE_LABEL = 'Wednesday, August 26 · 20:00';
export const IVY_ESSAY_WORKSHOP_JOIN_URL = 'https://meet.google.com/ndv-tsdd-hgr';
export const IVY_ESSAY_WORKSHOP_BANNER_IMG = '/img/kenza-ivy-essay-workshop.png';

export const ivyEssayWorkshopHasJoinLink =
  IVY_ESSAY_WORKSHOP_JOIN_URL.length > 0;

/**
 * Auto-hide cutoff: two hours after the session starts (Tashkent time),
 * so the announcement never lingers for a workshop that already happened.
 * After the cutoff the featured card hides itself and the grid card takes
 * over, exactly like the earlier masterclass and Ivy League workshop.
 */
const IVY_ESSAY_WORKSHOP_HIDE_AFTER = new Date('2026-08-26T22:00:00+05:00');

export const isIvyEssayWorkshopLive = () =>
  new Date() < IVY_ESSAY_WORKSHOP_HIDE_AFTER;
