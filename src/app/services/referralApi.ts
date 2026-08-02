import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './api';

// Types
export interface ValidateReferralCodeRequest {
  code: string;
}

export interface ValidateReferralCodeResponse {
  valid: boolean;
  referrerName: string;
  message: string;
  discountPercentage?: number;
}

export interface ReferralCodeResponse {
  code: string | null;
}

export interface ReferralStatsResponse {
  totalReferrals: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
}

export interface ReferralHistoryItem {
  id: string;
  date: string;
  /** First name plus last initial. The backend never returns a full identity. */
  refereeName: string;
  productType: string | null;
  theirSpendUsd: number;
  youEarnedUsd: number;
  status: 'pending' | 'confirmed' | 'reversed' | 'paid';
}

export interface ReferralBonusBalance {
  balanceUsd: number;
  lifetimeEarnedUsd: number;
}

export interface ReferralBonusMovement {
  id: string;
  date: string;
  amountUsd: number;
  eventType: string;
}

export interface CalculateDiscountRequest {
  code: string;
  amount: number;
}

export interface CalculateDiscountResponse {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  discountPercentage: number;
  valid: boolean;
  referrerName: string;
  message: string;
}

// API endpoints
export const referralApi = createApi({
  reducerPath: 'referralApi',
  baseQuery,
  tagTypes: ['ReferralCode', 'ReferralStats', 'ReferralBonus'],
  endpoints: (builder) => ({
    // Validate referral code
    validateReferralCode: builder.mutation<ValidateReferralCodeResponse, ValidateReferralCodeRequest>({
      query: (body) => ({
        url: '/referral/validate',
        method: 'POST',
        body,
      }),
    }),

    // Get user's referral code
    getMyReferralCode: builder.query<ReferralCodeResponse, void>({
      query: () => '/referral/my-code',
      providesTags: ['ReferralCode'],
    }),

    // Get referral statistics
    getReferralStats: builder.query<ReferralStatsResponse, void>({
      query: () => '/referral/stats',
      providesTags: ['ReferralStats'],
    }),

    // Who used my code, and what each one earned me
    getReferralHistory: builder.query<ReferralHistoryItem[], number | void>({
      query: (limit) => `/referral/history${limit ? `?limit=${limit}` : ''}`,
      providesTags: ['ReferralStats'],
    }),

    // Accumulated bonus balance
    getReferralBonusBalance: builder.query<ReferralBonusBalance, void>({
      query: () => '/referral/bonus/balance',
      providesTags: ['ReferralBonus'],
    }),

    // Every movement on the balance, newest first
    getReferralBonusHistory: builder.query<ReferralBonusMovement[], number | void>({
      query: (limit) => `/referral/bonus/history${limit ? `?limit=${limit}` : ''}`,
      providesTags: ['ReferralBonus'],
    }),

    // Calculate discount
    calculateDiscount: builder.mutation<CalculateDiscountResponse, CalculateDiscountRequest>({
      query: (body) => ({
        url: '/referral/calculate-discount',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useValidateReferralCodeMutation,
  useGetMyReferralCodeQuery,
  useGetReferralStatsQuery,
  useGetReferralHistoryQuery,
  useGetReferralBonusBalanceQuery,
  useGetReferralBonusHistoryQuery,
  useCalculateDiscountMutation,
} = referralApi; 