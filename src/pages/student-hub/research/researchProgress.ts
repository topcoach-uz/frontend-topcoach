import type { WeekLockState } from 'src/app/services/research-prep/types';

export interface ResearchProgress {
  /** Weeks whose assignment has been submitted (any status). */
  weeksCompleted: number;
  /** 0–100. Videos, quiz and assignment are a third of each week. */
  overallPercent: number;
  /** First week whose assignment is not submitted yet (last week if all are). */
  currentWeekNumber: number;
}

const isSubmitted = (state: WeekLockState) => state.assignment.submissionStatus !== 'none';

const weekFraction = (state: WeekLockState) => {
  const videos = Object.values(state.videos ?? {});
  const videoPart = videos.length ? videos.filter((v) => v.completed).length / videos.length : 1;
  return (videoPart + (state.quiz.passed ? 1 : 0) + (isSubmitted(state) ? 1 : 0)) / 3;
};

/**
 * Program progress from the per-week lock state — the same data the module
 * view uses for "Week N complete", so the two can never disagree.
 */
export function computeResearchProgress(states: WeekLockState[] | undefined): ResearchProgress {
  const list = states ?? [];
  const weeksCompleted = list.filter(isSubmitted).length;
  const overallPercent = list.length
    ? Math.round((list.reduce((sum, s) => sum + weekFraction(s), 0) / list.length) * 100)
    : 0;
  const currentWeekNumber =
    list.find((s) => !isSubmitted(s))?.weekNumber ?? list[list.length - 1]?.weekNumber ?? 1;
  return { weeksCompleted, overallPercent, currentWeekNumber };
}
