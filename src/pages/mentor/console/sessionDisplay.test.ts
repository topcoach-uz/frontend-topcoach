import { describe, expect, it } from 'vitest';
import type { SessionLogDto } from 'src/app/services/fullSupportApi';
import type { MentorBooking } from './sessionSources';
import {
  bookingDisplay,
  fullSupportDisplay,
  needsStandaloneAttendance,
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
    attendanceRecord: null,
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
  it('includes ended standalone bookings even when a report already marked them completed', () => {
    const reported = booking({
      report: {
        topicsCovered: 'Planning',
        submittedAt: '2026-10-16T12:00:00Z',
      },
    });
    expect(needsStandaloneAttendance(reported, now)).toBe(true);
    expect(bookingDisplay(reported, now).label).toBe('Attendance due');
    expect(scheduleScopes([reported], now).attendance).toEqual([reported]);
  });
  it('excludes future, ongoing, cancelled, group, unbooked and Full Support sessions', () => {
    const fixtures = [
      booking({ dateTime: '2026-10-18T10:00:00Z', status: 'upcoming' }),
      booking({ dateTime: '2026-10-17T11:30:00Z', status: 'upcoming' }),
      booking({ status: 'cancelled' }),
      booking({
        raw: {
          type: 'Group',
          participants: [{ id: 'student-1' }],
        } as unknown as MentorBooking['raw'],
      }),
      booking({
        raw: {
          type: 'individual60m',
          participants: [],
        } as unknown as MentorBooking['raw'],
      }),
      booking({
        raw: {
          type: 'individual60m',
          participants: [{ id: 'student-1' }, { id: 'student-2' }],
        } as unknown as MentorBooking['raw'],
      }),
      booking({ source: 'full-support', raw: lesson() }),
    ];
    for (const fixture of fixtures)
      expect(needsStandaloneAttendance(fixture, now)).toBe(false);
    expect(scheduleScopes(fixtures, now).attendance).toEqual([]);
  });
  it('removes recorded attendance from its queue without hiding a remaining report requirement', () => {
    const recorded = booking({
      status: 'report-due',
      attendanceRecord: {
        outcome: 'held',
        attendance: 'present',
        actualDurationMinutes: 50,
        sharedNotes: 'Notes',
        recordedAt: '2026-10-16T12:00:00Z',
        recordedByUserId: 'mentor-1',
      },
    });
    expect(scheduleScopes([recorded], now).attendance).toEqual([]);
    expect(scheduleScopes([recorded], now).due).toEqual([recorded]);
    expect(bookingDisplay(recorded, now)).toMatchObject({
      label: 'Held',
      attendance: 'present',
      actualMinutes: 50,
      notes: 'Notes',
    });
  });
  it('shows recorded platform no-shows in the workspace and excludes them from attendance due', () => {
    for (const [outcome, label] of [
      ['student_no_show', 'Student no-show'],
      ['mentor_no_show', 'Mentor no-show'],
    ] as const) {
      const recorded = booking({
        attendanceRecord: { outcome } as NonNullable<
          MentorBooking['attendanceRecord']
        >,
      });
      expect(bookingDisplay(recorded, now).label).toBe(label);
      expect(needsStandaloneAttendance(recorded, now)).toBe(false);
    }
  });
  it('uses the same Full Support outcome display in booking rows and the session log', () => {
    const raw = lesson({ outcome: 'student_no_show' });
    expect(
      bookingDisplay(booking({ source: 'full-support', raw }), now),
    ).toEqual(fullSupportDisplay(raw, now));
  });
});
