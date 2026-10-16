import { lessonMinutes, lessonOutcome } from './fullSupportLessons';
import { useMemo } from 'react';
import { SessionTypeEnum, type SessionsSchema } from 'src/app/api/Api';
import {
  useGetMentorSessionsQuery,
  type SessionLogDto,
} from 'src/app/services/fullSupportApi';
import { useGetMySessionsQuery } from 'src/app/services/sessions';

export type SessionReport = {
  topicsCovered: string;
  notes?: string;
  homework?: string;
  rating?: 'tough' | 'okay' | 'good' | 'great';
  submittedAt: string;
};

export type MentorBooking = {
  id: string;
  source: 'platform' | 'full-support';
  dateTime: string;
  durationLabel: string;
  durationMinutes: number;
  description: string | null;
  studentUserId: string | null;
  studentName: string | null;
  status: 'upcoming' | 'completed' | 'report-due' | 'cancelled';
  cancelReason?: string | null;
  joinUrl?: string | null;
  /** Submitted post-session report (platform sessions); null while pending. */
  report?: SessionReport | null;
  /** Student's "Notes for your mentor" left when confirming the booking. */
  studentNote?: string | null;
  raw: SessionsSchema | SessionLogDto;
};

/**
 * Session reports are required only for one-time platform sessions that END on
 * or after this launch date — older sessions stay "completed" so the queue
 * isn't flooded with historical backlog. Bump if the feature re-launches.
 */
export const SESSION_REPORT_LAUNCH = new Date('2026-06-06T00:00:00Z').getTime();

function durationFromSessionType(type: SessionTypeEnum | string | undefined): {
  label: string;
  minutes: number;
} {
  if (type === SessionTypeEnum.Individual30M) return { label: '30 min', minutes: 30 };
  if (type === SessionTypeEnum.Individual60M) return { label: '60 min', minutes: 60 };
  return { label: String(type ?? '—'), minutes: 60 };
}

function normalizePlatformBooking(s: SessionsSchema): MentorBooking {
  const { label, minutes } = durationFromSessionType(s.type as SessionTypeEnum);
  const participant = (s.participants as unknown as Array<{ id?: string; profile?: { name?: string } }>)
    ?.[0];
  const studentName = participant?.profile?.name ?? null;
  const studentId = participant?.id ?? null;
  const calendar = (s as unknown as { calendarInfo?: { meetingLink?: string } }).calendarInfo;
  const joinUrl = calendar?.meetingLink ?? null;

  const isCancelled = !!(s.cancelStatus && (s.cancelStatus as { id?: string }).id);
  const report = (s as unknown as { report?: SessionReport | null }).report ?? null;
  const studentNote = (s as unknown as { note?: string | null }).note || null;
  const end = new Date(s.date).getTime() + minutes * 60_000;
  const now = Date.now();

  let status: MentorBooking['status'];
  if (isCancelled) status = 'cancelled';
  else if (end > now) status = 'upcoming';
  else if (report) status = 'completed';
  // Past + no report: needs one only if it ended after the feature launched.
  else if (end < SESSION_REPORT_LAUNCH) status = 'completed';
  else status = 'report-due';

  return {
    id: s.id,
    source: 'platform',
    dateTime: s.date,
    durationLabel: label,
    durationMinutes: minutes,
    description: null,
    studentUserId: studentId,
    studentName,
    status,
    cancelReason:
      (s.cancelStatus as { reason?: string } | undefined)?.reason ?? null,
    joinUrl,
    report,
    studentNote,
    raw: s,
  };
}

export function normalizeFullSupportSession(
  s: SessionLogDto & { studentUserId?: string },
  studentName: string | null,
): MentorBooking {
  const minutes = lessonMinutes(s.duration);
  const end = new Date(s.dateTime).getTime() + minutes * 60_000;
  const now = Date.now();

  let status: MentorBooking['status'];
  const outcome = lessonOutcome(s);
  if (['cancelled', 'student_no_show', 'mentor_no_show'].includes(outcome)) status = 'cancelled';
  else if (outcome === 'held') status = 'completed';
  else if (end < now) status = 'report-due';
  else status = 'upcoming';

  return {
    id: `fs:${s.id}`,
    source: 'full-support',
    dateTime: s.dateTime,
    durationLabel: s.duration || '—',
    durationMinutes: minutes,
    description: s.description || null,
    studentUserId: s.studentUserId ?? null,
    studentName,
    status,
    joinUrl: s.meetingLink ?? null,
    raw: s,
  };
}

/**
 * A student the mentor knows only through 1:1 platform sessions (no Full
 * Support assignment). One mentee can hold many sessions with the same mentor,
 * so we collapse the bookings into a unique-by-student roster the sidebar and
 * Students page render alongside the Full Support roster.
 */
export type MentorMentee = {
  id: string;
  name: string;
  sessionsCount: number;
  upcomingCount: number;
  nextSessionAt: string | null;
  lastSessionAt: string | null;
};

export function useMentorMentees() {
  const { bookings, isLoading } = useMentorBookings(null, {
    includeFullSupport: false,
  });

  const mentees = useMemo<MentorMentee[]>(() => {
    const byId = new Map<string, MentorMentee>();
    bookings
      .filter((b) => b.source === 'platform' && b.studentUserId)
      .forEach((b) => {
        const id = b.studentUserId as string;
        const isUpcoming = b.status === 'upcoming';
        const existing = byId.get(id);
        if (!existing) {
          byId.set(id, {
            id,
            name: b.studentName || 'Student',
            sessionsCount: 1,
            upcomingCount: isUpcoming ? 1 : 0,
            nextSessionAt: isUpcoming ? b.dateTime : null,
            lastSessionAt: isUpcoming ? null : b.dateTime,
          });
          return;
        }
        existing.sessionsCount += 1;
        if (b.studentName && existing.name === 'Student') existing.name = b.studentName;
        if (isUpcoming) {
          existing.upcomingCount += 1;
          if (
            !existing.nextSessionAt ||
            new Date(b.dateTime).getTime() < new Date(existing.nextSessionAt).getTime()
          ) {
            existing.nextSessionAt = b.dateTime;
          }
        } else if (
          !existing.lastSessionAt ||
          new Date(b.dateTime).getTime() > new Date(existing.lastSessionAt).getTime()
        ) {
          existing.lastSessionAt = b.dateTime;
        }
      });

    // Soonest upcoming first, then most-recently-seen past mentees.
    return Array.from(byId.values()).sort((a, b) => {
      if (a.nextSessionAt && b.nextSessionAt) {
        return new Date(a.nextSessionAt).getTime() - new Date(b.nextSessionAt).getTime();
      }
      if (a.nextSessionAt) return -1;
      if (b.nextSessionAt) return 1;
      return (
        new Date(b.lastSessionAt ?? 0).getTime() - new Date(a.lastSessionAt ?? 0).getTime()
      );
    });
  }, [bookings]);

  return { mentees, isLoading };
}

export function useMentorBookings(
  studentFilterId?: string | null,
  options?: { includeFullSupport?: boolean },
) {
  const includeFs = options?.includeFullSupport ?? true;
  const {
    data: platformRes,
    isLoading: loadingPlatform,
    isError: platformError,
  } = useGetMySessionsQuery();
  const {
    data: fullSupportRes,
    isLoading: loadingFs,
    isError: fsError,
  } = useGetMentorSessionsQuery(studentFilterId ?? null, { skip: !includeFs });

  const rosterNameByStudentId = useMemo(() => {
    const map = new Map<string, string>();
    (fullSupportRes?.data ?? []).forEach((s) => {
      const sid = (s as unknown as { studentUserId?: string }).studentUserId;
      if (sid && !map.has(sid)) {
        // placeholder — fullSupport roster fetch handles names separately.
        map.set(sid, '');
      }
    });
    return map;
  }, [fullSupportRes?.data]);

  const bookings = useMemo<MentorBooking[]>(() => {
    const platformRaw = ((platformRes as unknown as { data?: SessionsSchema[] })?.data ??
      (Array.isArray(platformRes) ? (platformRes as SessionsSchema[]) : [])) as SessionsSchema[];

    const platform = platformRaw.map(normalizePlatformBooking);
    const fs = (fullSupportRes?.data ?? []).map((s) =>
      normalizeFullSupportSession(
        s as SessionLogDto & { studentUserId?: string },
        rosterNameByStudentId.get(
          (s as unknown as { studentUserId?: string }).studentUserId ?? '',
        ) || null,
      ),
    );
    return [...platform, ...fs].sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
    );
  }, [platformRes, fullSupportRes?.data, rosterNameByStudentId]);

  return {
    bookings,
    isLoading: loadingPlatform || loadingFs,
    isError: platformError || fsError,
  };
}
