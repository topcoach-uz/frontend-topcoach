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
          profileImage: mentor.profile?.media?.[0]?.url || null,
          displayUniversity: mentor?.selectedUniversities?.[0]?.name ?? mentor?.mentorProfile?.university,
        }));
      },
      // Enable background refetching for fresh data
      pollingInterval: 0, // Disable polling, we'll use manual refetch
    }),
    getMentorDetail: build.query<UserDetailsResponseDto, { mentorId: string }>({
      query: ({ mentorId }) => ({
        url: `/users/user/${mentorId}`,
        params: { id: mentorId },
      }),
      providesTags: ['GetMentorDetail'],
    }),
    getMentorBalance: build.query<IBalance, { mentorId: string }>({
      query: ({ mentorId }) => ({
        url: `/users/balance/${mentorId}`,
        params: { mentorId },
      }), // This is not correct, but I don't have the correct endpoint
      providesTags: ['GetMentorBalance'],
    }),
    getPlans: build.query<PaymentPlansSchema[], void>({
      query: () => ({
        url: `/payments/plans`,
      }),
    }),
    getPlansWithParams: build.query<
      PaymentPlansSchema[],
      { currency?: string }
    >({
      query: ({ currency }) => ({
        url: `/payments/plans`,
        params: { currency },
      }),
    }),
  }),
});

export const {
  useGetMentorsQuery,
  useGetMentorDetailQuery,
  useGetMentorBalanceQuery,
  useGetPlansQuery,
  useGetPlansWithParamsQuery,
} = mentorApi;
