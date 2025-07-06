import { CalendarLinkDto, UsersSchema } from 'src/app/api/Api';
import { RtkApi } from '../api';

export const authApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    // Get user data endpoint
    getMe: build.query<UsersSchema, void>({
      query: () => ({ url: '/users/me' }),
      providesTags: ['GetMe'],
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
    updatePhoneNumber: build.mutation<void, { phoneNumber: string }>({
      query: (body) => ({
        url: '/users/phone-number',
        method: 'PUT',
        body,
      }),
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
    getTelegramStatus: build.query<{ status: 'pending' | 'connected' | 'failed' | null; phoneNumber?: string; attempts: number; lastAttempt?: string }, void>({
      query: () => ({ url: '/telegram/status' }),
      providesTags: ['TelegramStatus'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useLinkCalendarMutation,
  useInvalidateGetMeMutation,
  useUpdatePhoneNumberMutation,
  useUpdateTelegramPhoneNumberMutation,
  useGetTelegramStatusQuery,
} = authApi;
