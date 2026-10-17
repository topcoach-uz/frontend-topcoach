import { SessionTypeEnum } from 'src/app/api/Api';
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

export function needsStandaloneAttendance(
  booking: MentorBooking,
  now = Date.now(),
): boolean {
  if (
    booking.source !== 'platform' ||
    booking.status === 'cancelled' ||
    booking.attendanceRecord ||
    !('type' in booking.raw)
  )
    return false;
  if (
    ![SessionTypeEnum.Individual30M, SessionTypeEnum.Individual60M].includes(
      booking.raw.type,
    )
  )
    return false;
  return (
    booking.raw.participants?.length === 1 &&
    new Date(booking.dateTime).getTime() + booking.durationMinutes * 60_000 <=
      now
  );
}

export function bookingDisplay(
  booking: MentorBooking,
  now = Date.now(),
): LessonDisplay {
  if (booking.source === 'full-support')
    return fullSupportDisplay(booking.raw as SessionLogDto, now);
  const record = booking.attendanceRecord;
  const details = {
    attendance:
      record?.attendance === 'unknown'
        ? 'Not applicable'
        : (record?.attendance ?? 'Not recorded'),
    actualMinutes:
      record?.outcome === 'held' ? record.actualDurationMinutes : null,
    notes: record?.sharedNotes ?? '',
  };
  if (booking.status === 'cancelled')
    return { ...details, label: 'Cancelled', variant: 'neutral' };
  if (record?.outcome === 'student_no_show')
    return { ...details, label: 'Student no-show', variant: 'warning' };
  if (record?.outcome === 'mentor_no_show')
    return { ...details, label: 'Mentor no-show', variant: 'warning' };
  if (needsStandaloneAttendance(booking, now))
    return { ...details, label: 'Attendance due', variant: 'danger' };
  if (record?.outcome === 'held')
    return { ...details, label: 'Held', variant: 'success' };
  if (booking.status === 'report-due')
    return { ...details, label: 'Report due', variant: 'danger' };
  if (booking.status === 'completed')
    return { ...details, label: 'Completed', variant: 'success' };
  return { ...details, label: 'Upcoming', variant: 'info' };
}

export function scheduleScopes(bookings: MentorBooking[], now = Date.now()) {
  const asc = (a: MentorBooking, b: MentorBooking) =>
    new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
  return {
    upcoming: bookings.filter((b) => b.status === 'upcoming').sort(asc),
    due: bookings
      .filter((b) => b.status === 'report-due')
      .sort((a, b) => -asc(a, b)),
    attendance: bookings
      .filter((b) => needsStandaloneAttendance(b, now))
      .sort((a, b) => -asc(a, b)),
    past: bookings
      .filter((b) => b.status === 'completed' || b.status === 'report-due')
      .sort((a, b) => -asc(a, b)),
    cancelled: bookings
      .filter((b) => b.status === 'cancelled')
      .sort((a, b) => -asc(a, b)),
  };
}
