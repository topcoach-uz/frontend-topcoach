import { describe, expect, it } from "vitest";
import {
  canLogLegacySession,
  programHours,
  studentHoursLabel,
  studentProgramLabel,
} from "./programDisplay";
import type { MentorRosterStudent } from "src/app/services/fullSupportApi";

const student: MentorRosterStudent = {
  id: "student",
  name: "Student",
  initials: "S",
  used: 0,
  allocated: 0,
  sessionsCount: 2,
  hasLegacyFullSupport: false,
  programs: [
    {
      enrollmentId: "custom",
      program: "customized",
      roles: ["individual"],
      usedMinutes: 90,
      allocatedMinutes: 300,
      remainingMinutes: 210,
    },
    {
      enrollmentId: "research",
      program: "research",
      roles: ["research"],
      usedMinutes: 45,
      allocatedMinutes: null,
      remainingMinutes: null,
    },
  ],
};
describe("Mentor program identity and budgets", () => {
  it("shows actual program budgets without calling every assigned student Full Support", () => {
    expect(studentProgramLabel(student)).toBe("Customized Program · Research");
    expect(studentHoursLabel(student)).toBe(
      "Customized Program: 1.5h of 5h used · Research: 0.75h recorded · No hour limit",
    );
    expect(studentHoursLabel(student)).not.toContain("0h of 0h");
  });
  it("does not present a missing cap as zero allocated hours", () => {
    expect(programHours({ usedMinutes: 60, allocatedMinutes: null })).toBe(
      "1h recorded · No hour limit",
    );
    expect(programHours({ usedMinutes: 60, allocatedMinutes: 60 })).toBe(
      "1h of 1h used",
    );
  });
  it("keeps legacy Full Support separate when both kinds of assignment exist", () => {
    const mixed = {
      ...student,
      hasLegacyFullSupport: true,
      used: 1,
      allocated: 2,
    };
    expect(studentHoursLabel(mixed)).toContain("Full Support: 1h of 2h used");
    expect(studentProgramLabel(mixed)).toBe(
      "Customized Program · Research · Full Support",
    );
  });
  it("offers the legacy session action only where that backend path accepts it", () => {
    expect(canLogLegacySession(student)).toBe(false);
    expect(
      canLogLegacySession({ ...student, hasLegacyFullSupport: true }),
    ).toBe(false);
    expect(
      canLogLegacySession({
        ...student,
        programs: [],
        hasLegacyFullSupport: true,
      }),
    ).toBe(true);
    expect(
      canLogLegacySession({
        ...student,
        programs: [{ ...student.programs![0], program: "full_support" }],
      }),
    ).toBe(true);
  });
  it("continues displaying legacy responses during a rolling deployment", () => {
    const legacy = {
      ...student,
      programs: undefined,
      hasLegacyFullSupport: undefined,
      used: 1,
      allocated: 3,
    };
    expect(studentProgramLabel(legacy)).toBe("Full Support");
    expect(studentHoursLabel(legacy)).toBe("Full Support: 1h of 3h used");
  });
});
