import { CalendarLinkDto, UsersSchema } from 'src/app/api/Api';
import { RtkApi } from '../api';

export const authApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    // Get user data endpoint. Called from ~24 components — hold the result for
    // 15 minutes so navigation doesn't refetch the same payload on every mount.
    // Mutations that change the user (login, linkCalendar, telegram verify)
    // already invalidate the 'GetMe' tag so freshness isn't an issue.
    getMe: build.query<UsersSchema, void>({
      query: () => ({ url: '/users/me' }),
      providesTags: ['GetMe'],
      keepUnusedDataFor: 900,
    }),
    // Get user by ID (for counselors viewing student data)
    getUserById: build.query<UsersSchema, string>({
      query: (userId) => ({ url: `/users/user/${userId}` }),
      providesTags: (result, error, userId) => [{ type: 'Users', id: userId }],
      keepUnusedDataFor: 300,
    }),
    linkCalendar: build.mutation<void, CalendarLinkDto>({
      query: (body) => ({
        url: '/auth/google/calendar/link',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['GetMe'],
    }),
    invalidateGetMe: build.mutation<void, void>({
      queryFn: () => ({ data: undefined }),
      invalidatesTags: ['GetMe'],
    }),
    updateTelegramPhoneNumber: build.mutation<void, { phoneNumber: string }>({
      query: (body) => ({
        url: '/users/telegram-phone-number',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['GetMe'],
    }),
    verifyTelegramOTP: build.mutation<{ success: boolean; message: string }, { phoneNumber: string; otp: string }>({
      query: (body) => ({
        url: '/telegram/verify-otp',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['GetMe', 'TelegramStatus'],
    }),
    verifyTelegramCode: build.mutation<{ success: boolean; message: string }, { code: string }>({
      query: (body) => ({
        url: '/telegram/verify-code',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['GetMe', 'TelegramStatus'],
    }),
    unlinkTelegram: build.mutation<{ success: boolean; message: string }, void>({
      query: () => ({ url: '/telegram/unlink', method: 'POST' }),
      invalidatesTags: ['GetMe', 'TelegramStatus'],
    }),
    getTelegramStatus: build.query<{ status: 'pending' | 'connected' | 'failed' | null; phoneNumber?: string; attempts: number; lastAttempt?: string }, void>({
      query: () => ({ url: '/users/telegram-status' }),
      providesTags: ['TelegramStatus']
    }),
  }),
});

export const {
  useGetMeQuery,
  useGetUserByIdQuery,
  useLinkCalendarMutation,
  useInvalidateGetMeMutation,
  useUpdateTelegramPhoneNumberMutation,
  useVerifyTelegramOTPMutation,
  useVerifyTelegramCodeMutation,
  useUnlinkTelegramMutation,
  useGetTelegramStatusQuery,
} = authApi;
