import type { StudentProgram, ProgramKey } from 'src/app/services/studentProgramsApi';
export const programNames: Record<ProgramKey,string> = {full_support:'Full Support',admissions:'Admissions',research:'Research',customized:'Customized Program',bootcamp:'Essay Bootcamp'};
export const roleNames: Record<string,string> = {ec:'Extracurricular activities',research:'Research',essays:'Essays',application:'Applications',group:'Group',individual:'Individual',legacy:'Mentor'};
export const programUrl = (program?: string) => '/student-hub/my-programs'+(program?'?program='+encodeURIComponent(program):'');
export const currentPrograms = (rows:StudentProgram[]) => rows.filter(p=>p.state==='active'||p.state==='scheduled');
export function programNavigation(rows:StudentProgram[]) {const current=currentPrograms(rows);return current.length===1?{label:programNames[current[0].program],url:programUrl(current[0].program)}:{label:'My Programs',url:programUrl()};}
export const safeWebUrl = (value?:string|null) => value && /^https?:\/\//i.test(value)?value:undefined;
export const taskStatus = {assigned:'To do',submitted:'Waiting for review',revision_requested:'Revision requested',approved:'Approved'};
export function latestPrograms(rows:StudentProgram[]) { const latest=new Map<string,StudentProgram>();for(const p of rows){const old=latest.get(p.program);if(!old||((p.state==='active'||p.state==='scheduled')&&old.state!=='active'&&old.state!=='scheduled')||((p.state===old.state)&&Date.parse(p.startsAt)>Date.parse(old.startsAt))) latest.set(p.program,p);}return [...latest.values()]; }
