import { describe, expect, it } from 'vitest';
import type { WeekLockState } from 'src/app/services/research-prep/types';
import { computeResearchProgress } from './researchProgress';

const week = (
  weekNumber: number,
  { videosDone = 0, videos = 2, passed = false, submitted = false }: { videosDone?: number; videos?: number; passed?: boolean; submitted?: boolean } = {},
): WeekLockState =>
  ({
    weekId: `w${weekNumber}`,
    weekNumber,
    weekLocked: false,
    videos: Object.fromEntries(
      Array.from({ length: videos }, (_, i) => [`v${weekNumber}-${i}`, { completed: i < videosDone, progressPercent: i < videosDone ? 100 : 0 }]),
    ),
    quiz: { locked: false, passed, bestScorePercent: passed ? 100 : 0, attempts: passed ? 1 : 0 },
    assignment: { locked: !passed, submissionStatus: submitted ? 'submitted' : 'none' },
  }) as unknown as WeekLockState;

describe('computeResearchProgress', () => {
  it('starts at zero', () => {
    const weeks = Array.from({ length: 8 }, (_, i) => week(i + 1));
    expect(computeResearchProgress(weeks)).toEqual({ weeksCompleted: 0, overallPercent: 0, currentWeekNumber: 1 });
  });

  it('counts a submitted week and moves to the next one', () => {
    const weeks = [week(1, { videosDone: 2, passed: true, submitted: true }), ...Array.from({ length: 7 }, (_, i) => week(i + 2))];
    const result = computeResearchProgress(weeks);
    expect(result.weeksCompleted).toBe(1);
    expect(result.overallPercent).toBe(13); // 1 of 8 weeks
    expect(result.currentWeekNumber).toBe(2);
  });

  it('moves the percentage for partial work inside a week', () => {
    const weeks = [week(1, { videosDone: 2, passed: true }), ...Array.from({ length: 7 }, (_, i) => week(i + 2))];
    const result = computeResearchProgress(weeks);
    expect(result.weeksCompleted).toBe(0);
    expect(result.overallPercent).toBe(8); // 2/3 of one week out of 8
  });

  it('handles all weeks done and missing data', () => {
    const weeks = Array.from({ length: 8 }, (_, i) => week(i + 1, { videosDone: 2, passed: true, submitted: true }));
    expect(computeResearchProgress(weeks)).toEqual({ weeksCompleted: 8, overallPercent: 100, currentWeekNumber: 8 });
    expect(computeResearchProgress(undefined)).toEqual({ weeksCompleted: 0, overallPercent: 0, currentWeekNumber: 1 });
  });
});
