import { useMemo } from 'react';
import { SessionTypeEnum, type SessionsSchema } from 'src/app/api/Api';
import {
  useGetMentorSessionsQuery,
  type SessionLogDto,
} from 'src/app/services/fullSupportApi';
import { useGetMySessionsQuery } from 'src/app/services/sessions';

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
  raw: SessionsSchema | SessionLogDto;
};

function durationFromSessionType(type: SessionTypeEnum | string | undefined): {
  label: string;
  minutes: number;
} {
  if (type === SessionTypeEnum.Individual30M) return { label: '30 min', minutes: 30 };
  if (type === SessionTypeEnum.Individual60M) return { label: '60 min', minutes: 60 };
  return { label: String(type ?? '—'), minutes: 60 };
}

function parseFullSupportDuration(raw: string | undefined | null): number {
  const s = String(raw ?? '').trim().toLowerCase();
  const m = s.match(/(\d+)/);
  return m ? Number(m[1]) : 60;
}

function normalizePlatformBooking(s: SessionsSchema): MentorBooking {
  const { label, minutes } = durationFromSessionType(s.type as SessionTypeEnum);
  const participant = (s.participants as unknown as Array<{ id?: string; profile?: { name?: string } }>)
    ?.[0];
  const studentName = participant?.profile?.name ?? null;
  const studentId = participant?.id ?? null;
  const calendar = (s as unknown as { calendarInfo?: { link?: string; hangoutLink?: string } })
    .calendarInfo;
  const joinUrl = calendar?.link ?? calendar?.hangoutLink ?? null;

  const isCancelled = !!(s.cancelStatus && (s.cancelStatus as { id?: string }).id);
  const end = new Date(s.date).getTime() + minutes * 60_000;
  const now = Date.now();

  let status: MentorBooking['status'];
  if (isCancelled) status = 'cancelled';
  else if (end < now) status = 'completed';
  else status = 'upcoming';

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
    raw: s,
  };
}

function normalizeFullSupportSession(
  s: SessionLogDto & { studentUserId?: string },
  studentName: string | null,
): MentorBooking {
  const minutes = parseFullSupportDuration(s.duration);
  const end = new Date(s.dateTime).getTime() + minutes * 60_000;
  const now = Date.now();

  let status: MentorBooking['status'];
  if (s.done) status = 'completed';
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
    joinUrl: null,
    raw: s,
  };
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
