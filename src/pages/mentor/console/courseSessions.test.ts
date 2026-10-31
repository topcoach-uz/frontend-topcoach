import { describe, it, expect } from 'vitest';
import { normalizeCourseSession, loadCourseSchedule, type CourseLesson, type CourseSession } from './courseSessions';
import { scheduleScopes } from './sessionDisplay';
const lesson: CourseLesson = { id: 'lesson-a', title: 'SAT algebra', duration: 60, moduleTitle: 'Math', courseName: 'SAT' };
const session: CourseSession = { id: 'class-a', startsAt: '2026-10-31T10:00:00Z', durationMinutes: 60, meetingUrl: null, summary: '', status: 'scheduled' };
const now = new Date('2026-10-31T10:30:00Z').getTime();
describe('Course classes in the mentor schedule', () => {
  it('keeps a class upcoming until it ends, then requires a class record', () => {
    expect(normalizeCourseSession(session, lesson, now).status).toBe('upcoming');
    expect(normalizeCourseSession(session, lesson, now + 30 * 60_000).status).toBe('report-due');
  });
  it('uses namespaced session IDs and keeps held/cancelled records out of the due queue', () => {
    const held = normalizeCourseSession({ ...session, status: 'held' }, lesson, now);
    const cancelled = normalizeCourseSession({ ...session, id: 'class-b', status: 'cancelled' }, lesson, now);
    const scopes = scheduleScopes([held, cancelled]);
    expect(held.id).toBe('course:class-a');
    expect(scopes.due).toHaveLength(0);
    expect(scopes.past).toEqual([held]);
    expect(scopes.cancelled).toEqual([cancelled]);
  });
  it('deduplicates assigned lessons and preserves successful schedules on a partial failure', async () => {
    const paths: string[] = [];
    const result = await loadCourseSchedule(async <T,>(path: string): Promise<T> => {
      paths.push(path);
      if (path === 'my-lessons') return [lesson, lesson, { ...lesson, id: 'lesson-b' }] as T;
      if (path.includes('lesson-b')) throw new Error('Failed');
      return [session] as T;
    });
    expect(paths.filter(path => path === 'lessons/lesson-a/sessions')).toHaveLength(1);
    expect(result.bookings.map(booking => booking.raw.id)).toEqual(['class-a']);
    expect(result.failedLessons).toBe(1);
  });
  it('does not mask a failure loading assigned lessons as an empty schedule', async () => {
    await expect(loadCourseSchedule(async () => { throw new Error('Unauthorized'); })).rejects.toThrow('Unauthorized');
  });
});
