/**
 * Subscription tab — dev-only fixtures.
 *
 * Originally Phase 1B mock data; in Phase 2B the type definitions moved
 * to `../types.ts` (the locked DTO contract), and this file just exposes
 * canned payloads of those DTOs plus a `?state=` switcher used by the
 * page entry as a fallback when the real backend isn't running.
 *
 * IMPORTANT: the legacy fixture-type names (`PlanFixture`,
 * `PaymentMethodFixture`, `BillingHistoryEntry`, `SubscriptionFixture`)
 * are kept as **aliases of the DTOs** so existing imports keep working
 * during the rollout. New code should import the `*Dto` names directly.
 */

import type {
  BillingHistoryEntryDto,
  LocalizedString,
  PaymentMethodDto,
  PlanDto,
  PlanFeature,
  SubscriptionDto,
  SubscriptionStatus,
} from '../types';

// ---------------------------------------------------------------------------
// Type re-exports — keep legacy fixture-type names alive as aliases of the
// real DTOs so the components no longer care whether they're rendering
// mock data or live data.
// ---------------------------------------------------------------------------

export type { LocalizedString, PlanFeature, SubscriptionStatus } from '../types';

export type PlanFixture = PlanDto;
export type PaymentMethodFixture = PaymentMethodDto;
export type BillingHistoryEntry = BillingHistoryEntryDto;
export type SubscriptionFixture = SubscriptionDto | null;

/** Fixture-only union: real backend uses `SubscriptionStatus` (no `'none'`). */
export type SubscriptionState = SubscriptionStatus | 'none';

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

const COMMUNITY_FEATURES: PlanFeature[] = [
  { key: 'unlimited_messages' },
  { key: 'find_study_buddy' },
  { key: 'full_sat_prep' },
  { key: 'research_prep' },
  { key: 'earn_coins' },
];

const COMMUNITY_DISPLAY_NAME: LocalizedString = {
  en: 'Community',
  ru: 'Сообщество',
  uz: 'Hamjamiyat',
  kk: 'Қауымдастық',
};

export const FIXTURE_PLANS: PlanDto[] = [
  {
    id: 'plan-monthly-usd',
    name: 'community',
    period: 'monthly',
    priceUsd: 11.99,
    priceUzs: 150_000,
    saveBadge: null,
    subline: 'Cancel anytime',
    displayName: COMMUNITY_DISPLAY_NAME,
    features: COMMUNITY_FEATURES,
    trialDays: 7,
    billingPeriodDays: 30,
  },
  {
    id: 'plan-yearly-usd',
    name: 'community',
    period: 'yearly',
    priceUsd: 129.99,
    priceUzs: 1_625_000,
    saveBadge: 'Save 10%',
    subline: '$10.83/month equivalent',
    displayName: COMMUNITY_DISPLAY_NAME,
    features: COMMUNITY_FEATURES,
    trialDays: 7,
    billingPeriodDays: 365,
  },
];

// ---------------------------------------------------------------------------
// Payment methods + billing history
// ---------------------------------------------------------------------------

export const FIXTURE_PAYMENT_METHODS: PaymentMethodDto[] = [
  {
    id: 'pm1',
    provider: 'click',
    cardBrand: 'uzcard',
    last4: '3347',
    expiryMonth: 10,
    expiryYear: 27,
    isDefault: true,
    cardholder: 'Sherali Ozodov',
    addedAt: '2026-04-12T00:00:00.000Z',
  },
  {
    id: 'pm2',
    provider: 'atmos',
    cardBrand: 'humo',
    last4: '8821',
    expiryMonth: 3,
    expiryYear: 28,
    isDefault: false,
    cardholder: 'Sherali Ozodov',
    addedAt: '2026-03-01T00:00:00.000Z',
  },
];

export const FIXTURE_BILLING_HISTORY: BillingHistoryEntryDto[] = [
  {
    id: 'b1',
    date: '2026-04-15',
    description: 'Community · Yearly',
    amountUsd: 129.99,
    amountUzs: 1_625_000,
    status: 'paid',
    invoiceNumber: 'INV-2026-0415',
  },
  {
    id: 'b2',
    date: '2026-03-15',
    description: 'Community · Monthly',
    amountUsd: 11.99,
    amountUzs: 150_000,
    status: 'paid',
    invoiceNumber: 'INV-2026-0315',
  },
];

// ---------------------------------------------------------------------------
// Per-state fixtures
// ---------------------------------------------------------------------------

const monthlyPlan = FIXTURE_PLANS.find((p) => p.period === 'monthly')!;
const yearlyPlan = FIXTURE_PLANS.find((p) => p.period === 'yearly')!;

const isoDateOffset = (days: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const FIXTURES_BY_STATE: Record<SubscriptionState, SubscriptionDto | null> = {
  pending: {
    id: 'sub-pending',
    status: 'pending',
    plan: monthlyPlan,
    paymentMethodId: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    nextRetryAt: null,
    failedAttemptsInCycle: 0,
  },
  active: {
    id: 'sub-active',
    status: 'active',
    plan: yearlyPlan,
    paymentMethodId: 'pm1',
    currentPeriodStart: '2026-04-15',
    currentPeriodEnd: '2027-04-15',
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    nextRetryAt: null,
    failedAttemptsInCycle: 0,
  },
  trialing: {
    id: 'sub-trialing',
    status: 'trialing',
    plan: monthlyPlan,
    paymentMethodId: 'pm1',
    currentPeriodStart: isoDateOffset(0),
    currentPeriodEnd: isoDateOffset(7),
    cancelAtPeriodEnd: false,
    trialEndsAt: isoDateOffset(7),
    nextRetryAt: null,
    failedAttemptsInCycle: 0,
  },
  past_due: {
    id: 'sub-past-due',
    status: 'past_due',
    plan: yearlyPlan,
    paymentMethodId: 'pm1',
    currentPeriodStart: '2026-04-15',
    currentPeriodEnd: '2027-04-15',
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    nextRetryAt: isoDateOffset(1),
    failedAttemptsInCycle: 1,
  },
  canceled: {
    id: 'sub-canceled',
    status: 'active',
    plan: yearlyPlan,
    paymentMethodId: 'pm1',
    currentPeriodStart: '2026-04-15',
    currentPeriodEnd: '2027-04-15',
    cancelAtPeriodEnd: true,
    trialEndsAt: null,
    nextRetryAt: null,
    failedAttemptsInCycle: 0,
  },
  expired: {
    id: 'sub-expired',
    status: 'expired',
    plan: yearlyPlan,
    paymentMethodId: 'pm1',
    currentPeriodStart: '2025-04-15',
    currentPeriodEnd: '2026-04-15',
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    nextRetryAt: null,
    failedAttemptsInCycle: 0,
  },
  none: null,
};
