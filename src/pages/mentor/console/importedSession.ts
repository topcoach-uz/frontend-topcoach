import type { SessionLogDto } from 'src/app/services/fullSupportApi';

export function importedSessionInfo(session: Pick<SessionLogDto, 'sharedNotes'>) {
  try {
    const value = JSON.parse(session.sharedNotes || 'null');
    return value && typeof value === 'object' && value.sourceReported === true && typeof value.batch === 'string'
      ? value as { sourceStatus?: string; datePrecision?: string; sourceTime?: string; sourceTimezone?: string; displayMidnightIsNotBookingTime?: boolean }
      : null;
  } catch { return null; }
}
