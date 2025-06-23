import { PaymentPlansSchema, UserDetailsResponseDto } from 'src/app/api/Api';
import { RtkApi } from '../api';
import { IBalance } from 'src/app/slices/mentorSlice';

export const mentorApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
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
  useGetMentorDetailQuery,
  useGetMentorBalanceQuery,
  useGetPlansQuery,
  useGetPlansWithParamsQuery,
} = mentorApi;
