/** API tuition fees are annual currency amounts, not thousands. Missing
 * catalogue fees must remain unknown rather than crashing or implying zero. */
export function formatAnnualTuition(
  fees?: readonly ({ fee?: number | string | null; currency?: { symbol?: string | null } | null } | undefined)[] | null,
): string | undefined {
  const first = fees?.[0];
  if (first?.fee === null || first?.fee === undefined || first.fee === '') return undefined;
  const amount = Number(first.fee);
  if (!Number.isFinite(amount) || amount < 0) return undefined;
  return `${first.currency?.symbol ?? ''}${amount.toLocaleString('en-US')}`;
}
