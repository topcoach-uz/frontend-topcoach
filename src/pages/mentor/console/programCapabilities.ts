import type {
  MentorRosterProgram,
  MentorRosterStudent,
} from "src/app/services/fullSupportApi";

export const LEGACY_ENROLLMENT = "legacy-history";
const DEFAULT_TOOLS = ["lessons", "tasks", "milestones", "reports", "progress"];

/** Explicit server capabilities win, including an empty list. */
export function programHasTool(
  program:
    | Pick<MentorRosterProgram, "capabilities" | "enabledTools">
    | undefined,
  tool: string,
): boolean {
  return (
    !!program &&
    (program.capabilities ?? program.enabledTools ?? DEFAULT_TOOLS).includes(
      tool,
    )
  );
}
export function rosterHasTool(
  student: Pick<MentorRosterStudent, "programs" | "hasLegacyFullSupport">,
  tool: string,
): boolean {
  return (
    !!student.hasLegacyFullSupport ||
    (student.hasLegacyFullSupport === undefined && !student.programs?.length) ||
    (student.programs ?? []).some((program) => programHasTool(program, tool))
  );
}
export function matchesEnrollment(
  row: { academicEnrollmentId?: string | null },
  enrollmentId: string,
): boolean {
  return enrollmentId === LEGACY_ENROLLMENT
    ? !row.academicEnrollmentId
    : row.academicEnrollmentId === enrollmentId;
}
export function enrollmentHours(program: MentorRosterProgram) {
  return {
    used: Math.round(((program.usedMinutes ?? 0) / 60) * 100) / 100,
    allocated: Math.round(((program.allocatedMinutes ?? 0) / 60) * 100) / 100,
    scheduledHours: Math.round(((program.scheduledMinutes ?? 0) / 60) * 100) / 100,
    allocationKnown: program.allocatedMinutes != null,
    usageKnown: program.usedMinutes != null,
    sessionsCount: program.sessionsCount ?? 0,
  };
}

/** Legacy history cannot supply an unambiguous target for newly created work. */
export function canCreateProgramWork(
  student: Pick<MentorRosterStudent, "programs" | "hasLegacyFullSupport">,
  enrollmentId: string,
  tool: string,
): boolean {
  const program = student.programs?.find(row => row.enrollmentId === enrollmentId);
  if (program) return (!program.state || program.state === 'active') && programHasTool(program, tool);
  return enrollmentId === LEGACY_ENROLLMENT && !student.programs?.length && !!student.hasLegacyFullSupport;
}
export function isAccessDenied(error: unknown): boolean {
  const status = error && typeof error === 'object' && 'status' in error ? (error as { status: unknown }).status : undefined;
  return status === 401 || status === 403;
}
