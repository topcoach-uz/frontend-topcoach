import { describe, expect, it } from "vitest";
import { filterUniversityRows } from "src/app/services/universities/universityQuery";
import { buildUniversityFieldOptions, buildUniversitySubjectOptions, isUsableUniversityFieldName } from "./universityFieldOptions";

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

describe("university subject options", () => {
  const ug = (name: string) => ({ type: "undergraduate", name });
  it("groups Accounting variants but keeps combos separate", () => {
    const options = buildUniversitySubjectOptions([
      ug("Accounting"), ug("Accounting (BSc)"), ug("BSc Accounting"),
      ug("Accounting & Finance"), ug("Accounting and Finance"),
    ]);
    expect(options.map((o) => o.value)).toEqual(["accounting", "accounting and finance"]);
    expect(options[0].label).toBe("Accounting");
    expect(options[0].variants).toHaveLength(3);
    expect(options[1].variants).toHaveLength(2);
  });
  it("merges zero-width duplicates and drops graduate and empty names", () => {
    const options = buildUniversitySubjectOptions([
      ug("Bio​logy"), ug("Biology"), ug("Finance (MBA)"), ug("​"), ug("  "), { type: "graduate", name: "Physics" },
    ]);
    expect(options.map((o) => o.label)).toEqual(["Biology"]);
  });
  it("filters by subject key across variants", () => {
    const rows = [
      { id: "a", ugMajorKeys: ["accounting (bsc)"] },
      { id: "b", ugMajorKeys: ["accounting and finance"] },
      { id: "c", ugMajorKeys: ["physics"] },
    ];
    expect(filterUniversityRows(rows, { majorName: "accounting" }).map((r) => r.id)).toEqual(["a"]);
    expect(filterUniversityRows(rows, { majorName: "Accounting (BSc)" }).map((r) => r.id)).toEqual(["a"]);
  });
});
