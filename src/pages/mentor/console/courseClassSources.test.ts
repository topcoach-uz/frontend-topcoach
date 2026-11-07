import { describe, expect, it, vi } from 'vitest';
import { normalizeCourseClass } from './courseClassSources';
import { bookingDisplay } from './sessionDisplay';
import type { LiveClassSessionDto, LiveLessonDto } from 'src/app/services/courses';

vi.mock('src/app/services/courses', () => ({
  useGetLiveClassSessionsQuery: vi.fn(),
  useGetMyLiveLessonsQuery: vi.fn(),
}));

const lesson: LiveLessonDto = { id: 'l1', title: 'Essay clinic', duration: 60, moduleTitle: 'Writing', courseName: 'admissions' };
const session = (extra: Partial<LiveClassSessionDto> = {}): LiveClassSessionDto => ({
  id: 's1', lessonId: 'l1', startsAt: '2026-11-10T10:00:00Z', durationMinutes: 90,
  meetingUrl: 'https://meet.example/x', status: 'scheduled', summary: '', ...extra,
});
const at = (iso: string) => new Date(iso).getTime();

describe('normalizeCourseClass', () => {
  it('maps a future scheduled class to upcoming with lesson info', () => {
    const b = normalizeCourseClass(session(), lesson, at('2026-11-03T00:00:00Z'));
    expect(b).toMatchObject({ id: 'cc:s1', source: 'course-class', status: 'upcoming', durationMinutes: 90, joinUrl: 'https://meet.example/x' });
    expect(b.courseClass).toMatchObject({ lessonId: 'l1', lessonTitle: 'Essay clinic', lessonDuration: 60 });
  });
  it('flags a finished but unrecorded class as needing attendance', () => {
    const b = normalizeCourseClass(session(), lesson, at('2026-11-10T12:00:00Z'));
    expect(b.status).toBe('report-due');
    expect(bookingDisplay(b).label).toBe('Awaiting attendance');
  });
  it('maps held and cancelled', () => {
    expect(normalizeCourseClass(session({ status: 'held' }), lesson).status).toBe('completed');
    expect(normalizeCourseClass(session({ status: 'cancelled' }), lesson).status).toBe('cancelled');
  });
});
