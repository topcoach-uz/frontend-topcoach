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
      // Force refetch to ensure mentor's view is updated
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate and refetch all session-related queries
          dispatch(sessionsApi.util.invalidateTags(['MySessions']));
        } catch {
          // Error handling is done in the component
        }
      },
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
    // mentor post-session report (one-time platform sessions)
    submitSessionReport: build.mutation<
      void,
      {
        id: string;
        topicsCovered: string;
        notes: string;
        homework?: string;
        rating: 'tough' | 'okay' | 'good' | 'great';
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/sessions/${id}/report`,
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
    bookBySlot: build.mutation<
      any,
      { mentorId: string; start: string; type: string; comment?: string }
    >({
      query: (body) => ({ url: '/sessions/book-slot', method: 'POST', body }),
      invalidatesTags: (result) =>
        (result as any)?.paymentRequired ? [] : ['GetMentorDetail', 'MySessions', 'AvailableSlots', 'GetMe'],
    }),
    // Saved-card one-tap checkout (Phase 2): options for the sheet + the charge.
    getSessionPayOptions: build.query<SavedCardCheckoutOptions, string>({
      query: (sessionId) => ({ url: `/sessions/${sessionId}/pay/options` }),
    }),
    paySessionWithSavedCard: build.mutation<
      { status: 'paid' | 'pending'; sessionId: string; message: string },
      { sessionId: string; paymentMethodId: string }
    >({
      query: ({ sessionId, paymentMethodId }) => ({
        url: `/sessions/${sessionId}/pay`,
        method: 'POST',
        body: { paymentMethodId },
      }),
      invalidatesTags: (result) =>
        (result as any)?.status === 'paid'
          ? ['GetMentorDetail', 'MySessions', 'AvailableSlots', 'GetMe']
          : [],
    }),
  }),
});

export interface SavedCardOption {
  id: string;
  provider: string;
  cardBrand: string | null;
  last4: string;
  cardholder: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  isDefault: boolean;
  addedAt: string;
}

export interface SavedCardCheckoutOptions {
  sessionId: string;
  amountUzs: number;
  currency: string;
  slotHeldUntil: string | null;
  expired: boolean;
  alreadyPaid: boolean;
  cards: SavedCardOption[];
  defaultCardId: string | null;
}

export const {
  useGetMySessionsQuery,
  useBookSessionMutation,
  useBookBySlotMutation,
  useCancelSessionMutation,
  useReportSessionMutation,
  useSubmitSessionReportMutation,
  useRateSessionMutation,
  useBuySubscriptionMutation,
  useValidateAndPayMutation,
  useCancelSessionAsStudentMutation,
  useGetGiveawaySessionsQuery,
  useGetGiveawayStatusQuery,
  useBookGiveawaySessionMutation,
  useCancelGiveawaySessionMutation,
  useGetSessionPayOptionsQuery,
  useLazyGetSessionPayOptionsQuery,
  usePaySessionWithSavedCardMutation,
} = sessionsApi;
