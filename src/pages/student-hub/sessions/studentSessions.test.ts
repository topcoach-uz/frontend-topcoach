import { describe, expect, it } from 'vitest';
import { studentAttendance, studentSessionList, studentSessionOutcome, type StudentSession } from './studentSessions';
const session = (record: unknown=null) => ({ attendanceRecord: record }) as StudentSession;
describe('Student attendance display',()=>{
 it('does not infer attendance from a completed booking or report',()=>{
  expect(studentSessionOutcome(session())).toBe('Attendance not recorded');
  expect(studentAttendance(session())).toBe('Not recorded');
 });
 it('shows held lessons and their saved attendance',()=>{
  expect(studentSessionOutcome(session({outcome:'held',attendance:'late'}))).toBe('Held');
  expect(studentAttendance(session({outcome:'held',attendance:'late'}))).toBe('late');
 });
 it('distinguishes who missed a session without marking the student absent for a mentor no-show',()=>{
  expect(studentSessionOutcome(session({outcome:'student_no_show',attendance:'absent'}))).toBe('Student no-show');
  expect(studentAttendance(session({outcome:'student_no_show',attendance:'absent'}))).toBe('absent');
  expect(studentSessionOutcome(session({outcome:'mentor_no_show',attendance:'unknown'}))).toBe('Mentor no-show');
  expect(studentAttendance(session({outcome:'mentor_no_show',attendance:'unknown'}))).toBe('Not applicable');
 });
 it('reads both supported session response envelopes',()=>{
  const rows=[session()];expect(studentSessionList(rows)).toBe(rows);expect(studentSessionList({data:rows})).toBe(rows);expect(studentSessionList(undefined)).toEqual([]);
 });
});
