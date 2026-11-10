import type { SessionLogDto } from 'src/app/services/fullSupportApi';

export function lessonMinutes(value: string | undefined | null): number {
  const match = String(value ?? '').trim().match(/^(\d+(?:\.\d+)?)\s*(h|m|min)?$/i);
  if (!match) return 60;
  const minutes = Number(match[1]) * (match[2]?.toLowerCase().startsWith('m') ? 1 : 60);
  return Number.isInteger(minutes) && minutes > 0 && minutes <= 480 ? minutes : 60;
}

export function lessonOutcome(lesson: SessionLogDto): SessionLogDto['outcome'] {
  return lesson.outcome ?? (lesson.done ? 'held' : 'scheduled');
}

export function lessonLabel(lesson: SessionLogDto): string {
  const outcome = lessonOutcome(lesson);
  if (outcome === 'held') return 'Completed';
  if (outcome === 'student_no_show') return 'Student absent';
  if (outcome === 'mentor_no_show') return 'Mentor absent';
  if (outcome === 'cancelled') return 'Cancelled';
  return new Date(lesson.dateTime).getTime() + lessonMinutes(lesson.duration) * 60_000 < Date.now()
    ? 'Attendance due' : 'Upcoming';
}

export function lessonError(error: unknown): string {
  const value = (error as { data?: { message?: unknown } })?.data?.message;
  return typeof value === 'string' ? value : 'Could not save the lesson. Please try again.';
}
