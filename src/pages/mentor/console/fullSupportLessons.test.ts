import { describe, expect, it, vi } from 'vitest';
import type { SessionLogDto } from 'src/app/services/fullSupportApi';
import { lessonLabel, lessonMinutes } from './fullSupportLessons';

const lesson = (overrides: Partial<SessionLogDto>) => ({ dateTime: '2026-10-16T10:00:00Z', duration: '1h', outcome: 'scheduled', done: false, ...overrides } as SessionLogDto);

describe('mentor lesson schedule', () => {
  it.each([['1h', 60], ['1.5h', 90], ['0.5h', 30], ['60m', 60], ['7m', 7]])('shows %s as %i minutes', (input, expected) => {
    expect(lessonMinutes(input)).toBe(expected);
  });
  it('keeps a one-hour lesson upcoming until its end rather than one minute after start', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-16T10:30:00Z').getTime());
    expect(lessonLabel(lesson({}))).toBe('Upcoming');
    vi.restoreAllMocks();
  });
  it('keeps cancelled and absent lessons out of the attendance queue', () => {
    expect(lessonLabel(lesson({ outcome: 'cancelled' }))).toBe('Cancelled');
    expect(lessonLabel(lesson({ outcome: 'student_no_show' }))).toBe('Student absent');
    expect(lessonLabel(lesson({ outcome: 'mentor_no_show' }))).toBe('Mentor absent');
  });
});
