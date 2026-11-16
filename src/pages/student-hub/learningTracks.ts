export interface TrackProgress {
  completed: number;
  total: number;
  progressPct: number;
  unitLabel: string; // "lessons" | "weeks"
}

export const ALMOST_THERE_PCT = 75;

/** Units left in a track, never negative. */
export function unitsLeft(track: Pick<TrackProgress, 'completed' | 'total'>): number {
  return Math.max(0, track.total - track.completed);
}

/** "5 lessons left" / "1 week left" / null when there is nothing left or no total. */
export function unitsLeftText(track: TrackProgress): string | null {
  if (track.total <= 0) return null;
  const left = unitsLeft(track);
  if (left === 0) return null;
  const unit = track.unitLabel.replace(/s$/, '');
  return `${left} ${left === 1 ? unit : track.unitLabel} left`;
}

/** Goal-gradient nudge: true from 75% until the track is finished. */
export function isAlmostThere(track: Pick<TrackProgress, 'progressPct'>): boolean {
  return track.progressPct >= ALMOST_THERE_PCT && track.progressPct < 100;
}

/**
 * The in-progress track with the highest completion %; unfinished tracks only.
 * Tracks that were never started (0%) are only chosen when nothing is in progress.
 */
export function pickMostProgressed<T extends TrackProgress>(tracks: readonly T[]): T | null {
  const open = tracks.filter((t) => t.total > 0 && t.progressPct < 100);
  if (!open.length) return null;
  const started = open.filter((t) => t.progressPct > 0);
  const pool = started.length ? started : open;
  return pool.reduce((best, t) => (t.progressPct > best.progressPct ? t : best));
}
