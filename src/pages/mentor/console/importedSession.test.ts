import { describe, expect, it, vi } from 'vitest';
import type { SessionLogDto } from 'src/app/services/fullSupportApi';
import { normalizeFullSupportSession } from './sessionSources';
import { bookingDateLabel, fullSupportDisplay, groupStudentSessions } from './sessionDisplay';
vi.mock('src/app/services/sessions', () => ({ useGetMySessionsQuery: vi.fn() }));
vi.mock('src/app/services/fullSupportApi', () => ({ useGetMentorSessionsQuery: vi.fn() }));

const imported = (status: string): SessionLogDto => ({
  id: 'imported', dateTime: '2026-11-27T19:00:00.000Z', duration: 'not recorded',
  description: '[Imported source report; date only — time/timezone unconfirmed]\nSource notes',
  done: status === 'reported', outcome: status === 'reported' ? 'held' : status === 'missed_unspecified' ? 'cancelled' : 'scheduled',
  sharedNotes: JSON.stringify({ batch: 'telegram-2026-11-24', sourceReported: true, sourceStatus: status, displayMidnightIsNotBookingTime: true }),
} as SessionLogDto);
describe('Imported historical session display', () => {
  it('does not turn an unconfirmed future row into a live appointment or an invented hour', () => {
    const booking = normalizeFullSupportSession(imported('scheduled'), 'Kumush');
    expect(booking.durationLabel).toBe('Duration not recorded');
    expect(booking.durationMinutes).toBe(0);
    expect(groupStudentSessions([booking]).upcoming).toEqual([]);
    expect(groupStudentSessions([booking]).needsAction).toEqual([]);
    expect(bookingDateLabel(booking)).toContain('28');
    expect(bookingDateLabel(booking)).toContain('time not recorded');
  });
  it('shows missed and reported records without exposing internal provenance JSON', () => {
    expect(fullSupportDisplay(imported('missed_unspecified')).label).toBe('Missed');
    const display = fullSupportDisplay(imported('reported'));
    expect(display.label).toBe('Reported held');
    expect(display.notes).not.toContain('telegram-2026-11-24');
    expect(normalizeFullSupportSession(imported('reported'), null).description).toBe('Source notes');
  });
});
