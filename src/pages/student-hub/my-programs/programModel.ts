import type { StudentProgram, ProgramKey } from 'src/app/services/studentProgramsApi';
export const programNames: Record<ProgramKey,string> = {full_support:'Full Support',admissions:'Admissions',research:'Research',customized:'Customized Program',bootcamp:'Essay Bootcamp'};
export const programDisplayName = (program: { program: string; name?: string }) => program.name || programNames[program.program] || program.program;
export const roleNames: Record<string,string> = {ec:'Extracurricular activities',research:'Research',essays:'Essays',application:'Applications',group:'Group',individual:'Individual',legacy:'Mentor'};
export const programUrl = (program?: string) => '/student-hub/my-programs'+(program?'?program='+encodeURIComponent(program):'');
export const currentPrograms = (rows:StudentProgram[]) => rows.filter(p=>p.state==='active'||p.state==='scheduled');
export function programNavigation(rows:StudentProgram[]) {const current=currentPrograms(rows);return current.length===1?{label:programDisplayName(current[0]),url:programUrl(current[0].program)}:{label:'My Programs',url:programUrl()};}
export const safeWebUrl = (value?:string|null) => value && /^https?:\/\//i.test(value)?value:undefined;
export const taskStatus = {assigned:'To do',submitted:'Waiting for review',revision_requested:'Revision requested',approved:'Approved'};
export function latestPrograms(rows: StudentProgram[]) {
 const latest = new Map<string, StudentProgram>();
 for (const program of rows) {
  const previous = latest.get(program.program);
  const current = program.state === 'active' || program.state === 'scheduled';
  const previousCurrent = previous?.state === 'active' || previous?.state === 'scheduled';
  if (!previous || (current && !previousCurrent) || (current === previousCurrent && Date.parse(program.startsAt) > Date.parse(previous.startsAt))) latest.set(program.program, program);
 }
 return [...latest.values()];
}

export function selectProgramEnrollment(rows: StudentProgram[], program?: string | null, enrollmentId?: string | null): StudentProgram | undefined {
 if (enrollmentId) return rows.find(row => row.id === enrollmentId);
 const latest = latestPrograms(rows);
 if (program) return latest.find(row => row.program === program);
 const active = currentPrograms(latest);
 return active.length === 1 ? active[0] : undefined;
}
