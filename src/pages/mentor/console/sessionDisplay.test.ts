import { describe, expect, it } from 'vitest';
import type { SessionLogDto } from 'src/app/services/fullSupportApi';
import type { MentorBooking } from './sessionSources';
import {
  bookingDisplay,
  fullSupportDisplay,
  groupStudentSessions,
  scheduleScopes,
} from './sessionDisplay';

const now = new Date('2026-10-17T12:00:00Z').getTime();
const lesson = (extra: Partial<SessionLogDto> = {}) =>
  ({
    id: 'lesson-1',
    dateTime: '2026-10-16T10:00:00Z',
    duration: '1h',
    outcome: 'scheduled',
    done: false,
    attendance: 'unknown',
    actualDurationMinutes: null,
    sharedNotes: '',
    ...extra,
  }) as SessionLogDto;
const booking = (extra: Partial<MentorBooking> = {}) =>
  ({
    id: 'session-1',
    source: 'platform',
    dateTime: '2026-10-16T10:00:00Z',
    durationMinutes: 60,
    status: 'completed',
    studentUserId: 'student-1',
    raw: { type: 'individual60m', participants: [{ id: 'student-1' }] },
    ...extra,
  }) as MentorBooking;

describe('Attendance display and pending queue', () => {
  it('shows a held Full Support lesson with recorded attendance, actual minutes and notes', () => {
    expect(
      fullSupportDisplay(
        lesson({
          outcome: 'held',
          done: true,
          attendance: 'late',
          actualDurationMinutes: 45,
          sharedNotes: 'Next steps',
        }),
        now,
      ),
    ).toMatchObject({
      label: 'Held',
      variant: 'success',
      attendance: 'late',
      actualMinutes: 45,
      notes: 'Next steps',
    });
  });
  it('does not mistake Full Support no-shows for pending reports or teaching time', () => {
    expect(
      fullSupportDisplay(
        lesson({ outcome: 'student_no_show', actualDurationMinutes: 60 }),
        now,
      ),
    ).toMatchObject({
      label: 'Student no-show',
      attendance: 'Absent',
      actualMinutes: null,
    });
    expect(
      fullSupportDisplay(lesson({ outcome: 'mentor_no_show' }), now),
    ).toMatchObject({
      label: 'Mentor no-show',
      attendance: 'Not applicable',
      actualMinutes: null,
    });
  });
  it('keeps cancelled and rescheduled Full Support records explicit even with a stale done flag', () => {
    for (const [outcome, label] of [
      ['cancelled', 'Cancelled'],
      ['rescheduled', 'Rescheduled'],
    ] as const) {
      expect(
        fullSupportDisplay(lesson({ outcome, done: true }), now),
      ).toMatchObject({
        label,
        attendance: 'Not applicable',
        actualMinutes: null,
      });
    }
  });
  it('distinguishes upcoming and awaiting Full Support records', () => {
    expect(fullSupportDisplay(lesson(), now).label).toBe('Awaiting record');
    expect(
      fullSupportDisplay(lesson({ dateTime: '2026-10-18T10:00:00Z' }), now)
        .label,
    ).toBe('Upcoming');
  });
  it('does not infer attendance or actual minutes for legacy held lessons', () => {
    expect(
      fullSupportDisplay(lesson({ outcome: 'held', done: true }), now),
    ).toMatchObject({
      label: 'Held',
      attendance: 'Not recorded',
      actualMinutes: null,
    });
  });
});

describe('groupStudentSessions', () => {
  it('orders needs-action, upcoming and past, each in its own order', () => {
    const groups = groupStudentSessions([
      booking({ id: 'p1', status: 'completed', dateTime: '2026-10-01T10:00:00Z' }),
      booking({ id: 'u2', status: 'upcoming', dateTime: '2026-10-25T10:00:00Z' }),
      booking({ id: 'd1', status: 'report-due', dateTime: '2026-10-10T10:00:00Z' }),
      booking({ id: 'p2', status: 'cancelled', dateTime: '2026-10-12T10:00:00Z' }),
      booking({ id: 'u1', status: 'upcoming', dateTime: '2026-10-20T10:00:00Z' }),
      booking({ id: 'd2', status: 'report-due', dateTime: '2026-10-15T10:00:00Z' }),
    ]);
    expect(groups.needsAction.map((b) => b.id)).toEqual(['d2', 'd1']);
    expect(groups.upcoming.map((b) => b.id)).toEqual(['u1', 'u2']);
    expect(groups.past.map((b) => b.id)).toEqual(['p2', 'p1']);
  });

  it('returns empty groups for no bookings', () => {
    expect(groupStudentSessions([])).toEqual({ needsAction: [], upcoming: [], past: [] });
  });
});
