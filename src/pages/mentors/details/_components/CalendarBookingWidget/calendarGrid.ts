import type { Dayjs } from 'dayjs';

export interface CalendarDay {
  date: Dayjs;
  isCurrentMonth: boolean;
}

/** Sunday-first calendar with complete weeks, including every date in the month. */
export function buildCalendarGrid(month: Dayjs): CalendarDay[][] {
  const first = month.startOf('month');
  const leadingDays = first.day();
  const weekCount = Math.max(5, Math.ceil((leadingDays + month.daysInMonth()) / 7));
  const gridStart = first.subtract(leadingDays, 'day');

  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = gridStart.add(week * 7 + day, 'day');
      return { date, isCurrentMonth: date.isSame(first, 'month') };
    }),
  );
}
