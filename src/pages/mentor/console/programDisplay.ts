import type {
  AcademicProgram,
  MentorRosterStudent,
} from "src/app/services/fullSupportApi";

export const PROGRAM_LABELS: Record<AcademicProgram, string> = {
  admissions: "Admissions",
  full_support: "Full Support",
  research: "Research",
  customized: "Customized Program",
  bootcamp: "Bootcamp",
};
export const ROLE_LABELS: Record<string, string> = {
  ec: "Extracurricular",
  research: "Research",
  essays: "Essays",
  application: "Applications",
  individual: "Individual",
  group: "Group",
};
export function hours(minutes: number) {
  return `${Number((minutes / 60).toFixed(2))}h`;
}
export function programHours(program: {
  usedMinutes: number;
  allocatedMinutes: number | null;
}) {
  return program.allocatedMinutes == null
    ? `${hours(program.usedMinutes)} recorded · No hour limit`
    : `${hours(program.usedMinutes)} of ${hours(program.allocatedMinutes)} used`;
}
export function studentProgramLabel(
  student: Pick<MentorRosterStudent, "programs" | "hasLegacyFullSupport">,
) {
  const labels = new Set(
    (student.programs ?? []).map((p) => PROGRAM_LABELS[p.program]),
  );
  if (student.hasLegacyFullSupport || student.programs === undefined)
    labels.add("Full Support");
  return [...labels].join(" · ") || "Mentorship";
}
export function studentHoursLabel(
  student: Pick<
    MentorRosterStudent,
    "programs" | "hasLegacyFullSupport" | "used" | "allocated"
  >,
) {
  const summaries = (student.programs ?? []).map(
    (p) => `${PROGRAM_LABELS[p.program]}: ${programHours(p)}`,
  );
  if (student.hasLegacyFullSupport || student.programs === undefined) {
    summaries.push(
      `Full Support: ${student.used}h of ${student.allocated}h used`,
    );
  }
  return summaries.join(" · ");
}
export function canLogLegacySession(
  student: Pick<MentorRosterStudent, "programs" | "hasLegacyFullSupport">,
) {
  // Older API responses do not include identity metadata yet.
  const fullSupport =
    student.hasLegacyFullSupport ||
    student.programs === undefined ||
    student.programs.some((p) => p.program === "full_support");
  return (
    fullSupport && !student.programs?.some((p) => p.program === "customized")
  );
}
