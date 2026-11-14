import { describe, expect, it } from "vitest";
import { examChecklistKey, parseReadyExams, toggleExam } from "./examChecklist";

describe("exam checklist", () => {
  it("builds the storage key", () => expect(examChecklistKey("u1")).toBe("tc.examChecklist.u1"));
  it("keeps only known exams and survives bad data", () => {
    expect(parseReadyExams('["SAT","Old"]', ["SAT", "TOEFL"])).toEqual(["SAT"]);
    expect(parseReadyExams("not json", ["SAT"])).toEqual([]);
    expect(parseReadyExams('{"a":1}', ["SAT"])).toEqual([]);
    expect(parseReadyExams(null, ["SAT"])).toEqual([]);
  });
  it("toggles", () => {
    expect(toggleExam([], "SAT")).toEqual(["SAT"]);
    expect(toggleExam(["SAT", "TOEFL"], "SAT")).toEqual(["TOEFL"]);
  });
});
