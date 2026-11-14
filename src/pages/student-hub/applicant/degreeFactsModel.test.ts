import { describe, expect, it } from "vitest";
import { buildDegreeGlance, deadlineTile, majorChoiceTiming, shortQualification } from "./degreeFactsModel";

const tr = (v: unknown) => (typeof v === "string" ? v : "");
const NOW = new Date("2026-11-14T00:00:00Z");

describe("degree facts", () => {
  it("derives short qualifications conservatively", () => {
    expect(shortQualification("Bachelor of Science (SB)")).toBe("SB");
    expect(shortQualification("Bachelor of Science in Physics")).toBeUndefined();
    expect(shortQualification("Bachelor of Science", "Computer Science (Course 6-3)")).toBeUndefined();
    expect(shortQualification("Bachelor of Science", "Physics (SB)")).toBe("SB");
    expect(shortQualification("Undergraduate study area")).toBeUndefined();
    expect(shortQualification("Diploma")).toBeUndefined();
  });

  it("finds major timing only when clearly stated", () => {
    expect(majorChoiceTiming("Students declare their major at the end of first year.")).toBe("End of first year");
    expect(majorChoiceTiming("You choose a major in the second year.")).toBe("Start of second year");
    expect(majorChoiceTiming("The major includes a first year project.", "Courses run for four years.")).toBeUndefined();
    expect(majorChoiceTiming(null, undefined)).toBeUndefined();
  });

  it("labels past deadlines as last cycle and prefers upcoming dates", () => {
    const past = [{ name: "Regular Decision: January 6, 2026\n\nGraduate:\nDecember 1, 2030", date: "2026-01-06T00:00:00Z" }] as never;
    expect(deadlineTile({ deadlineAt: null }, past, tr, NOW)).toEqual({ value: "6 January 2026", sub: "Last cycle" });
    const mixed = [{ name: "A: January 6, 2026", date: "" }, { name: "B: March 1, 2027", date: "" }] as never;
    expect(deadlineTile({ deadlineAt: null }, mixed, tr, NOW)).toEqual({ value: "1 March 2027" });
    expect(deadlineTile({ deadlineAt: "2027-01-05T00:00:00Z" }, past, tr, NOW)).toEqual({ value: "5 January 2027" });
    expect(deadlineTile({ deadlineAt: null }, [], tr, NOW)).toBeUndefined();
  });

  it("builds glance tiles and omits missing data", () => {
    const degree = { degreeType: "Bachelor of Science (SB)", feesSummary: "University guidance: Tuition is $62,980 in 2026-27.", entrySummary: "Declare a major by the end of first year.", deadlineAt: null } as never;
    expect(buildDegreeGlance(degree, [], tr, NOW).map((t) => [t.id, t.value])).toEqual([["qualification", "SB"], ["choose-major", "End of first year"], ["tuition", "US$62,980"]]);
    expect(buildDegreeGlance({ degreeType: "Undergraduate study area", feesSummary: null, deadlineAt: null } as never, [], tr, NOW)).toEqual([]);
  });
});
