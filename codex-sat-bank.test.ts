import { describe, it, expect } from "vitest";
import {
  localSatBank,
  localAggregateCounts,
  localSkillCounts,
  filterLocalBank,
  composeLocalMock,
} from "./codex-sat-bank";
describe("file-backed SAT preview", () => {
  it("loads the complete bank with stable unique IDs", () => {
    expect(localSatBank).toHaveLength(3460);
    expect(new Set(localSatBank.map((q) => q.questionId)).size).toBe(3460);
    expect(localAggregateCounts.reduce((n, g) => n + g.count, 0)).toBe(3460);
    expect(localSkillCounts.reduce((n, g) => n + g.count, 0)).toBe(3460);
    expect(
      localSatBank.filter((q) => !q.tags.includes("source:topcoach")),
    ).toHaveLength(3444);
  });
  it("filters a real skill and difficulty with pagination", () => {
    const p = new URLSearchParams({
      section: "math",
      skill: "Linear functions",
      difficulty: "hard",
      limit: "10",
      offset: "2",
    });
    const r = filterLocalBank(p);
    expect(r.items).toHaveLength(10);
    expect(r.total).toBeGreaterThan(12);
    expect(
      r.items.every(
        (q) =>
          q.skill === "Linear functions" &&
          q.section === "math" &&
          q.difficulty === "hard",
      ),
    ).toBe(true);
  });
  it("loads sixteen traceable additions across all eight domains with valid taxonomy", () => {
    const additions = localSatBank.filter((q) =>
      q.tags.includes("source:topcoach"),
    );
    expect(additions).toHaveLength(16);
    expect(new Set(additions.map((q) => q.externalId)).size).toBe(16);
    const sourceTaxonomy = new Set(
      localSatBank
        .filter((q) => !q.tags.includes("source:topcoach"))
        .map((q) => JSON.stringify([q.domain, q.skill, q.skillCode])),
    );
    for (const q of additions) {
      expect(
        sourceTaxonomy.has(JSON.stringify([q.domain, q.skill, q.skillCode])),
      ).toBe(true);
      expect(q.tags).toContain("review:educator-pending");
      if (q.section === "reading-writing") expect(q.passageHtml).toBeTruthy();
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices!.map((c) => c.text)).size).toBe(4);
      expect(q.choices!.some((c) => c.label === q.correctAnswer)).toBe(true);
    }
    for (const domain of new Set(additions.map((q) => q.domain))) {
      expect(additions.filter((q) => q.domain === domain)).toHaveLength(2);
    }
  });
  it("independently checks the answers of the original Math batch", () => {
    const choice = (n: number) => {
      const q = localSatBank.find(
        (q) => q.questionId === `TC-MATH-${String(n).padStart(3, "0")}`,
      )!;
      return q
        .choices!.find((c) => c.label === q.correctAnswer)!
        .text.replace(/<[^>]+>/g, "");
    };
    const x = Number(choice(1));
    expect(4 * (2 * x - 3)).toBe(3 * x + 23);
    const adults = Number(choice(2));
    expect(14 * adults + 9 * (18 - adults)).toBe(207);
    const roots = [(7 - Math.sqrt(49 - 40)) / 2, (7 + Math.sqrt(49 - 40)) / 2];
    expect(Number(choice(3))).toBe(roots[1] - roots[0]);
    expect(parseFloat(choice(4))).toBeCloseTo((100 * (120 - 120 * 0.75)) / 120);
    expect(Number(choice(5)) / 15).toBe(84 / 6);
    expect(Number(choice(6).replace("$", ""))).toBeCloseTo(
      80 * (1 - 0.15) * (1 + 0.1),
    );
    expect(Number(choice(7).replace("π", ""))).toBe(3 * 3 * 8);
    const [numerator, denominator] = choice(8).split("/").map(Number);
    expect(numerator / denominator).toBeCloseTo(
      Math.sqrt(13 ** 2 - 12 ** 2) / 13,
    );
  });
  it("composes full seeded section mocks without duplicate questions", () => {
    for (const section of ["math", "reading-writing"] as const) {
      const input = {
        section,
        totalQuestions: section === "math" ? 44 : 54,
        seed: 1001,
        distribution: { easy: 0.25, medium: 0.5, hard: 0.25 },
      };
      const a = composeLocalMock(input);
      expect(a).toHaveLength(input.totalQuestions);
      expect(a.every((q) => q.section === section)).toBe(true);
      expect(new Set(a.map((q) => q.id)).size).toBe(a.length);
      expect(a.map((q) => q.id)).toEqual(
        composeLocalMock(input).map((q) => q.id),
      );
    }
  });
});
