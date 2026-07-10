import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQuery } from './api';

// Mirrors backend CoinEventType in src/infra/database/schemas/coinTransaction.ts
export type CoinEventType =
  | 'daily_login'
  | 'admissions_lesson'
  | 'admissions_module'
  | 'rp_video'
  | 'rp_week'
  | 'ai_match_first'
  | 'ai_match_repeat'
  | 'community_post'
  | 'community_comment'
  | 'community_reply'
  | 'community_revoke'
  | 'marketplace_redeem'
  | 'marketplace_refund';

export type MarketplaceCategory =
  | 'academic'
  | 'coaching'
  | 'apparel'
  | 'study_gear'
  | 'access_perks';

export interface CoinBalance {
  balance: number;
  lifetimeEarned: number;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  eventType: CoinEventType;
  referenceId: string | null;
  createdAt: string;
}

export interface MarketplaceItem {
  id: string;
  sku: string;
  category: MarketplaceCategory;
  title: string;
  description: string;
  imageUrl: string | null;
  costCoins: number | null;
  isLockedUntil: string | null;
  isUnlocked: boolean;
}

// Status lifecycle (backend src/modules/coins/coins.service.ts advanceRedemption):
// pending -> fulfilled -> completed, or pending -> rejected / refunded / cancelled.
export type RedemptionStatus =
  | 'pending'
  | 'fulfilled'
  | 'completed'
  | 'rejected'
  | 'refunded'
  | 'cancelled';

// Mirrors backend RedemptionDto in src/modules/coins/dto/redeem.dto.ts
export interface Redemption {
  id: string;
  sku: string;
  title: string;
  costCoins: number;
  status: RedemptionStatus;
  createdAt: string;
  fulfillmentData?: Record<string, unknown> | null;
}

/**
 * Coin system v1 API. Backend routes at /api/v1/coins/*. See
 * docs/COIN_SYSTEM_PRD.md for the earn rules and rollout plan.
 *
 * Hand-written rather than generated via `yarn api` because the
 * Swagger source points at prod, which doesn't yet have these
 * endpoints. Mirror the backend DTOs above when they change.
 */
export const coinsApi = createApi({
  reducerPath: 'coinsApi',
  baseQuery,
  // Refetch on focus catches coin events that happened in another tab
  // (lesson complete, AI Match, etc.) — backend cache is invalidated on
  // each credit, so the refetch returns fresh data.
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['Balance', 'Transactions', 'Marketplace', 'Redemptions'],
  endpoints: (builder) => ({
    getCoinBalance: builder.query<CoinBalance, void>({
      query: () => 'v1/coins/balance',
      providesTags: ['Balance'],
    }),
    getCoinTransactions: builder.query<CoinTransaction[], number | void>({
      query: (limit) => `v1/coins/transactions${limit ? `?limit=${limit}` : ''}`,
      providesTags: ['Transactions'],
    }),
    getMarketplaceItems: builder.query<MarketplaceItem[], void>({
      query: () => 'v1/coins/marketplace',
      providesTags: ['Marketplace'],
    }),
    triggerDailyLogin: builder.mutation<CoinBalance, void>({
      query: () => ({
        url: 'v1/coins/daily-login',
        method: 'POST',
      }),
      // First call of the day mints +5 → refresh balance + history.
      invalidatesTags: ['Balance', 'Transactions'],
    }),
    // The logged-in user's coin redemption (order) history, newest first.
    getRedemptions: builder.query<Redemption[], number | void>({
      query: (limit) => `v1/coins/redemptions${limit ? `?limit=${limit}` : ''}`,
      providesTags: ['Redemptions'],
    }),
    // Atomically redeems a marketplace item. `idempotencyKey` MUST be
    // minted once client-side (crypto.randomUUID()) and reused across
    // retries of the same redeem attempt — the backend's idempotency
    // guard keys off this header, not the request body.
    redeemItem: builder.mutation<
      Redemption,
      { itemId: string; idempotencyKey: string; fulfillmentData?: Record<string, unknown> }
    >({
      query: ({ itemId, idempotencyKey, fulfillmentData }) => ({
        url: `v1/coins/marketplace/${itemId}/redeem`,
        method: 'POST',
        headers: { 'idempotency-key': idempotencyKey },
        body: fulfillmentData ? { fulfillmentData } : {},
      }),
      invalidatesTags: ['Balance', 'Transactions', 'Marketplace', 'Redemptions'],
    }),
  }),
});

export const {
  useGetCoinBalanceQuery,
  useGetCoinTransactionsQuery,
  useGetMarketplaceItemsQuery,
  useTriggerDailyLoginMutation,
  useGetRedemptionsQuery,
  useRedeemItemMutation,
} = coinsApi;
