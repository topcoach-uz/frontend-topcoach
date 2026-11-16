import { describe, expect, it } from 'vitest';
import type { SessionLogDto } from 'src/app/services/fullSupportApi';
import { splitLessons } from './studentSessionsModel';

const now = new Date('2026-11-16T12:00:00Z').getTime();
const lesson = (id: string, dateTime: string, outcome: SessionLogDto['outcome'], extra: Partial<SessionLogDto> = {}) =>
  ({ id, dateTime, duration: '60', description: id, done: outcome === 'held', outcome, ...extra }) as SessionLogDto;

describe('splitLessons', () => {
  it('lists scheduled future lessons as upcoming, soonest first', () => {
    const { upcoming, past } = splitLessons(
      [
        lesson('later', '2026-11-20T13:00:00Z', 'scheduled'),
        lesson('soon', '2026-11-17T13:00:00Z', 'scheduled'),
        lesson('held', '2026-11-10T13:00:00Z', 'held'),
      ],
      now,
    );
    expect(upcoming.map((l) => l.id)).toEqual(['soon', 'later']);
    expect(past.map((l) => l.id)).toEqual(['held']);
  });

  it('keeps a lesson in progress upcoming, and hides rescheduled ones', () => {
    const { upcoming, past } = splitLessons(
      [
        lesson('live', '2026-11-16T11:30:00Z', 'scheduled'),
        lesson('moved', '2026-11-12T13:00:00Z', 'rescheduled'),
        lesson('cancelled', '2026-11-18T13:00:00Z', 'cancelled'),
      ],
      now,
    );
    expect(upcoming.map((l) => l.id)).toEqual(['live']);
    expect(past.map((l) => l.id)).toEqual(['cancelled']);
  });
});
