import { describe, expect, it } from "vitest";
import { buildUniversityFieldOptions, isUsableUniversityFieldName } from "./universityFieldOptions";

describe("university field options", () => {
  it.each([
    '"Faculty of Social Sciences',
    "(Cross-Genre)",
    "(Emphasis in composition or performance: voice)",
    "(Note: School of Mumin appears to be a typo)",
    "(Offered jointly by two departments)",
    "Faculty of Arts:",
    "Department of Biology",
    "School for Cross-faculty Studies",
    "Humanities:",
    "includes Comparative Literature, French and Italian,",
    "And more (please refer to the official website for a complete list)",
  ])("removes catalogue metadata: %s", (name) => {
    expect(isUsableUniversityFieldName(name)).toBe(false);
  });

  it.each([
    "Biology",
    "Social Sciences",
    "School Psychology",
    "College Student Development",
    "Cross-Cultural Studies",
  ])("keeps legitimate fields: %s", (name) => {
    expect(isUsableUniversityFieldName(name)).toBe(true);
  });

  it("deduplicates clean undergraduate names", () => {
    expect(buildUniversityFieldOptions([
      { type: "undergraduate", name: "Biology" },
      { type: "undergraduate", name: { en: "biology" } },
      { type: "undergraduate", name: "Department of Biology" },
      { type: "graduate", name: "Physics" },
    ])).toEqual([{ value: "Biology", label: "Biology" }]);
  });
});
