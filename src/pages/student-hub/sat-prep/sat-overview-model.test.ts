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
