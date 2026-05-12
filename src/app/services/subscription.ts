/**
 * Subscription tab — RTK Query slice.
 *
 * Phase 2 reads (plans, current sub, billing history, saved cards) +
 * Phase 3 writes (add-card 2-step OTP bind, default/remove, start sub,
 * bind card to sub). Cancel/change-plan land in Phase 4.
 */
import { RtkApi } from './api';
import type {
  BillingHistoryEntryDto,
  PaymentMethodDto,
  PlanDto,
  SubscriptionDto,
} from 'src/pages/student-hub/settings/subscription/types';

// ── Phase 3 request/response shapes (FE mirrors of backend DTOs) ─────────────

export type Provider = 'click' | 'atmos';

export type InitPaymentMethodRequest = {
  provider: Provider;
  /** 16-digit PAN, spaces tolerated. */
  cardNumber: string;
  /** YYMM (e.g. "2510" for Oct 2025). */
  expiryYyMm: string;
};

export type InitPaymentMethodResponse = {
  /** Pending billing_cards id; pass to /confirm. */
  paymentMethodId: string;
  phoneMasked: string | null;
  last4: string;
  /** ISO timestamp when the OTP window expires. */
  expiresAt: string;
};

export type ConfirmPaymentMethodRequest = {
  paymentMethodId: string;
  otp: string;
};

export type StartSubscriptionRequest = {
  planId: string;
  /** Optional: skip /bind-card and transition straight to trialing. */
  paymentMethodId?: string;
};

export type BindSubscriptionCardRequest = {
  subscriptionId: string;
  paymentMethodId: string;
};

export type CancelSubscriptionRequest = {
  subscriptionId: string;
  reason?: string;
};

export type ChangePlanRequest = {
  subscriptionId: string;
  newPlanId: string;
};

export const subscriptionApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Reads ────────────────────────────────────────────────────────────
    getSubscriptionPlans: builder.query<PlanDto[], void>({
      query: () => 'subscriptions/plans',
      providesTags: ['SubscriptionPlan'],
    }),
    getCurrentSubscription: builder.query<SubscriptionDto | null, void>({
      query: () => 'subscriptions/current',
      providesTags: ['CurrentSubscription'],
    }),
    getBillingHistory: builder.query<
      BillingHistoryEntryDto[],
      { page?: number; limit?: number } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.page) params.set('page', String(args.page));
        if (args?.limit) params.set('limit', String(args.limit));
        const qs = params.toString();
        return `subscriptions/billing-history${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['BillingHistory'],
    }),
    getPaymentMethods: builder.query<PaymentMethodDto[], void>({
      query: () => 'payment-methods',
      providesTags: ['PaymentMethod'],
    }),

    // ── Writes (Phase 3) ─────────────────────────────────────────────────

    /** Step 1 of OTP bind. Persists a pending card row, sends OTP to user's phone. */
    initPaymentMethod: builder.mutation<
      InitPaymentMethodResponse,
      InitPaymentMethodRequest
    >({
      query: (body) => ({
        url: 'payment-methods/init',
        method: 'POST',
        body,
      }),
      // Don't invalidate PaymentMethod here — the row isn't user-visible
      // (isActive=false) until /confirm flips it.
    }),

    /**
     * Atmos hosted card-bind (Visa / Mastercard, non-PCI). Returns an
     * Atmos URL we redirect the user to — Atmos collects PAN/CVC on
     * their own page, then server-pings our callback with the resulting
     * card_id which flips the pending row to active. The user lands
     * back on `?section=account&target=settings&tab=subscription` after.
     */
    initCheckoutBindAtmos: builder.mutation<
      { paymentMethodId: string; url: string },
      void
    >({
      query: () => ({
        url: 'payment-methods/checkout-bind/init',
        method: 'POST',
      }),
    }),

    /** Step 2 of OTP bind. Verifies OTP, returns the now-confirmed card. */
    confirmPaymentMethod: builder.mutation<
      PaymentMethodDto,
      ConfirmPaymentMethodRequest
    >({
      query: ({ paymentMethodId, otp }) => ({
        url: `payment-methods/${paymentMethodId}/confirm`,
        method: 'POST',
        body: { otp },
      }),
      invalidatesTags: ['PaymentMethod'],
    }),

    setDefaultPaymentMethod: builder.mutation<PaymentMethodDto, string>({
      query: (id) => ({
        url: `payment-methods/${id}/default`,
        method: 'POST',
      }),
      invalidatesTags: ['PaymentMethod', 'CurrentSubscription'],
    }),

    removePaymentMethod: builder.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `payment-methods/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PaymentMethod', 'CurrentSubscription'],
    }),

    startSubscription: builder.mutation<SubscriptionDto, StartSubscriptionRequest>({
      query: (body) => ({
        url: 'subscriptions/start',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CurrentSubscription', 'PaymentMethod'],
    }),

    bindSubscriptionCard: builder.mutation<
      SubscriptionDto,
      BindSubscriptionCardRequest
    >({
      query: ({ subscriptionId, paymentMethodId }) => ({
        url: `subscriptions/${subscriptionId}/bind-card`,
        method: 'POST',
        body: { paymentMethodId },
      }),
      invalidatesTags: ['CurrentSubscription'],
    }),

    /**
     * Schedule a cancellation. Backend sets cancelAtPeriodEnd=true; user
     * keeps access until currentPeriodEnd. Refunds are out of policy.
     */
    cancelSubscription: builder.mutation<SubscriptionDto, CancelSubscriptionRequest>({
      query: ({ subscriptionId, reason }) => ({
        url: `subscriptions/${subscriptionId}/cancel`,
        method: 'POST',
        body: reason ? { reason } : {},
      }),
      invalidatesTags: ['CurrentSubscription'],
    }),

    /** Reverse a scheduled cancellation. */
    reactivateSubscription: builder.mutation<SubscriptionDto, string>({
      query: (subscriptionId) => ({
        url: `subscriptions/${subscriptionId}/reactivate`,
        method: 'POST',
      }),
      invalidatesTags: ['CurrentSubscription'],
    }),

    /** Schedule a plan change for the next billing cycle (no proration in v1). */
    changeSubscriptionPlan: builder.mutation<SubscriptionDto, ChangePlanRequest>({
      query: ({ subscriptionId, newPlanId }) => ({
        url: `subscriptions/${subscriptionId}/change-plan`,
        method: 'POST',
        body: { newPlanId },
      }),
      invalidatesTags: ['CurrentSubscription'],
    }),
  }),
});

export const {
  useGetSubscriptionPlansQuery,
  useGetCurrentSubscriptionQuery,
  useGetBillingHistoryQuery,
  useGetPaymentMethodsQuery,
  useInitPaymentMethodMutation,
  useInitCheckoutBindAtmosMutation,
  useConfirmPaymentMethodMutation,
  useSetDefaultPaymentMethodMutation,
  useRemovePaymentMethodMutation,
  useStartSubscriptionMutation,
  useBindSubscriptionCardMutation,
  useCancelSubscriptionMutation,
  useReactivateSubscriptionMutation,
  useChangeSubscriptionPlanMutation,
} = subscriptionApi;
