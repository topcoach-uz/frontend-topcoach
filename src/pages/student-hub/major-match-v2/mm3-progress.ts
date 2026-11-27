/** Overall progress across every question (not per part): the answered-so-far count including the current question. */
export function overallProgressPct(currentIndex: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  const position = Math.min(Math.max(currentIndex + 1, 0), totalQuestions);
  return (position / totalQuestions) * 100;
}

export const ANALYZING_STAGE_SECONDS = 6;
export const ANALYZING_REASSURE_AFTER_SECONDS = 20;
export const ANALYZING_STAGES = [
  { key: "answers", fallback: "Reading your answers" },
  { key: "majors", fallback: "Matching majors" },
  { key: "universities", fallback: "Picking universities" },
  { key: "roadmap", fallback: "Drafting your roadmap" },
] as const;

/** Index of the stage label to show after a number of elapsed seconds; stays on the last stage once reached. */
export function analyzingStageIndex(elapsedSeconds: number): number {
  const index = Math.floor(Math.max(elapsedSeconds, 0) / ANALYZING_STAGE_SECONDS);
  return Math.min(index, ANALYZING_STAGES.length - 1);
}

export function showAnalyzingReassurance(elapsedSeconds: number): boolean {
  return elapsedSeconds >= ANALYZING_REASSURE_AFTER_SECONDS;
}
