import { describe, it, expect } from "vitest";
import {
  canCreateProgramWork,
  isAccessDenied,
  enrollmentHours,
  LEGACY_ENROLLMENT,
  matchesEnrollment,
  programHasTool,
  rosterHasTool,
} from "./programCapabilities";
import type { MentorRosterProgram } from "src/app/services/fullSupportApi";

describe("program workspace boundaries", () => {
  it('keeps new work out of ambiguous legacy history even when a legacy mentor relationship remains', () => {
    const student = { hasLegacyFullSupport: true, programs: [{ enrollmentId: 'research', capabilities: ['tasks', 'milestones', 'lessons'], state: 'active' } as MentorRosterProgram] };
    for (const tool of ['tasks', 'milestones', 'lessons']) {
      expect(canCreateProgramWork(student, LEGACY_ENROLLMENT, tool)).toBe(false);
      expect(canCreateProgramWork(student, 'research', tool)).toBe(true);
      expect(canCreateProgramWork(student, 'removed-enrollment', tool)).toBe(false);
    }
    expect(canCreateProgramWork({ hasLegacyFullSupport: true, programs: [] }, LEGACY_ENROLLMENT, 'tasks')).toBe(true);
  });
  it('makes ended and disabled enrollments read-only without losing history', () => {
    const program = { enrollmentId: 'research', capabilities: ['tasks'], state: 'expired' } as MentorRosterProgram;
    expect(programHasTool(program, 'tasks')).toBe(true);
    expect(canCreateProgramWork({ programs: [program] }, 'research', 'tasks')).toBe(false);
    expect(canCreateProgramWork({ programs: [{ ...program, state: 'active', capabilities: [] }] }, 'research', 'tasks')).toBe(false);
  });
  it('distinguishes a denied refresh from a temporary read failure', () => {
    expect(isAccessDenied({ status: 403 })).toBe(true);
    expect(isAccessDenied({ status: 401 })).toBe(true);
    expect(isAccessDenied({ status: 'FETCH_ERROR' })).toBe(false);
    expect(isAccessDenied(undefined)).toBe(false);
  });
  it("keeps a renewal and another simultaneous program out of the selected enrollment", () => {
    const rows = [
      { id: "old", academicEnrollmentId: "research-2025" },
      { id: "current", academicEnrollmentId: "research-2026" },
      { id: "other", academicEnrollmentId: "admissions-2026" },
      { id: "legacy", academicEnrollmentId: null },
    ];
    expect(
      rows
        .filter((row) => matchesEnrollment(row, "research-2026"))
        .map((row) => row.id),
    ).toEqual(["current"]);
    expect(
      rows
        .filter((row) => matchesEnrollment(row, LEGACY_ENROLLMENT))
        .map((row) => row.id),
    ).toEqual(["legacy"]);
  });
  it("respects disabled tools even when a student remains assigned", () => {
    expect(programHasTool({ capabilities: [] }, "lessons")).toBe(false);
    expect(
      rosterHasTool(
        {
          programs: [
            {
              program: "custom",
              capabilities: ["tasks"],
            } as MentorRosterProgram,
          ],
        },
        "lessons",
      ),
    ).toBe(false);
    expect(
      rosterHasTool(
        {
          programs: [
            {
              program: "custom",
              capabilities: ["lessons"],
            } as MentorRosterProgram,
          ],
        },
        "lessons",
      ),
    ).toBe(true);
    expect(
      rosterHasTool({ programs: [], hasLegacyFullSupport: true }, "lessons"),
    ).toBe(true);
  });
  it("uses the enrollment budget without mixing the student aggregate or inventing an unlimited budget", () => {
    expect(
      enrollmentHours({
        allocatedMinutes: 600,
        usedMinutes: 90,
        scheduledMinutes: 120,
        sessionsCount: 4,
      } as MentorRosterProgram),
    ).toMatchObject({
      allocated: 10,
      used: 1.5,
      scheduledHours: 2,
      sessionsCount: 4,
      allocationKnown: true,
    });
    expect(
      enrollmentHours({ allocatedMinutes: null } as MentorRosterProgram)
        .allocationKnown,
    ).toBe(false);
  });
});
