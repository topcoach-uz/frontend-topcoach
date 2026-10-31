export type CourseLesson = { id: string; title: string; duration: number; moduleTitle: string; courseName: string };
export type CourseSession = { id: string; startsAt: string; durationMinutes: number; meetingUrl: string | null; status: 'scheduled' | 'held' | 'cancelled'; summary: string };
export type CourseBooking = {
  id: string;
  source: 'course';
  dateTime: string;
  durationMinutes: number;
  durationLabel: string;
  status: 'upcoming' | 'completed' | 'report-due' | 'cancelled';
  lesson: CourseLesson;
  raw: CourseSession;
};

export function normalizeCourseSession(session: CourseSession, lesson: CourseLesson, now = Date.now()): CourseBooking {
  return {
    id: `course:${session.id}`, source: 'course', dateTime: session.startsAt,
    durationMinutes: session.durationMinutes, durationLabel: `${session.durationMinutes} min`, lesson, raw: session,
    status: session.status === 'cancelled' ? 'cancelled' : session.status === 'held' ? 'completed'
      : new Date(session.startsAt).getTime() + session.durationMinutes * 60_000 <= now ? 'report-due' : 'upcoming',
  };
}

/** Fetch only assigned lessons; keep successful classes visible if one lesson fails. */
export async function loadCourseSchedule(request: <T>(path: string) => Promise<T>) {
  const lessons = await request<CourseLesson[]>('my-lessons');
  const unique = [...new Map(lessons.map(lesson => [lesson.id, lesson])).values()];
  const bookings: CourseBooking[] = [];
  let failedLessons = 0;
  // Bound concurrent requests for mentors with large course assignments.
  for (let start = 0; start < unique.length; start += 4) {
    const batch = unique.slice(start, start + 4);
    const results = await Promise.allSettled(batch.map(async lesson => {
      const sessions = await request<CourseSession[]>(`lessons/${lesson.id}/sessions`);
      return sessions.map(session => normalizeCourseSession(session, lesson));
    }));
    results.forEach(result => { if (result.status === 'fulfilled') bookings.push(...result.value); else failedLessons++; });
  }
  return { bookings, failedLessons };
}
