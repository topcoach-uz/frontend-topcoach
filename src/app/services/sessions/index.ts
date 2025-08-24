import {
  BookSessionDto,
  BuySubscriptionDto,
  BuySubscriptionPlanDto,
  CancelSessionDto,
  InitBookingDto,
  RateSessionDto,
  ReportUserDto,
  SessionsSchema,
} from 'src/app/api/Api';
import { RtkApi } from '../api';

export const sessionsApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    getMySessions: build.query<SessionsSchema[], void>({
      query: () => ({ url: '/sessions/me' }),
      providesTags: ['MySessions'],
    }),
    bookSession: build.mutation<void, BookSessionDto>({
      query: (body) => ({ url: '/sessions/book', method: 'POST', body }),
      invalidatesTags: ['GetMentorBalance', 'GetMentorDetail'],
    }),
    // cancel session
    cancelSession: build.mutation<void, CancelSessionDto>({
      query: (body) => ({ url: '/sessions/cancel', method: 'POST', body }),
      invalidatesTags: ['MySessions'],
    }),
    cancelSessionAsStudent: build.mutation<void, BookSessionDto>({
      query: (body) => ({ url: '/sessions/withdraw', method: 'POST', body }),
      invalidatesTags: ['MySessions', 'GetMe'],
    }),
    // report session
    reportSession: build.mutation<void, ReportUserDto>({
      query: (body) => ({
        url: '/users/report',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MySessions'],
    }),
    // rate session
    rateSession: build.mutation<void, RateSessionDto>({
      query: (body) => ({
        url: '/sessions/rate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MySessions'],
    }),
    validateAndPay: build.mutation<
      void,
      { method: string; body: InitBookingDto }
    >({
      query: ({ method, body }) => ({
        url: `/payments/validate/${method}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['GetMentorBalance'],
    }),
    buySubscription: build.mutation<
      void,
      { method: string; body: BuySubscriptionPlanDto }
    >({
      query: ({ method, body }) => ({
        url: `/payments/subscription/${method}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['GetMentorBalance'],
    }),
    // Giveaway session endpoints
    getGiveawaySessions: build.query<SessionsSchema[], void>({
      query: () => ({ url: '/sessions/giveaway' }),
      providesTags: ['GiveawaySessions'],
    }),
    getGiveawayStatus: build.query<{ hasBookedGiveaway: boolean; bookedSessionId?: string }, void>({
      query: () => ({ url: '/sessions/giveaway/status' }),
      providesTags: ['GiveawayStatus'],
    }),
    bookGiveawaySession: build.mutation<SessionsSchema, { sessionId: string }>({
      query: (body) => ({ url: '/sessions/giveaway/book', method: 'POST', body }),
      invalidatesTags: ['GiveawaySessions', 'GiveawayStatus', 'GetMe'],
    }),
    cancelGiveawaySession: build.mutation<SessionsSchema, { sessionId: string }>({
      query: (body) => ({ url: '/sessions/giveaway/cancel', method: 'POST', body }),
      invalidatesTags: ['GiveawaySessions', 'GiveawayStatus', 'GetMe'],
    }),
  }),
});

export const {
  useGetMySessionsQuery,
  useBookSessionMutation,
  useCancelSessionMutation,
  useReportSessionMutation,
  useRateSessionMutation,
  useBuySubscriptionMutation,
  useValidateAndPayMutation,
  useCancelSessionAsStudentMutation,
  useGetGiveawaySessionsQuery,
  useGetGiveawayStatusQuery,
  useBookGiveawaySessionMutation,
  useCancelGiveawaySessionMutation,
} = sessionsApi;
