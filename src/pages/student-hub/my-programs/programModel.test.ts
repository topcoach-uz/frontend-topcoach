import {describe,it,expect} from 'vitest';
import {programNavigation,latestPrograms,safeWebUrl} from './programModel';
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
 it('rejects unsafe roadmap and meeting URLs',()=>{expect(safeWebUrl('javascript:alert(1)')).toBeUndefined();expect(safeWebUrl('https://meet.google.com/abc')).toBe('https://meet.google.com/abc');});
});
