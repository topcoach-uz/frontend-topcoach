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

/** "15 Apr 2027". Accepts ISO yyyy-mm-dd; tolerates invalid values. */
export const formatLongDate = (iso: string): string => {
  const [year, month, day] = iso.split('-').map((part) => Number(part));
  if (!year || !month || !day) return iso;
  const monthLabel = MONTHS_SHORT[month - 1] ?? '';
  return `${day} ${monthLabel} ${year}`;
};

/** "Apr 15, 2026" — used in billing table rows. */
export const formatTableDate = (iso: string): string => {
  const [year, month, day] = iso.split('-').map((part) => Number(part));
  if (!year || !month || !day) return iso;
  const monthLabel = MONTHS_SHORT[month - 1] ?? '';
  return `${monthLabel} ${day}, ${year}`;
};

/** Pads "MM/YY" from numeric expiry month + 2-digit year. */
export const formatExpiry = (month: number, year: number): string => {
  const mm = String(month).padStart(2, '0');
  const yy = String(year).padStart(2, '0').slice(-2);
  return `${mm}/${yy}`;
};
