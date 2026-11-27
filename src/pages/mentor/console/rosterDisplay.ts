import type { MentorRosterStudent } from 'src/app/services/fullSupportApi';

const PROGRAM_LABELS: Record<string, string> = {
  full_support: 'Full Support', admissions: 'Admissions', research: 'Research',
  customized: 'Individual mentorship', bootcamp: 'Essay bootcamp',
};
export function rosterProgramLabel(student: { programs?: Array<string | { program: string; name?: string }> }) {
  return student.programs?.length ? student.programs.map(p => (typeof p === "string" ? undefined : p.name) || PROGRAM_LABELS[typeof p === "string" ? p : p.program] || (typeof p === "string" ? p : p.program)).join(' · ') : 'Full Support';
}
export function rosterHoursLabel(student: Pick<MentorRosterStudent, 'used' | 'allocated' | 'allocationKnown' | 'usageKnown'>) {
  const used = student.usageKnown === false ? student.used > 0 ? `${student.used}h+ recorded` : 'Time not recorded' : `${student.used}h used`;
  return `${used} · ${student.allocationKnown === false ? 'allocation unknown' : `${student.allocated}h allocated`}`;
}
