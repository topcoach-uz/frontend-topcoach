import { describe, expect, it } from "vitest";
import { buildPreview, finderCopy, type DegreeOption } from "./universityDegreeOptions";

const opt = (group: DegreeOption["group"]): DegreeOption => ({ value: group, label: group, group });

describe("finderCopy", () => {
  it("adapts to the available groups and puts the count in the placeholder", () => {
    expect(finderCopy([opt("Study areas"), opt("Study areas")])).toMatchObject({ label: "Find a study area", placeholder: "Search 2 study areas…" });
    expect(finderCopy([opt("Degrees")]).placeholder).toBe("Search 1 degrees…");
    expect(finderCopy([opt("Degrees"), opt("Study areas")])).toMatchObject({ label: "Find a degree or study area", placeholder: "Search 2 degrees and study areas…" });
  });
});

describe("buildPreview", () => {
  const ctx = {
    universityId: "u1", degrees: [], majors: [{ id: "cs", type: "undergraduate", name: "Computer Science" }],
    links: [{ majorId: "cs", degreeLevel: "undergraduate", url: "https://u.edu/cs", programmeName: "BSc" }],
    content: [{ universityId: "u1", majorId: "cs", schemaVersion: 1, reviewStatus: "approved", verifiedAt: "2026-11-01", content: { curriculumSummary: "Algorithms and systems.", entrySummary: "Strong maths." } }],
  } as never;
  const area = (over: Partial<DegreeOption> = {}): DegreeOption => ({ value: "area:Computer Science", label: "Computer Science", group: "Study areas", majorId: "cs", to: "/x", ...over });

  it("uses verified study-area content and the verified official link", () => {
    expect(buildPreview(area(), ctx)).toMatchObject({ curriculum: "Algorithms and systems.", entry: "Strong maths.", url: "https://u.edu/cs", to: "/x", pending: false });
  });
  it("is pending when there is no content", () => {
    const empty = { ...(ctx as object), content: [] } as never;
    expect(buildPreview(area(), empty)).toMatchObject({ pending: true, url: "https://u.edu/cs" });
  });
  it("keeps only the external link when there is no internal page", () => {
    expect(buildPreview(area({ majorId: undefined, to: undefined, value: "area:Law", label: "Law", href: "https://u.edu/law" }), ctx)).toMatchObject({ pending: true, url: "https://u.edu/law", to: undefined });
  });
});
