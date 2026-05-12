/**
 * Tiny formatting helpers shared by the Subscription tab components.
 *
 * Pricing display matches the existing convention used in the mentor
 * booking modal — USD primary, UZS in parentheses, non-breaking space
 * thousand separators on the UZS amount.
 */

/** Format a UZS amount with non-breaking-space thousand separators. */
export const formatUzs = (value: number): string =>
  value.toLocaleString('ru-RU').replace(/\s/g, ' ');

/** "$11.99 / mo  (≈ 150 000 UZS)" — both sides; period suffix included. */
export const formatPriceLine = (
  priceUsd: number,
  priceUzs: number,
  period: 'monthly' | 'yearly',
): string => {
  const suffix = period === 'yearly' ? '/ yr' : '/ mo';
  return `$${priceUsd.toFixed(2)} ${suffix}  (≈ ${formatUzs(priceUzs)} UZS)`;
};

/** Just the USD amount — used in tables / receipt lines. */
export const formatUsdInline = (value: number): string => `$${value.toFixed(2)}`;

/** Compact "$11.99 USD" / "$99.99 USD" style. */
export const formatUsdLong = (value: number): string => `$${value.toFixed(2)} USD`;

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "15 Apr 2027". Accepts either ISO `yyyy-mm-dd` or full ISO timestamp
 *  like `2026-05-19T22:16:59.843Z`. Tolerates invalid values. */
export const formatLongDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()] ?? ''} ${d.getFullYear()}`;
};

/** "15 Apr 2027 · 10:16 PM" — for trial-end / next-charge lines where
 *  the time of day matters. Accepts ISO date or full timestamp. */
export const formatLongDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()] ?? ''} ${d.getFullYear()}`;
  const hours24 = d.getHours();
  const hours12 = ((hours24 + 11) % 12) + 1;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const meridiem = hours24 < 12 ? 'AM' : 'PM';
  return `${date} · ${hours12}:${minutes} ${meridiem}`;
};

/** "Apr 15, 2026" — used in billing table rows. */
export const formatTableDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS_SHORT[d.getMonth()] ?? ''} ${d.getDate()}, ${d.getFullYear()}`;
};

/** Pads "MM/YY" from numeric expiry month + 2-digit year. */
export const formatExpiry = (month: number, year: number): string => {
  const mm = String(month).padStart(2, '0');
  const yy = String(year).padStart(2, '0').slice(-2);
  return `${mm}/${yy}`;
};
