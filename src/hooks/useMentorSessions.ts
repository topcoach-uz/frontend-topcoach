/**
 * Shared mentor-sessions source + classification.
 *
 * Extracted from `MyProgressEditorialView` (the "Mentor sessions" card)
 * so any other surface that needs to show a student's upcoming/past/
 * cancelled mentor sessions — e.g. the community feed's "Upcoming
 * sessions" rail widget — reads the exact same data + logic instead of
 * re-deriving it and risking drift.
 *
 * Data source: authenticated `/sessions/me`, including explicit attendance.
 * Refreshes on focus and polls while the student view is open.
 */
import { useMemo } from 'react';
import { useGetMySessionsQuery, type AttendanceRecord } from 'src/app/services/sessions';
import { studentSessionList } from 'src/pages/student-hub/sessions/studentSessions';
import { SessionTypeEnum } from 'src/app/api/Api';

export interface MentorSessionItem {
  id: string;
  /** @format date-time */
  date: string;
  mentor: string;
  mentorId?: string;
  durationMin: number;
  meetingLink?: string;
  attendanceRecord?: AttendanceRecord | null;
}

/** Map a raw joinedSession row to a normalized MentorSessionItem. */
const mapSession = (s: any, i: number): MentorSessionItem => ({
  id: String(s.id ?? i),
  date: s.date,
  mentor: s.mentor?.profile?.name || s.mentorName || 'Mentor',
  mentorId: s.mentor?.id,
  durationMin: s.type === SessionTypeEnum.Individual30M ? 30 : 60,
  meetingLink: s.calendarInfo?.meetingLink,
  attendanceRecord: s.attendanceRecord ?? null,
});

export interface UseMentorSessionsResult {
  joinedSessions: any[] | undefined;
  upcomingSessions: MentorSessionItem[];
  pastSessions: MentorSessionItem[];
  cancelledSessions: MentorSessionItem[];
}

/**
 * Reads `profile.joinedSessions` from the auth slice and classifies them
 * into upcoming / past / cancelled, exactly like My Progress does.
 */
export function useMentorSessions(): UseMentorSessionsResult {
  const { data } = useGetMySessionsQuery(undefined, { pollingInterval: 15000, refetchOnFocus: true, refetchOnMountOrArgChange: true });
  const joinedSessions = useMemo(() => studentSessionList(data), [data]);

  const upcomingSessions: MentorSessionItem[] = useMemo(() => {
    if (!joinedSessions?.length) return [];
    const now = Date.now();
    return joinedSessions
      .filter((s) => s?.date && new Date(s.date).getTime() + (s.type === SessionTypeEnum.Individual30M ? 30 : 60) * 60000 > now && !s.cancelStatus && !s.attendanceRecord)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(mapSession);
  }, [joinedSessions]);

  /** Past sessions = ended (start + duration < now) AND not cancelled. */
  const pastSessions: MentorSessionItem[] = useMemo(() => {
    if (!joinedSessions?.length) return [];
    return joinedSessions
      .filter((s) => {
        if (!s?.date || s.cancelStatus) return false;
        const dur = s.type === SessionTypeEnum.Individual30M ? 30 : 60;
        return !!s.attendanceRecord || Date.now() > new Date(s.date).getTime() + dur * 60 * 1000;
      })
      // Newest past session first.
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(mapSession);
  }, [joinedSessions]);

  /** Cancelled sessions — status object is non-null. */
  const cancelledSessions: MentorSessionItem[] = useMemo(() => {
    if (!joinedSessions?.length) return [];
    return joinedSessions
      .filter((s) => s.cancelStatus !== null && s.cancelStatus?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(mapSession);
  }, [joinedSessions]);

  return { joinedSessions, upcomingSessions, pastSessions, cancelledSessions };
}
