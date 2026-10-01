import type { PaymentPlansSchema } from 'src/app/api/Api';
import { PaymentPlanTypeEnum } from 'src/app/api/Api';

export interface BookingPriceQuote {
  amount: number;
  currency: string;
}

const PAID_LEVELS = ['junior', 'senior', 'expert', 'uzcombinator'] as const;
type PaidMentorLevel = (typeof PAID_LEVELS)[number];

/** Reads the exact duration/level price returned by /payments/plans. It
 * deliberately returns null if either amount or currency is ambiguous. */
export function getBookingPriceQuote(
  plans: PaymentPlansSchema[] | undefined,
  sessionType: string | undefined,
  mentorLevel: string | undefined,
): BookingPriceQuote | null {
  const level = mentorLevel?.toLowerCase();
  if (!PAID_LEVELS.includes(level as PaidMentorLevel)) return null;

  const planType = sessionType === 'individual60m'
    ? PaymentPlanTypeEnum.Individual60M
    : sessionType === 'individual30m'
      ? PaymentPlanTypeEnum.Individual30M
      : null;
  if (!planType) return null;

  const plan = plans?.find((candidate) => candidate.type === planType);
  const amount = plan?.prices?.[level as PaidMentorLevel];
  const rawCurrency = plan?.currency as { name?: unknown; symbol?: unknown } | undefined;
  const currency =
    (typeof rawCurrency?.name === 'string' && rawCurrency.name.trim()) ||
    (typeof rawCurrency?.symbol === 'string' && rawCurrency.symbol.trim()) ||
    '';

  return typeof amount === 'number' && Number.isFinite(amount) && amount >= 0 && currency
    ? { amount, currency }
    : null;
}
