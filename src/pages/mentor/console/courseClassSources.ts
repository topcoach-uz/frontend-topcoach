import { useMemo } from 'react';
import {
  useGetLiveClassSessionsQuery,
  useGetMyLiveLessonsQuery,
  type LiveClassSessionDto,
  type LiveLessonDto,
} from 'src/app/services/courses';
import type { MentorBooking } from './sessionSources';

/** Maps one dated course class onto the Schedule's booking shape. */
export function normalizeCourseClass(
  session: LiveClassSessionDto,
  lesson: LiveLessonDto,
  now = Date.now(),
): MentorBooking {
  const start = new Date(session.startsAt).getTime();
  const end = start + session.durationMinutes * 60_000;
  let status: MentorBooking['status'];
  if (session.status === 'cancelled') status = 'cancelled';
  else if (session.status === 'held') status = 'completed';
  else if (end > now) status = 'upcoming';
  else status = 'report-due'; // happened, attendance not recorded yet
  return {
    id: `cc:${session.id}`,
    source: 'course-class',
    dateTime: session.startsAt,
    durationLabel: `${session.durationMinutes} min`,
    durationMinutes: session.durationMinutes,
    description: null,
    studentUserId: null,
    studentName: null,
    status,
    joinUrl: session.meetingUrl,
    courseClass: {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      lessonDuration: lesson.duration,
      moduleTitle: lesson.moduleTitle,
      courseName: lesson.courseName,
    },
    raw: session,
  };
}

/** Dated class meetings of the mentor's live course lessons, as bookings. */
export function useMentorCourseClasses(enabled: boolean) {
  const lessonsQuery = useGetMyLiveLessonsQuery(undefined, { skip: !enabled });
  const lessons = useMemo(() => lessonsQuery.data ?? [], [lessonsQuery.data]);
  const lessonIds = useMemo(() => lessons.map((lesson) => lesson.id).sort(), [lessons]);
  const sessionsQuery = useGetLiveClassSessionsQuery(lessonIds, {
    skip: !enabled || lessonIds.length === 0,
  });

  const classes = useMemo<MentorBooking[]>(() => {
    const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
    return (sessionsQuery.data ?? []).flatMap((session) => {
      const lesson = byId.get(session.lessonId);
      return lesson ? [normalizeCourseClass(session, lesson)] : [];
    });
  }, [lessons, sessionsQuery.data]);

  return {
    classes,
    hasLessons: lessons.length > 0,
    isLoading: lessonsQuery.isLoading || sessionsQuery.isLoading,
    isError: lessonsQuery.isError || sessionsQuery.isError,
    refetch: () => {
      void lessonsQuery.refetch();
      if (lessonIds.length > 0) void sessionsQuery.refetch();
    },
  };
}
