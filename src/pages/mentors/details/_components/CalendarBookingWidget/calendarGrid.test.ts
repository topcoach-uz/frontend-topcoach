import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { buildCalendarGrid } from './calendarGrid';

describe('booking calendar dates', () => {
  it.each(['2026-08-01', '2027-05-01', '2027-01-01'])('keeps month-end booking dates reachable for %s', (month) => {
    const grid = buildCalendarGrid(dayjs(month));
    const dates = grid.flat().filter((day) => day.isCurrentMonth).map((day) => day.date.date());
    expect(grid).toHaveLength(6);
    expect(dates).toEqual(Array.from({ length: 31 }, (_, index) => index + 1));
  });

  it.each([['2026-02-01', 28], ['2028-02-01', 29], ['2026-09-01', 30]] as const)('represents %s without duplicate or missing dates', (month, count) => {
    const grid = buildCalendarGrid(dayjs(month));
    const dates = grid.flat().filter((day) => day.isCurrentMonth);
    expect(dates).toHaveLength(count);
    expect(new Set(dates.map((day) => day.date.format('YYYY-MM-DD'))).size).toBe(count);
    expect(dates[0].date.date()).toBe(1);
    expect(dates[dates.length - 1].date.date()).toBe(count);
    for (const week of grid) {
      expect(week).toHaveLength(7);
      expect(week[0].date.day()).toBe(0);
      expect(week[6].date.day()).toBe(6);
    }
  });
});
