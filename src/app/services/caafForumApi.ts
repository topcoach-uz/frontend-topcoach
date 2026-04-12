import { RtkApi } from './api';
import type { CaafDraft } from 'src/pages/events/central-asian-admissions-forum/types';

export type CaafForumApplicationStatus =
  | 'pending_payment'
  | 'paid'
  | 'refunded'
  | 'cancelled';

export type CaafForumApplicationDto = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  userId: string;
  status: CaafForumApplicationStatus;
  draft: CaafDraft;
  submittedAt: string;
  paidAt?: string | null;
  lastPaymentProvider?: string | null;
};

export type CaafForumRegistrationConfigDto = {
  registrationFeeUsd: number;
};

export const caafForumApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getCaafForumRegistrationConfig: builder.query<CaafForumRegistrationConfigDto, void>({
      query: () => 'caaf-forum/registration-config',
    }),
    getCaafForumApplicationsMe: builder.query<{ application: CaafForumApplicationDto | null }, void>({
      query: () => 'caaf-forum/applications/me',
      providesTags: ['CaafForum'],
    }),
    submitCaafForumApplication: builder.mutation<
      { application: CaafForumApplicationDto },
      CaafDraft
    >({
      query: (body) => ({
        url: 'caaf-forum/applications',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CaafForum', 'CaafForumAdmin'],
    }),
    getCaafForumAdminApplications: builder.query<
      { applications: CaafForumApplicationDto[] },
      { status?: CaafForumApplicationStatus | 'all'; from?: string; to?: string; q?: string }
    >({
      query: (params) => ({
        url: 'caaf-forum/admin/applications',
        params: {
          status: params.status,
          from: params.from,
          to: params.to,
          q: params.q,
        },
      }),
      providesTags: ['CaafForumAdmin'],
    }),
  }),
});

export const {
  useGetCaafForumRegistrationConfigQuery,
  useGetCaafForumApplicationsMeQuery,
  useLazyGetCaafForumApplicationsMeQuery,
  useSubmitCaafForumApplicationMutation,
  useGetCaafForumAdminApplicationsQuery,
} = caafForumApi;
