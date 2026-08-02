/**
 * Personal Statement Workshop (Nazira Davroni) — recording config.
 *
 * Paste the YouTube video ID once here and both the events-page card and the
 * dashboard promo pick it up. Accepts just the ID (the part after `v=` or
 * after `youtu.be/`), e.g. for https://youtu.be/dQw4w9WgXcQ → 'dQw4w9WgXcQ'.
 */
export const WORKSHOP_YOUTUBE_ID = '';

export const workshopHasVideo = WORKSHOP_YOUTUBE_ID.length > 0;

export const WORKSHOP_WATCH_URL = workshopHasVideo
  ? `https://www.youtube.com/watch?v=${WORKSHOP_YOUTUBE_ID}`
  : '';

/** Privacy-friendly embed; autoplay on click, no related-video spam at end. */
export const WORKSHOP_EMBED_URL = workshopHasVideo
  ? `https://www.youtube-nocookie.com/embed/${WORKSHOP_YOUTUBE_ID}?autoplay=1&rel=0`
  : '';
