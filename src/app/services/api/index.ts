import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import { ACCESS_TOKEN } from 'src/constants/storage';
import { LANGUAGE } from 'src/constants/storage';
import { apiTagTypes, baseUrl } from './const';

// Create our baseQuery instance
const baseQuery = fetchBaseQuery({
  baseUrl: baseUrl,
  prepareHeaders: (headers) => {
    // By default, if we have a token in the store, let's use that for authenticated requests
    const token = localStorage.getItem(ACCESS_TOKEN);
    const language = localStorage.getItem(LANGUAGE) || 'en';

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    headers.set('language', language);

    return headers;
  },
});

const baseQueryWithRetry = retry(baseQuery, { maxRetries: 0 });

/**
 * Create a base API to inject endpoints into elsewhere.
 * Components using this API should import from the injected site,
 * in order to get the appropriate types,
 * and to ensure that the file injecting the endpoints is loaded
 */
export const RtkApi = createApi({
  /**
   * `reducerPath` is optional and will not be required by most users.
   * This is useful if you have multiple API definitions,
   * e.g. where each has a different domain, with no interaction between endpoints.
   * Otherwise, a single API definition should be used in order to support tag invalidation,
   * among other features
   */
  // reducerPath: "splitApi",
  /**
   * A bare bones base query would just be `baseQuery: fetchBaseQuery({ baseUrl: '/' })`
   */
  baseQuery: baseQueryWithRetry,
  /**
   * Tag types must be defined in the original API definition
   * for any tags that would be provided by injected endpoints
   */
  tagTypes: apiTagTypes,
  /**
   * This api has endpoints injected in adjacent files,
   * which is why no endpoints are shown below.
   * If you want all endpoints defined in the same file, they could be included here instead
   */
  endpoints: () => ({}),
});

export const enhancedApi = RtkApi.enhanceEndpoints({
  endpoints: () => ({
    getPost: () => 'test',
  }),
});

export const plansApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentPlans: builder.query<any[], void>({
      query: () => 'payments/plans',
    }),
  }),
});

export const { useGetPaymentPlansQuery } = plansApi;

export const subscriptionPlansApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptionPlans: builder.query<any[], void>({
      query: () => 'subscriptions/plans',
    }),
    getSubscriptionUsage: builder.query<any, void>({
      query: () => `subscriptions/usage?ts=${Date.now()}`,
      providesTags: ['SubscriptionUsage'],
    }),
    getCurrentSubscription: builder.query<any, void>({
      query: () => `subscriptions/current?ts=${Date.now()}`,
      providesTags: ['CurrentSubscription'],
    }),
    cancelSubscription: builder.mutation<any, void>({
      query: () => ({
        url: 'subscriptions/cancel',
        method: 'POST',
      }),
      invalidatesTags: ['CurrentSubscription', 'SubscriptionUsage'],
    }),
    downgradeSubscription: builder.mutation<any, { planId: string }>({
      query: (body) => ({
        url: 'subscriptions/downgrade',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CurrentSubscription', 'SubscriptionUsage'],
    }),
  }),
});

export const { useGetSubscriptionPlansQuery, useGetSubscriptionUsageQuery, useGetCurrentSubscriptionQuery, useCancelSubscriptionMutation, useDowngradeSubscriptionMutation } = subscriptionPlansApi;
