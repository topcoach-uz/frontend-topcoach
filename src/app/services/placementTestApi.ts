import { RtkApi } from './api';

// ── DTO mirrors of the backend (`src/modules/placement-test/...`) ──────────────

export type PlacementCategory = 'reading' | 'grammar' | 'vocabulary';
export type PlacementLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type PlacementAttemptSource = 'ai' | 'fallback';

export type PlacementPublicQuestion = {
  id: string;
  category: PlacementCategory;
  text: string;
  options: string[];
};

export type StartedPlacementAttempt = {
  attemptId: string;
  questions: PlacementPublicQuestion[];
  timeLimitSeconds: number;
  startedAt: string;
  expiresAt: string;
  source: PlacementAttemptSource;
};

export type SubmittedAnswer = {
  questionId: string;
  selectedIndex: number | null;
};

export type SubmitPlacementAttemptDto = {
  answers: SubmittedAnswer[];
  timeTakenSeconds: number;
};

export type PlacementAttemptQuestionSnapshot = {
  questionId: string;
  category: PlacementCategory;
  text: string;
  options: string[];
  correctIndex: number;
};

export type PlacementAttemptAnswer = {
  questionId: string;
  selectedIndex: number | null;
  isCorrect: boolean;
};

export type PlacementAttemptCategoryScores = {
  reading: string;
  grammar: string;
  vocabulary: string;
};

export type PlacementAttemptDto = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  questionsSnapshot: PlacementAttemptQuestionSnapshot[];
  answers: PlacementAttemptAnswer[];
  scorePercentage: number;
  passed: boolean;
  level: PlacementLevel;
  categoryScores: PlacementAttemptCategoryScores;
  timeTakenSeconds: number;
  source: PlacementAttemptSource;
  submittedAt?: string | null;
};

export type ProfileStep = 'basic' | 'academic' | 'goals' | 'needs';

export type PlacementTestStatus = {
  passed: boolean;
  passedAt: string | null;
  lastAttempt: {
    id: string;
    scorePercentage: number;
    passed: boolean;
    level: PlacementLevel;
    createdAt: string;
  } | null;
  profile: {
    exists: boolean;
    completed: boolean;
    lastEditedStep: ProfileStep | null;
  };
};

export const placementTestApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlacementTestStatus: builder.query<PlacementTestStatus, void>({
      query: () => 'placement-test/status',
      providesTags: ['PlacementTest'],
    }),
    startPlacementAttempt: builder.mutation<StartedPlacementAttempt, void>({
      query: () => ({
        url: 'placement-test/attempts',
        method: 'POST',
      }),
      // Don't invalidate status here — start doesn't change status until submit lands.
    }),
    submitPlacementAttempt: builder.mutation<
      PlacementAttemptDto,
      { attemptId: string; body: SubmitPlacementAttemptDto }
    >({
      query: ({ attemptId, body }) => ({
        url: `placement-test/attempts/${attemptId}/submit`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PlacementTest'],
    }),
    getPlacementAttempt: builder.query<PlacementAttemptDto, string>({
      query: (attemptId) => `placement-test/attempts/${attemptId}`,
      providesTags: (_, __, attemptId) => [
        { type: 'PlacementTest', id: attemptId },
      ],
    }),
  }),
});

export const {
  useGetPlacementTestStatusQuery,
  useStartPlacementAttemptMutation,
  useSubmitPlacementAttemptMutation,
  useGetPlacementAttemptQuery,
} = placementTestApi;
