import { describe, it, expect } from "vitest";
import {
  requirementRows,
  toggleRequirement,
  setRequirementCount,
} from "./requirementChecklistModel";

describe("application requirements progress", () => {
  it("migrates legacy counts without completing earlier essays when a later one is checked", () => {
    const original = {
      essays: { required: 3, completed: 1, prompts: ["A", "B", "C"] },
      custom: {
        items: [{ id: "portfolio", title: "Portfolio", completed: false }],
      },
      unknown: { keep: true },
    };
    const next = toggleRequirement(
      original,
      requirementRows(original)[2],
      true,
    );
    expect(requirementRows(next).map((r) => r.completed)).toEqual([
      true,
      false,
      true,
      false,
    ]);
    expect(next.essays.completed).toBe(2);
    expect(original.essays.completed).toBe(1);
    expect(next.unknown).toEqual({ keep: true });
    expect(
      requirementRows(
        toggleRequirement(next, requirementRows(next)[0], false),
      ).map((r) => r.completed),
    ).toEqual([false, false, true, false]);
  });
  it("preserves independent recommendation and supplement progress when resizing counts", () => {
    let value = {
      recommendations: { required: 3, submitted: 0, requested: 1 },
      supplements: { required: 2, completed: 0 },
    };
    value = toggleRequirement(
      value,
      requirementRows(value)[2],
      true,
    ) as typeof value;
    value = toggleRequirement(
      value,
      requirementRows(value)[4],
      true,
    ) as typeof value;
    expect(value.recommendations.submitted).toBe(1);
    expect(value.supplements.completed).toBe(1);
    const resized = setRequirementCount(value, "recommendations", 2);
    expect(resized.recommendations.submitted).toBe(0);
    expect(resized.recommendations.requested).toBe(1);
    expect(resized.supplements.completed).toBe(1);
  });
  it("toggles custom items, transcript, tests and interview without losing metadata", () => {
    const input = {
      transcripts: { status: "sent", verified: true },
      testScores: { required: ["IELTS"], submitted: [], status: "pending" },
      interviews: { required: true, type: "online" },
      custom: {
        items: [
          {
            id: "custom-1",
            title: "Portfolio",
            completed: false,
            type: "portfolio",
          },
        ],
      },
    };
    let next: Record<string, any> = input;
    for (const row of requirementRows(input))
      next = toggleRequirement(next, row, true);
    expect(requirementRows(next).every((r) => r.completed)).toBe(true);
    expect(next.transcripts.verified).toBe(true);
    expect(next.interviews.type).toBe("online");
    expect(next.custom.items[0].type).toBe("portfolio");
    for (const row of requirementRows(next))
      next = toggleRequirement(next, row, false);
    expect(requirementRows(next).every((r) => !r.completed)).toBe(true);
  });
});
