export const CHEVENING_WORKSHOP_TITLE = 'How to Build a Strong Chevening Application';
export const CHEVENING_WORKSHOP_SPEAKER = 'Shirinkhon Toshkhujaeva';
export const CHEVENING_WORKSHOP_ROLE =
  'Chevening Programme Officer, British Embassy in Tashkent';
export const CHEVENING_WORKSHOP_DATE_LABEL = 'Thursday, September 10 · 20:00';
export const CHEVENING_WORKSHOP_MEET_URL = 'https://meet.google.com/szw-yubg-cvf';
export const CHEVENING_WORKSHOP_BANNER_IMG = '/img/chevening-workshop.png';

/** Hide the live announcement shortly after the workshop finishes in Tashkent. */
const CHEVENING_WORKSHOP_HIDE_AFTER = new Date('2026-09-10T22:00:00+05:00');

export const isCheveningWorkshopLive = () => new Date() < CHEVENING_WORKSHOP_HIDE_AFTER;
