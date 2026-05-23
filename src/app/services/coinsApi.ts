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
  | 'ai_match_repeat';

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
  tagTypes: ['Balance', 'Transactions', 'Marketplace'],
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
  }),
});

export const {
  useGetCoinBalanceQuery,
  useGetCoinTransactionsQuery,
  useGetMarketplaceItemsQuery,
  useTriggerDailyLoginMutation,
} = coinsApi;
