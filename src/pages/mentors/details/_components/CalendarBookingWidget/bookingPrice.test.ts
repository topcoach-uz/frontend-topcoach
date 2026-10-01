import { describe, expect, it } from 'vitest';
import type { PaymentPlansSchema } from 'src/app/api/Api';
import { PaymentPlanTypeEnum } from 'src/app/api/Api';
import { getBookingPriceQuote } from './bookingPrice';

const plans = [
  {
    type: PaymentPlanTypeEnum.Individual30M,
    prices: { senior: 250_000 },
    currency: { name: 'UZS', symbol: "so'm" },
  },
  {
    type: PaymentPlanTypeEnum.Individual60M,
    prices: { senior: 450_000 },
    currency: { name: 'UZS', symbol: "so'm" },
  },
] as PaymentPlansSchema[];

describe('getBookingPriceQuote', () => {
  it('uses the authoritative plan for the selected duration and mentor level', () => {
    expect(getBookingPriceQuote(plans, 'individual60m', 'senior')).toEqual({
      amount: 450_000,
      currency: 'UZS',
    });
  });

  it('does not guess a quote when the price or currency is unavailable', () => {
    expect(getBookingPriceQuote(plans, 'individual30m', 'expert')).toBeNull();
    expect(
      getBookingPriceQuote(
        [{ ...plans[0], currency: {} }] as PaymentPlansSchema[],
        'individual30m',
        'senior',
      ),
    ).toBeNull();
  });

  it('does not quote pro bono or unknown session types', () => {
    expect(getBookingPriceQuote(plans, 'individual30m', 'probono')).toBeNull();
    expect(getBookingPriceQuote(plans, 'group', 'senior')).toBeNull();
  });
});
