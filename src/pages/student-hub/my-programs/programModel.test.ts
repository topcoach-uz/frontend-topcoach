import {describe,it,expect} from 'vitest';
import {selectProgramEnrollment,programNavigation,latestPrograms,safeWebUrl} from './programModel';
import type {StudentProgram} from 'src/app/services/studentProgramsApi';
const row=(program:string,state='active',startsAt='2026-01-01')=>({program,state,startsAt,id:program+startsAt} as StudentProgram);
describe('program navigation',()=>{
 it('opens a single Full Support enrollment directly',()=>expect(programNavigation([row('full_support')])).toEqual({label:'Full Support',url:'/student-hub/my-programs?program=full_support'}));
 it('opens single Research directly',()=>expect(programNavigation([row('research')]).label).toBe('Research'));
 it('uses My Programs for multiple mentoring enrollments',()=>expect(programNavigation([row('full_support'),row('research')]).label).toBe('My Programs'));
 it('does not count expired or revoked enrollments',()=>expect(programNavigation([row('full_support'),row('research','expired'),row('bootcamp','revoked')]).label).toBe('Full Support'));
 it('counts scheduled enrollments',()=>expect(programNavigation([row('research','scheduled')]).label).toBe('Research'));
 it('keeps zero enrollments as My Programs',()=>expect(programNavigation([]).label).toBe('My Programs'));
 it('uses the current period instead of an older ended period',()=>expect(latestPrograms([row('research','revoked','2025-01-01'),row('research','active')])[0].state).toBe('active'));
 it('uses a dynamic catalog name in single-program navigation',()=>expect(programNavigation([{...row('new-cohort'),name:'University Launch'}]).label).toBe('University Launch'));
 it('opens an exact ended enrollment without substituting its renewal',()=>{
  const old={...row('research','expired','2025-01-01'),id:'old'};
  const renewed={...row('research','active','2026-01-01'),id:'renewed'};
  expect(selectProgramEnrollment([old,renewed],'research','old')).toBe(old);
  expect(selectProgramEnrollment([old,renewed],'research')).toBe(renewed);
  expect(selectProgramEnrollment([old,renewed],'research','missing')).toBeUndefined();
 });
 it('chooses the newest ended period even when its status differs from an older period',()=>{
  const old=row('research','revoked','2025-01-01');
  const newer=row('research','expired','2026-01-01');
  expect(latestPrograms([old,newer])[0]).toBe(newer);
  expect(latestPrograms([newer,old])[0]).toBe(newer);
 });
 it('rejects unsafe roadmap and meeting URLs',()=>{expect(safeWebUrl('javascript:alert(1)')).toBeUndefined();expect(safeWebUrl('https://meet.google.com/abc')).toBe('https://meet.google.com/abc');});
});
