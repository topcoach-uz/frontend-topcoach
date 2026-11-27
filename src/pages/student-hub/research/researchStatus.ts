import type { WeekLockState } from 'src/app/services/research-prep/types';

/** One status per week, shared by the header, overview and module view. */
export type WeekStatus = 'locked' | 'not-started' | 'in-progress' | 'submitted' | 'revision' | 'graded';

export const WEEK_STATUS_LABEL: Record<WeekStatus, string> = {
  locked: 'Locked',
  'not-started': 'Not started',
  'in-progress': 'In progress',
  submitted: 'Submitted',
  revision: 'Revision requested',
  graded: 'Completed',
};

/** Any sign the student has touched the week: a video, a quiz attempt or a submission. */
export const hasStartedWeek = (lock: WeekLockState) =>
  Object.values(lock.videos).some((v) => v.completed || v.progressPercent > 0) ||
  lock.quiz.attempts > 0 ||
  lock.assignment.submissionStatus !== 'none';

export function weekStatus(lock: WeekLockState | undefined): WeekStatus {
  if (!lock || lock.weekLocked) return 'locked';
  switch (lock.assignment.submissionStatus) {
    case 'graded':
      return 'graded';
    case 'returned_for_revision':
      return 'revision';
    case 'submitted':
    case 'under_review':
      return 'submitted';
    default:
      return hasStartedWeek(lock) ? 'in-progress' : 'not-started';
  }
}

/** Submitted or graded — the week counts toward progress and unlocks the next one. */
export const isWeekDone = (status: WeekStatus) => status === 'submitted' || status === 'graded';

export function videoProgress(lock: WeekLockState | undefined) {
  const videos = Object.values(lock?.videos ?? {});
  return { watched: videos.filter((v) => v.completed).length, total: videos.length };
}

/** Weeks that end in a program milestone deliverable. */
export const MILESTONES: { weekNumber: number; title: string }[] = [
  { weekNumber: 2, title: 'Lab shortlist' },
  { weekNumber: 5, title: 'Research proposal' },
  { weekNumber: 8, title: 'Final portfolio' },
];

export const milestoneForWeek = (weekNumber: number) =>
  MILESTONES.find((m) => m.weekNumber === weekNumber);
