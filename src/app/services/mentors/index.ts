import { PaymentPlansSchema, UserDetailsResponseDto, MentorsResponseDto } from 'src/app/api/Api';
import { RtkApi } from '../api';
import { IBalance } from 'src/app/slices/mentorSlice';

export const mentorApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    getMentors: build.query<MentorsResponseDto[], void>({
      query: () => ({
        url: `/users/mentors`,
        // Add cache headers for better performance
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes
        },
      }),
      providesTags: ['GetMentors'],
      // Keep data in cache for 15 minutes for faster subsequent loads
      keepUnusedDataFor: 900,
      // Transform response to optimize data structure
      transformResponse: (response: MentorsResponseDto[]) => {
        // Pre-process mentor data to reduce client-side computation
        return response.map(mentor => ({
          ...mentor,
          // Pre-calculate commonly used values
          displayUniversity: mentor?.mentorProfile?.university,
        }));
      },
    }),
    getMentorDetail: build.query<UserDetailsResponseDto, { mentorId: string }>({
      query: ({ mentorId }) => ({
        url: `/users/user/${mentorId}`,
        params: { id: mentorId },
      }),
      providesTags: ['GetMentorDetail'],
      // Mentor detail doesn't change often — hold it for 5 minutes so navigation
      // back/forward between list and detail is instant.
      keepUnusedDataFor: 300,
    }),
    getMentorBalance: build.query<IBalance, { mentorId: string }>({
      query: ({ mentorId }) => ({
        url: `/users/balance/${mentorId}`,
        params: { mentorId },
      }),
      providesTags: ['GetMentorBalance'],
    }),
    getPlans: build.query<PaymentPlansSchema[], void>({
      query: () => ({
        url: `/payments/plans`,
      }),
      // Plans rarely change — keep in cache for an hour app-wide.
      keepUnusedDataFor: 3600,
    }),
    getPlansWithParams: build.query<
      PaymentPlansSchema[],
      { currency?: string }
    >({
      query: ({ currency }) => ({
        url: `/payments/plans`,
        params: { currency },
      }),
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const {
  useGetMentorsQuery,
  useLazyGetMentorsQuery,
  useGetMentorDetailQuery,
  useLazyGetMentorDetailQuery,
  useGetMentorBalanceQuery,
  useGetPlansQuery,
  useGetPlansWithParamsQuery,
} = mentorApi;
