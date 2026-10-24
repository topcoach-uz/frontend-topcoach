import type { Dayjs } from 'dayjs';

// These fields are calendar days stored in SQL DATE columns, not instants.
export function calendarDateValue(value: Dayjs | null | undefined): string | null {
  return value?.format('YYYY-MM-DD') ?? null;
}

export function calendarDateForDisplay(value: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
}
