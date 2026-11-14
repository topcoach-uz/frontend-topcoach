import { describe, expect, it } from "vitest";
import { finderCopy, type DegreeOption } from "./universityDegreeOptions";

const opt = (group: DegreeOption["group"]): DegreeOption => ({ value: group, label: group, group });

describe("finderCopy", () => {
  it("adapts to the available groups and puts the count in the placeholder", () => {
    expect(finderCopy([opt("Study areas"), opt("Study areas")])).toMatchObject({ label: "Find a study area", placeholder: "Search 2 study areas…" });
    expect(finderCopy([opt("Degrees")]).placeholder).toBe("Search 1 degrees…");
    expect(finderCopy([opt("Degrees"), opt("Study areas")])).toMatchObject({ label: "Find a degree or study area", placeholder: "Search 2 degrees and study areas…" });
  });
});
