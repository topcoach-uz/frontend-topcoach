import { describe, expect, it } from "vitest";
import { finderCopy, type DegreeOption } from "./universityDegreeOptions";

const opt = (group: DegreeOption["group"]): DegreeOption => ({ value: group, label: group, group });

describe("finderCopy", () => {
  it("adapts to the available groups", () => {
    expect(finderCopy([opt("Study areas")]).label).toBe("Find a study area");
    expect(finderCopy([opt("Degrees")]).placeholder).toBe("Search degrees…");
    expect(finderCopy([opt("Degrees"), opt("Study areas")]).label).toBe("Find a degree or study area");
  });
});
