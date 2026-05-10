/**
 * Locked DTO contract for the Subscription tab.
 *
 * These types are the single source of truth for both:
 *   - the real RTK Query slice in `app/services/subscription.ts`
 *   - the dev-only fixtures in `_mocks/subscription.fixtures.ts`
 *
 * They mirror the backend's `/api/subscriptions/*` and
 * `/api/payment-methods` payloads (see `docs/SUBSCRIPTION_PAYMENT_SYSTEM.md`
 * §19). When the backend's swagger lands and `yarn api` regenerates,
 * any drift here is the signal to reconcile.
 */

export type SubscriptionStatus =
  | 'pending'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

export type LocalizedString = {
  en: string;
  ru: string;
  uz: string;
  kk: string;
};

export type PlanFeature = {
  /** i18n key suffix under `settings.subscription.features.*`. */
  key: string;
};

export type PlanDto = {
  id: string;
  /** Discriminator. Currently only the Community plan exists. */
  name: 'community';
  period: 'monthly' | 'yearly';
  priceUsd: number;
  /** Auto-synced UZS sibling, sourced from the FX-rate table. */
  priceUzs: number;
  /** Optional sash on the card (e.g. "Save 10%"). */
  saveBadge: string | null;
  /** Tag line shown below the price (e.g. "$10.83/month equivalent"). */
  subline: string | null;
  displayName: LocalizedString;
  features: PlanFeature[];
  trialDays: number;
  billingPeriodDays: number;
};

export type PaymentMethodDto = {
  id: string;
  provider: 'click' | 'atmos' | 'payme';
  cardBrand: 'uzcard' | 'humo' | 'visa' | 'mastercard' | null;
  last4: string;
  cardholder: string | null;
  expiryMonth: number | null;
  /** 2-digit year (e.g. 27 → 2027). */
  expiryYear: number | null;
  isDefault: boolean;
  /** Full ISO timestamp. */
  addedAt: string;
};

export type SubscriptionDto = {
  id: string;
  status: SubscriptionStatus;
  plan: PlanDto;
  paymentMethodId: string | null;
  /** ISO timestamp; null while pending. */
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  nextRetryAt: string | null;
  failedAttemptsInCycle: number;
};

export type BillingHistoryEntryDto = {
  id: string;
  /** ISO yyyy-mm-dd or full ISO timestamp. */
  date: string;
  description: string;
  amountUsd: number | null;
  amountUzs: number;
  /** Per the no-refund policy, only successful charges are recorded. */
  status: 'paid';
  invoiceNumber: string | null;
};
