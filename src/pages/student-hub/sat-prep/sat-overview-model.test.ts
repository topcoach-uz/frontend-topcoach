import { describe, it, expect } from "vitest";
import { scoreBreakdown, weakestSkills } from "./sat-overview-model";
import type { SessionRecord } from "src/app/services/sat-prep/local-progress";
const mock = (
  id: string,
  section: SessionRecord["section"],
  score: number,
  date: string,
): SessionRecord => ({
  id,
  section,
  estimatedScore: score,
  completedAt: date,
  mode: "mock",
  title: id,
  totalQ: 44,
  correctQ: 30,
  durationSec: 4200,
});
describe("SAT overview scores", () => {
  it("does not fabricate a combined score from one section", () => {
    expect(
      scoreBreakdown([mock("m", "math", 650, "2026-10-05")]).total,
    ).toBeNull();
  });
  it("uses latest estimates for both sections regardless of response order", () => {
    expect(
      scoreBreakdown([
        mock("old", "math", 600, "2026-10-01"),
        mock("rw", "reading-writing", 630, "2026-10-05"),
        mock("new", "math", 650, "2026-10-06"),
      ]).total,
    ).toBe(1280);
  });
  it("ignores practice scores and invalid section estimates", () => {
    expect(
      scoreBreakdown([
        { ...mock("p", "math", 650, "2026-10-05"), mode: "practice" },
        mock("bad", "math", 1280, "2026-10-06"),
      ]).math,
    ).toBeUndefined();
  });
  it("excludes unattempted skills and leaves cached data untouched", () => {
    const rows = [
      {
        section: "math" as const,
        domain: "Algebra",
        skill: "Linear",
        attempts: 10,
        correct: 8,
        pct: 80,
      },
      {
        section: "math" as const,
        domain: "Algebra",
        skill: "Systems",
        attempts: 10,
        correct: 6,
        pct: 60,
      },
      {
        section: "math" as const,
        domain: "Geometry",
        skill: "Circles",
        attempts: 0,
        correct: 0,
        pct: 0,
      },
    ];
    expect(weakestSkills(rows).map((s) => s.skill)).toEqual([
      "Systems",
      "Linear",
    ]);
    expect(rows[0].skill).toBe("Linear");
  });
});

import {
  baselineTotal,
  continueAction,
  journeyScale,
  resultInsights,
  streakState,
} from "./sat-overview-model";
describe("SAT result + overview helpers", () => {
  it("computes delta and target gap", () => {
    const prev = mock("a", "math", 600, "2026-01-01T10:00:00Z");
    const saved = mock("b", "math", 640, "2026-01-05T10:00:00Z");
    const out = resultInsights({ saved, sessions: [prev, saved], combined: 1250, target: 1400 });
    expect(out.find((i) => i.key === "delta")?.value).toBe("+40 pts");
    expect(out.find((i) => i.key === "target")?.value).toBe("150 pts");
  });
  it("marks first attempt", () => {
    const saved = mock("b", "math", 640, "2026-01-05T10:00:00Z");
    const out = resultInsights({ saved, sessions: [saved], combined: null, target: null });
    expect(out.find((i) => i.key === "delta")?.value).toBe("First");
  });
  it("scales journey from baseline to target", () => {
    const s = journeyScale({ current: 1100, baseline: 1000, target: 1200 });
    expect(s.pct).toBe(50);
    expect(s.toGo).toBe(100);
    expect(journeyScale({ current: 1000, baseline: null, target: null }).max).toBe(1600);
  });
  it("finds baseline", () => {
    const rows = [
      mock("1", "math", 500, "2026-01-01T00:00:00Z"),
      mock("2", "reading-writing", 520, "2026-01-02T00:00:00Z"),
      mock("3", "math", 600, "2026-02-01T00:00:00Z"),
    ];
    expect(baselineTotal(rows)).toBe(1020);
  });
  it("picks the continue action", () => {
    expect(continueAction({ resume: { answered: 3, total: 10 }, hasScore: true, mockCount: 2, focusSkill: "x" }).kind).toBe("resume");
    expect(continueAction({ resume: null, hasScore: false, mockCount: 0, focusSkill: null }).kind).toBe("first-mock");
    expect(continueAction({ resume: null, hasScore: true, mockCount: 2, focusSkill: "Algebra" }).kind).toBe("practice");
    expect(continueAction({ resume: null, hasScore: true, mockCount: 2, focusSkill: null }).kind).toBe("next-mock");
  });
  it("flags streak at risk", () => {
    const now = new Date(2026, 5, 10, 12);
    expect(streakState({ count: 4, lastPracticeDate: "2026-06-09", sessions: [], now }).atRisk).toBe(true);
    expect(streakState({ count: 4, lastPracticeDate: "2026-06-10", sessions: [], now }).doneToday).toBe(true);
    expect(streakState({ count: 0, lastPracticeDate: null, sessions: [], now }).atRisk).toBe(false);
  });
});
