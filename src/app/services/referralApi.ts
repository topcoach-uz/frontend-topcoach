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
  tagTypes: ['ReferralCode', 'ReferralStats'],
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
  useCalculateDiscountMutation,
} = referralApi; 