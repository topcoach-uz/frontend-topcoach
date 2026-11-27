import { programNames, roleNames } from 'src/pages/student-hub/my-programs/programModel';
import type { ProgramKey } from 'src/app/services/studentProgramsApi';

type ProgramAssignment = { program: string; name?: string; roles?: string[] };
export function mentorProgramLabel(student: { programs?: Array<ProgramAssignment | string>; hasLegacyFullSupport?: boolean }, isAssigned = true) {
  if (!isAssigned) return '1:1 mentoring';
  const labels = (student.programs ?? []).map(entry => {
    const program = typeof entry === 'string' ? entry : entry.program;
    const name = (typeof entry === "string" ? undefined : entry.name) || programNames[program as ProgramKey] || program;
    const roles = (typeof entry === 'string' ? [] : entry.roles ?? []).map(role => roleNames[role] ?? role).filter(role => role !== name);
    return roles.length ? `${name} · ${roles.join(', ')}` : name;
  });
  if (student.hasLegacyFullSupport && !(student.programs ?? []).some(p => (typeof p === 'string' ? p : p.program) === 'full_support')) labels.push('Full Support');
  return [...new Set(labels)].join(' / ') || 'Full Support';
}
