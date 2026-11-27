import { SessionTypeEnum } from "src/app/api/Api";
import type { SessionLogDto } from "src/app/services/fullSupportApi";
import { lessonMinutes, lessonOutcome } from "src/pages/mentor/console/fullSupportLessons";

/** Loose shape of a row from `GET /sessions/me` (backend returns the entity). */
export interface StudentSessionRow {
  id: string;
  date: string;
  type?: SessionTypeEnum | string;
  note?: string | null;
  cancelStatus?: unknown;
  calendarInfo?: { meetingLink?: string | null } | null;
  mentor?: { id?: string; profile?: { name?: string | null; avatar?: string | null } | null } | null;
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

/**
 * The mentor's display name. Never falls back to another participant; if the
 * "mentor" on the row is the viewer themself (bad/test data) we don't show
 * the student their own name as the mentor.
 */
export function mentorName(session: StudentSessionRow, viewerId?: string | null) {
  if (viewerId && session.mentor?.id === viewerId) return "your mentor";
  return session.mentor?.profile?.name?.trim() || "your mentor";
}

export function mentorAvatar(session: StudentSessionRow, viewerId?: string | null) {
  if (viewerId && session.mentor?.id === viewerId) return null;
  return session.mentor?.profile?.avatar?.trim() || null;
}

export function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return "M";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Row title: the mentor's name, or "Mentor session" when unknown. */
export function mentorTitle(session: StudentSessionRow, viewerId?: string | null) {
  const name = mentorName(session, viewerId);
  return name === "your mentor" ? "Mentor session" : name;
}

/**
 * Full Support / program lessons the mentor scheduled (from
 * `GET /full-support/mentee/sessions`). Upcoming = still scheduled and not yet
 * over (so a lesson in progress keeps its Join link); everything else is past.
 */
export function splitLessons(lessons: SessionLogDto[], now = Date.now()) {
  const valid = lessons.filter((l) => Number.isFinite(new Date(l.dateTime).getTime()));
  const end = (l: SessionLogDto) => new Date(l.dateTime).getTime() + lessonMinutes(l.duration) * 60_000;
  const isUpcoming = (l: SessionLogDto) => lessonOutcome(l) === "scheduled" && end(l) > now;
  const upcoming = valid
    .filter(isUpcoming)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  // A rescheduled lesson is replaced by its new booking, so it isn't listed.
  const past = valid
    .filter((l) => !isUpcoming(l) && lessonOutcome(l) !== "rescheduled")
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  return { upcoming, past };
}

export const LESSON_OUTCOME_LABELS: Record<SessionLogDto["outcome"], string> = {
  scheduled: "Scheduled",
  held: "Held",
  cancelled: "Cancelled",
  student_no_show: "Missed",
  mentor_no_show: "Mentor didn’t join",
  rescheduled: "Rescheduled",
};
