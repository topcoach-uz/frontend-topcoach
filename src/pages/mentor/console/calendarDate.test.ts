import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { calendarDateValue, calendarDateForDisplay } from './calendarDate';

describe('mentor calendar deadlines', () => {
  it.each([['Asia/Tashkent', 300], ['America/Los_Angeles', -480], ['Pacific/Auckland', 780], ['Europe/London', 0], ['UTC', 0]] as const)('preserves the selected and displayed day in %s', (zone, offset) => {
    const previous = process.env.TZ;
    process.env.TZ = zone;
    try {
      const selected = dayjs(new Date(2026, 10, 7));
      expect(selected.utcOffset()).toBeCloseTo(offset);
      const payload = calendarDateValue(selected);
      expect(payload).toBe('2026-11-07');
      const displayed = calendarDateForDisplay(payload!);
      expect([displayed.getFullYear(), displayed.getMonth(), displayed.getDate()]).toEqual([2026, 10, 7]);
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });
  it('clears optional calendar dates explicitly', () => {
    expect(calendarDateValue(null)).toBeNull();
    expect(calendarDateValue(undefined)).toBeNull();
  });
  it('keeps session timestamps as actual instants', () => {
    expect(calendarDateForDisplay('2026-11-07T16:30:00+05:00').getTime()).toBe(Date.parse('2026-11-07T11:30:00Z'));
  });
});
