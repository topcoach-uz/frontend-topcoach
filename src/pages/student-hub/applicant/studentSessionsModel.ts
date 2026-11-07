import { SessionTypeEnum } from "src/app/api/Api";

/** Loose shape of a row from `GET /sessions/me` (backend returns the entity). */
export interface StudentSessionRow {
  id: string;
  date: string;
  type?: SessionTypeEnum | string;
  note?: string | null;
  cancelStatus?: unknown;
  calendarInfo?: { meetingLink?: string | null } | null;
  mentor?: { id?: string; profile?: { name?: string | null } | null } | null;
  reviews?: Array<{
    rating?: number;
    summary?: string;
    reviewer?: { id?: string } | null;
  }> | null;
  report?: {
    topicsCovered?: string;
    homework?: string;
    notes?: string;
    rating?: string;
    submittedAt?: string;
  } | null;
}

/**
 * `GET /sessions/me` responds with `{ data, total }` even though the RTK query
 * is typed as a bare array; accept either shape so callers never crash.
 */
export function unwrapSessions(response: unknown): StudentSessionRow[] {
  if (Array.isArray(response)) return response as StudentSessionRow[];
  const data = (response as { data?: unknown } | null | undefined)?.data;
  return Array.isArray(data) ? (data as StudentSessionRow[]) : [];
}

export function isCancelled(session: StudentSessionRow) {
  return Boolean(session.cancelStatus);
}

export function sessionDurationMinutes(session: StudentSessionRow) {
  return session.type === SessionTypeEnum.Individual30M ? 30 : 60;
}

/** Upcoming = future & not cancelled (soonest first). Past = everything else
 *  that already happened, plus cancelled ones (newest first, shown muted). */
export function splitSessions(sessions: StudentSessionRow[], now = Date.now()) {
  const valid = sessions.filter((s) => Number.isFinite(new Date(s.date).getTime()));
  const upcoming = valid
    .filter((s) => !isCancelled(s) && new Date(s.date).getTime() > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = valid
    .filter((s) => isCancelled(s) || new Date(s.date).getTime() <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { upcoming, past };
}

export function studentReview(session: StudentSessionRow, userId?: string | null) {
  if (!userId) return null;
  return session.reviews?.find((r) => r.reviewer?.id === userId) ?? null;
}

export function hasStudentRated(session: StudentSessionRow, userId?: string | null) {
  return studentReview(session, userId) !== null;
}

export function needsRating(session: StudentSessionRow, userId?: string | null, now = Date.now()) {
  return (
    !isCancelled(session) &&
    new Date(session.date).getTime() <= now &&
    !hasStudentRated(session, userId)
  );
}

/** Student-visible report fields only (never the mentor's private notes/rating). */
export function pickSummaryFields(session: StudentSessionRow) {
  const topicsCovered = session.report?.topicsCovered?.trim();
  const homework = session.report?.homework?.trim();
  if (!topicsCovered && !homework) return null;
  return { topicsCovered: topicsCovered || null, homework: homework || null };
}

export function mentorName(session: StudentSessionRow) {
  return session.mentor?.profile?.name?.trim() || "your mentor";
}
