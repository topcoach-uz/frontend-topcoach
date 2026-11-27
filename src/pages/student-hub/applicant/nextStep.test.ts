import { describe, expect, it } from "vitest";
import { selectNextStep } from "./nextStep";

describe("selectNextStep", () => {
  it("starts with Major Match for bachelor applicants", () => {
    expect(selectNextStep({ degree: "bachelor", hasMajorMatch: false, collegeListCount: 0, essayCount: 0, documentCount: 0 })).toMatchObject({ key: "major-match", step: 1, total: 4 });
  });
  it("moves on to universities, essays, then documents", () => {
    expect(selectNextStep({ degree: "bachelor", hasMajorMatch: true, collegeListCount: 0, essayCount: 0, documentCount: 0 })?.key).toBe("universities");
    expect(selectNextStep({ degree: "bachelor", hasMajorMatch: true, collegeListCount: 2, essayCount: 0, documentCount: 0 })?.key).toBe("essays");
    expect(selectNextStep({ degree: "bachelor", hasMajorMatch: true, collegeListCount: 2, essayCount: 1, documentCount: 0 })).toMatchObject({ key: "documents", step: 4 });
  });
  it("returns null when everything is started", () => {
    expect(selectNextStep({ degree: "bachelor", hasMajorMatch: true, collegeListCount: 1, essayCount: 1, documentCount: 1 })).toBeNull();
  });
  it("skips Major Match for master applicants and counts three steps", () => {
    expect(selectNextStep({ degree: "master", collegeListCount: 0, essayCount: 0, documentCount: 0 })).toMatchObject({ key: "universities", step: 1, total: 3 });
  });
  it("makes no suggestion while an earlier answer is unknown", () => {
    expect(selectNextStep({ degree: "bachelor", collegeListCount: 0 })).toBeNull();
    expect(selectNextStep({ degree: "bachelor", hasMajorMatch: true, collegeListCount: undefined, essayCount: 0 })).toBeNull();
  });
});
