import axios from 'axios';
import { baseUrl } from 'src/app/services/api/const';
import { ACCESS_TOKEN } from 'src/constants/storage';

export type QuoteProductType = 'course' | 'session' | 'package' | 'caaf';

export interface PaymentQuoteRequest {
  productType: QuoteProductType;
  enrollmentId?: string;
  planId?: string;
  mentorId?: string;
  sessionId?: string;
  referralCode?: string;
}

export interface QuoteLineItem {
  label: string;
  detail?: string;
  amount: number;
}

export interface QuoteDiscount {
  kind: string;
  label: string;
  detail?: string;
  amount: number;
}

export interface PaymentQuote {
  productType: QuoteProductType;
  title: string;
  subtitle?: string;
  /** Denomination of lineItems, subtotal, discounts and total. */
  currency: 'USD' | 'UZS';
  lineItems: QuoteLineItem[];
  subtotal: number;
  discounts: QuoteDiscount[];
  total: number;
  /** What the provider will actually bill. Always UZS. */
  charge: {
    currency: string;
    amount: number;
    usdToUzsRate: number | null;
  };
  referral: {
    applied: boolean;
    code?: string;
    percent?: number;
    reason?: string | null;
  };
  providers: string[];
}

/**
 * Ask the server what this purchase costs.
 *
 * The checkout page renders this rather than deriving amounts from its own URL
 * parameters, so the number shown and the number charged come from one place.
 */
export async function fetchPaymentQuote(
  body: PaymentQuoteRequest,
): Promise<PaymentQuote> {
  const token = localStorage.getItem(ACCESS_TOKEN);
  const response = await axios.post(`${baseUrl}/payments/quote`, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
  return response.data;
}
