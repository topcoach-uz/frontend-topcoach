import type { SessionLogDto } from 'src/app/services/fullSupportApi';
import type { MentorBooking } from './sessionSources';
import type { McPillVariant } from './components/McPill';

export type LessonDisplay = {
  label: string;
  variant: McPillVariant;
  attendance: string;
  actualMinutes: number | null;
  notes: string;
};

export function fullSupportDisplay(
  lesson: SessionLogDto,
  now = Date.now(),
): LessonDisplay {
  const details = {
    attendance:
      lesson.attendance && lesson.attendance !== 'unknown'
        ? lesson.attendance
        : 'Not recorded',
    actualMinutes:
      lesson.outcome === 'held' ? (lesson.actualDurationMinutes ?? null) : null,
    notes: lesson.sharedNotes ?? '',
  };
  switch (lesson.outcome) {
    case 'held':
      return { ...details, label: 'Held', variant: 'success' };
    case 'student_no_show':
      return {
        ...details,
        attendance: 'Absent',
        label: 'Student no-show',
        variant: 'warning',
      };
    case 'mentor_no_show':
      return {
        ...details,
        attendance: 'Not applicable',
        label: 'Mentor no-show',
        variant: 'warning',
      };
    case 'cancelled':
      return {
        ...details,
        attendance: 'Not applicable',
        label: 'Cancelled',
        variant: 'neutral',
      };
    case 'rescheduled':
      return {
        ...details,
        attendance: 'Not applicable',
        label: 'Rescheduled',
        variant: 'neutral',
      };
  }
  if (lesson.done) return { ...details, label: 'Held', variant: 'success' };
  const awaiting = new Date(lesson.dateTime).getTime() <= now;
  return {
    ...details,
    label: awaiting ? 'Awaiting record' : 'Upcoming',
    variant: awaiting ? 'danger' : 'info',
  };
}

export function bookingDisplay(booking: MentorBooking, now = Date.now()): LessonDisplay {
  if (booking.source === 'full-support') return fullSupportDisplay(booking.raw as SessionLogDto, now);
  return { label: booking.status === 'report-due' ? 'Report due' : booking.status === 'completed' ? 'Completed' : booking.status === 'cancelled' ? 'Cancelled' : 'Upcoming', variant: booking.status === 'report-due' ? 'danger' : booking.status === 'completed' ? 'success' : 'neutral', attendance: '', actualMinutes: null, notes: '' };
}

export function scheduleScopes<T extends Pick<MentorBooking, 'dateTime' | 'status'>>(bookings: T[], now = Date.now()) {
  const asc = (a: T, b: T) =>
    new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
  return {
    upcoming: bookings.filter((b) => b.status === 'upcoming').sort(asc),
    due: bookings
      .filter((b) => b.status === 'report-due')
      .sort((a, b) => -asc(a, b)),
    past: bookings
      .filter((b) => b.status === 'completed' || b.status === 'report-due')
      .sort((a, b) => -asc(a, b)),
    cancelled: bookings
      .filter((b) => b.status === 'cancelled')
      .sort((a, b) => -asc(a, b)),
  };
}
