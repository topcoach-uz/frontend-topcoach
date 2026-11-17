import type { TaskDto } from 'src/app/services/fullSupportApi';

/** Today's calendar date (YYYY-MM-DD) in Tashkent — task deadlines are dates there. */
export function todayInTashkent(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(now);
}

/** Deadline as YYYY-MM-DD, or null when missing/invalid. */
export function deadlineDay(deadline?: string | null): string | null {
  if (!deadline) return null;
  const day = String(deadline).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/**
 * Overdue = the deadline day has fully passed and the student still owes work
 * (not yet submitted, or asked to revise). Submitted / approved work is never
 * overdue — the ball is in the reviewer's court.
 */
export function isTaskOverdue(task: Pick<TaskDto, 'deadline' | 'status'>, now = new Date()): boolean {
  if (task.status !== 'assigned' && task.status !== 'revision_requested') return false;
  const day = deadlineDay(task.deadline);
  return !!day && todayInTashkent(now) > day;
}

export function pendingExtension(task: Pick<TaskDto, 'extensionRequests'>) {
  return (task.extensionRequests ?? []).find((r) => r.status === 'pending') ?? null;
}

/** The most recent decided request, if it is newer than any pending one. */
export function latestDecidedExtension(task: Pick<TaskDto, 'extensionRequests'>) {
  const list = task.extensionRequests ?? [];
  const last = list[list.length - 1];
  return last && last.status !== 'pending' ? last : null;
}
