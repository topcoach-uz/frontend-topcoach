import { RtkApi } from '../api';

export type EligibleEssayMentor = {
  id: string;
  name: string;
  source: 'full_support' | 'one_to_one' | 'academic';
};

export type EssayReviewRequest = {
  id: string;
  essayId: string;
  studentUserId: string;
  mentorUserId: string;
  mentorName?: string;
  studentName?: string;
  status: 'pending' | 'in_review' | 'feedback_ready' | 'withdrawn';
  relationshipSource: 'full_support' | 'one_to_one' | 'academic';
  snapshotTitle: string;
  snapshotPrompt: string;
  snapshotContent: string;
  snapshotWordCount: number;
  snapshotVersion: number;
  studentNote?: string | null;
  feedback?: string | null;
  createdAt: string;
  feedbackAt?: string | null;
  /** Mentor inbox only: the application this essay is for. */
  universityName?: string | null;
  major?: string | null;
};

export const essayReviewApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getEligibleEssayMentors: builder.query<EligibleEssayMentor[], void>({
      query: () => '/essay-management/reviews/eligibility',
      providesTags: ['EssayReviews'],
    }),
    getStudentEssayReviews: builder.query<EssayReviewRequest[], string>({
      query: (essayId) => `/essay-management/reviews/essays/${essayId}/requests`,
      providesTags: ['EssayReviews'],
    }),
    submitEssayReview: builder.mutation<EssayReviewRequest, { essayId: string; mentorUserId: string; note?: string }>({
      query: ({ essayId, mentorUserId, note }) => ({
        url: `/essay-management/reviews/essays/${essayId}/requests`,
        method: 'POST',
        body: { mentorUserId, note },
      }),
      invalidatesTags: (result, error, { essayId }) => ['EssayReviews', { type: 'StudentEssays', id: essayId }],
    }),
    withdrawEssayReview: builder.mutation<EssayReviewRequest, string>({
      query: (requestId) => ({
        url: `/essay-management/reviews/requests/${requestId}/withdraw`,
        method: 'POST',
      }),
      invalidatesTags: ['EssayReviews'],
    }),
    getMentorEssayReviews: builder.query<EssayReviewRequest[], void>({
      query: () => '/essay-management/reviews/mentor/requests',
      providesTags: ['EssayReviews'],
    }),
    startMentorEssayReview: builder.mutation<EssayReviewRequest, string>({
      query: (requestId) => ({
        url: `/essay-management/reviews/mentor/requests/${requestId}/start`,
        method: 'PATCH',
      }),
      invalidatesTags: ['EssayReviews'],
    }),
    sendMentorEssayFeedback: builder.mutation<EssayReviewRequest, { requestId: string; feedback: string }>({
      query: ({ requestId, feedback }) => ({
        url: `/essay-management/reviews/mentor/requests/${requestId}/feedback`,
        method: 'POST',
        body: { feedback },
      }),
      invalidatesTags: ['EssayReviews'],
    }),
  }),
});

export const {
  useGetEligibleEssayMentorsQuery,
  useGetStudentEssayReviewsQuery,
  useSubmitEssayReviewMutation,
  useWithdrawEssayReviewMutation,
  useGetMentorEssayReviewsQuery,
  useStartMentorEssayReviewMutation,
  useSendMentorEssayFeedbackMutation,
} = essayReviewApi;
