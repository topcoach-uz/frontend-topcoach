import { describe, expect, it } from "vitest";
import { analyzingStageIndex, overallProgressPct, showAnalyzingReassurance } from "./mm3-progress";

describe("overallProgressPct", () => {
  it("is cumulative across all questions, not per part", () => {
    expect(overallProgressPct(0, 30)).toBeCloseTo(100 / 30);
    expect(overallProgressPct(10, 30)).toBeCloseTo((11 / 30) * 100);
    expect(overallProgressPct(29, 30)).toBe(100);
  });
  it("clamps and handles empty totals", () => {
    expect(overallProgressPct(99, 30)).toBe(100);
    expect(overallProgressPct(-5, 30)).toBeCloseTo(0);
    expect(overallProgressPct(0, 0)).toBe(0);
  });
});

describe("analyzing stages", () => {
  it("rotates every 6 seconds and stays on the last label", () => {
    expect([0, 5, 6, 12, 18, 60].map(analyzingStageIndex)).toEqual([0, 0, 1, 2, 3, 3]);
  });
  it("reassures only after 20 seconds", () => {
    expect(showAnalyzingReassurance(19)).toBe(false);
    expect(showAnalyzingReassurance(20)).toBe(true);
  });
});
