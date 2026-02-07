// Shared timezone options for mentors (availability) and mentees (booking)
// Format: (UTC±H:MM) City - clear for global users

export interface TimezoneOption {
  label: string;
  value: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { label: '(UTC-12:00) Baker Island', value: 'Etc/GMT+12' },
  { label: '(UTC-11:00) Pago Pago, Niue', value: 'Pacific/Pago_Pago' },
  { label: '(UTC-10:00) Hawaii', value: 'Pacific/Honolulu' },
  { label: '(UTC-09:30) Marquesas', value: 'Pacific/Marquesas' },
  { label: '(UTC-09:00) Alaska', value: 'America/Anchorage' },
  { label: '(UTC-08:00) Los Angeles, Vancouver', value: 'America/Los_Angeles' },
  { label: '(UTC-07:00) Denver, Phoenix', value: 'America/Denver' },
  { label: '(UTC-06:00) Chicago, Mexico City', value: 'America/Chicago' },
  { label: '(UTC-05:00) New York, Toronto', value: 'America/New_York' },
  { label: '(UTC-04:00) Caracas, Santiago', value: 'America/Caracas' },
  { label: '(UTC-03:00) São Paulo, Buenos Aires', value: 'America/Sao_Paulo' },
  { label: '(UTC-02:00) Mid-Atlantic', value: 'America/Noronha' },
  { label: '(UTC-01:00) Azores, Cape Verde', value: 'Atlantic/Azores' },
  { label: '(UTC+00:00) London, Dublin', value: 'Europe/London' },
  { label: '(UTC+01:00) Paris, Berlin, Amsterdam', value: 'Europe/Paris' },
  { label: '(UTC+02:00) Cairo, Kyiv, Istanbul', value: 'Africa/Cairo' },
  { label: '(UTC+03:00) Moscow, Riyadh', value: 'Europe/Moscow' },
  { label: '(UTC+04:00) Dubai, Baku, Tbilisi', value: 'Asia/Dubai' },
  { label: '(UTC+05:00) Tashkent, Islamabad', value: 'Asia/Tashkent' },
  { label: '(UTC+05:30) Mumbai, Kolkata', value: 'Asia/Kolkata' },
  { label: '(UTC+06:00) Almaty, Dhaka', value: 'Asia/Almaty' },
  { label: '(UTC+07:00) Bangkok, Jakarta', value: 'Asia/Bangkok' },
  { label: '(UTC+08:00) Singapore, Shanghai, Perth', value: 'Asia/Singapore' },
  { label: '(UTC+09:00) Tokyo, Seoul', value: 'Asia/Tokyo' },
  { label: '(UTC+10:00) Sydney, Melbourne', value: 'Australia/Sydney' },
  { label: '(UTC+11:00) Solomon Islands', value: 'Pacific/Guadalcanal' },
  { label: '(UTC+12:00) Auckland, Fiji', value: 'Pacific/Auckland' },
  { label: '(UTC+13:00) Samoa, Tonga', value: 'Pacific/Apia' },
  { label: '(UTC+14:00) Line Islands', value: 'Pacific/Kiritimati' },
];

/** Get browser-detected timezone or fallback to Asia/Tashkent */
export function getBrowserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'Asia/Tashkent';
  } catch {
    return 'Asia/Tashkent';
  }
}

/** Format a timezone for display (replace underscores with space) */
export function formatTimezoneLabel(tz: string): string {
  return tz.replace(/_/g, ' ');
}
