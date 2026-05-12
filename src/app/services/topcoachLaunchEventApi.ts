import { RtkApi } from './api';

export type TopcoachLaunchEventStatus = 'confirmed' | 'cancelled';

/** Closed-list option ids used by the registration form. */
export type LaunchEventFieldId =
  | 'business_economics'
  | 'computer_science_it'
  | 'medicine_healthcare'
  | 'engineering'
  | 'law'
  | 'design_architecture'
  | 'psychology'
  | 'finance_banking'
  | 'natural_sciences'
  | 'other';

export type LaunchEventCountryId =
  | 'usa'
  | 'uk'
  | 'germany'
  | 'canada'
  | 'australia'
  | 'netherlands'
  | 'singapore'
  | 'south_korea'
  | 'japan'
  | 'other';

export type LaunchEventGradeId =
  | '8th_grade'
  | '9th_grade'
  | '10th_grade'
  | '11th_grade'
  | '12th_grade'
  | 'gap_year'
  | 'undergrad'
  | 'graduate'
  | 'other';

export type LaunchEventEnglishLevel =
  | 'beginner'
  | 'intermediate'
  | 'upper_intermediate'
  | 'advanced';

export type LaunchEventReferralSource =
  | 'instagram'
  | 'telegram'
  | 'friend'
  | 'school'
  | 'other';

export type LaunchEventAttendance = 'yes' | 'maybe_next_time';

export type SubmitTopcoachLaunchEventDto = {
  fullName: string;
  phone: string;
  telegramUsername: string;
  email: string;
  grade: LaunchEventGradeId;
  englishLevel: LaunchEventEnglishLevel;
  fields: LaunchEventFieldId[];
  countries: LaunchEventCountryId[];
  referralSource: LaunchEventReferralSource;
  attendance: LaunchEventAttendance;
  expectations?: string;
  admissionsQuestion?: string;
};

export type TopcoachLaunchEventRegistrationDto = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  userId: string;
  status: TopcoachLaunchEventStatus;
  draft: SubmitTopcoachLaunchEventDto;
  submittedAt: string;
  cancelledAt?: string | null;
  /** Only populated on admin endpoints (left join). */
  user?: {
    id: string;
    email: string;
  };
};

export type TopcoachLaunchEventAdminStats = {
  total: number;
  confirmed: number;
  cancelled: number;
  last24h: number;
};

export const topcoachLaunchEventApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getTopcoachLaunchEventMe: builder.query<
      { registration: TopcoachLaunchEventRegistrationDto | null },
      void
    >({
      query: () => 'topcoach-launch-event/registrations/me',
      providesTags: ['TopcoachLaunchEvent'],
    }),
    submitTopcoachLaunchEvent: builder.mutation<
      { registration: TopcoachLaunchEventRegistrationDto },
      SubmitTopcoachLaunchEventDto
    >({
      query: (body) => ({
        url: 'topcoach-launch-event/registrations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TopcoachLaunchEvent'],
    }),
    cancelTopcoachLaunchEvent: builder.mutation<
      { registration: TopcoachLaunchEventRegistrationDto },
      void
    >({
      query: () => ({
        url: 'topcoach-launch-event/registrations/me/cancel',
        method: 'POST',
      }),
      invalidatesTags: ['TopcoachLaunchEvent'],
    }),

    // ── Admin (SuperAdmin / Owner only) ──────────────────────────────
    getTopcoachLaunchEventAdminList: builder.query<
      { registrations: TopcoachLaunchEventRegistrationDto[] },
      {
        status?: TopcoachLaunchEventStatus | 'all';
        from?: string;
        to?: string;
        q?: string;
      }
    >({
      query: (params) => ({
        url: 'topcoach-launch-event/admin/registrations',
        params: {
          status: params.status,
          from: params.from,
          to: params.to,
          q: params.q,
        },
      }),
      providesTags: ['TopcoachLaunchEvent'],
    }),
    getTopcoachLaunchEventAdminStats: builder.query<
      TopcoachLaunchEventAdminStats,
      void
    >({
      query: () => 'topcoach-launch-event/admin/stats',
      providesTags: ['TopcoachLaunchEvent'],
    }),
  }),
});

export const {
  useGetTopcoachLaunchEventMeQuery,
  useSubmitTopcoachLaunchEventMutation,
  useCancelTopcoachLaunchEventMutation,
  useGetTopcoachLaunchEventAdminListQuery,
  useGetTopcoachLaunchEventAdminStatsQuery,
} = topcoachLaunchEventApi;
