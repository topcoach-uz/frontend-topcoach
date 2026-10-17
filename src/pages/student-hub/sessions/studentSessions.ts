import type { SessionsSchema } from 'src/app/api/Api';
import type { AttendanceRecord } from 'src/app/services/sessions';
export type StudentSession = Omit<SessionsSchema, 'mentor'> & { mentor?: { id?: string; profile?: { name?: string } }; attendanceRecord?: AttendanceRecord | null };
export function studentSessionOutcome(session: StudentSession): string {
  if (session.cancelStatus?.id) return 'Cancelled';
  const outcome = session.attendanceRecord?.outcome;
  if (outcome === 'held') return 'Held';
  if (outcome === 'student_no_show') return 'Student no-show';
  if (outcome === 'mentor_no_show') return 'Mentor no-show';
  return 'Attendance not recorded';
}
export function studentAttendance(session: StudentSession): string {
  if (session.cancelStatus?.id || session.attendanceRecord?.outcome === 'mentor_no_show') return 'Not applicable';
  return session.attendanceRecord?.attendance === 'unknown' ? 'Not recorded' : session.attendanceRecord?.attendance ?? 'Not recorded';
}
export function studentSessionList(response: unknown): StudentSession[] {
  const rows = Array.isArray(response) ? response : (response as { data?: StudentSession[] })?.data;
  return Array.isArray(rows) ? rows : [];
}
