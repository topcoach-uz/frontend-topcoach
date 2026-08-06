import { RtkApi } from '../api';

/**
 * Major Match v2 RTK slice (MAJOR_MATCH_V2_PLAN.md Stage 4).
 *
 * Deliberately does NOT reuse or join the legacy `psychometricApi`'s bare
 * `'PsychometricAssessment'` tag — that single shared tag across 8 queries +
 * 4 mutations is the documented cause of the app-wide runaway-refetch storm
 * (see ProfilePage.tsx's 4s workaround cap). This slice uses two properly
 * SCOPED tag types instead ('MajorMatchV2Status' / 'MajorMatchV2Result'),
 * each keyed by studentProfileId / result id, so a submit for one student
 * can never invalidate another student's cached data, and reading one past
 * result never invalidates every other query on the page.
 *
 * Only `submitMajorMatch` invalidates anything, and it invalidates only the
 * STATUS query for that one studentProfileId (the plan's "only the status
 * query broadly invalidated" — broadly meaning "the whole status object for
 * this student", not "every Major Match query app-wide").
 */

export interface McAnswerItem {
  questionId: number;
  optionIndex: number;
}

export interface ShortAnswerItem {
  questionId: number;
  text: string;
}

export type MajorMatchLanguage = 'en' | 'ru' | 'uz' | 'kk';

export interface SubmitMajorMatchRequest {
  studentProfileId: string;
  mcAnswers: McAnswerItem[];
  shortAnswers?: ShortAnswerItem[];
  language?: MajorMatchLanguage;
  metadata?: Record<string, unknown>;
}

export type MajorMatchDimensionKey =
  | 'analytical'
  | 'creative'
  | 'social'
  | 'investigative'
  | 'practical'
  | 'commercial';

export type MajorMatchType = 'exact' | 'fallback';

export interface MajorMatchTieBreak {
  applied: boolean;
  margin: number;
  careerVisionScores: { dimensionIndex: number; score: number }[] | null;
  resolvedBy: 'no-tie' | 'career-vision' | 'priority-order';
}

export interface MajorMatchResult {
  id: string;
  studentProfileId: string;
  engineVersion: string;
  catalogVersion: string;
  dimensionScores: Record<MajorMatchDimensionKey, number>;
  totalPoints: number;
  topDimensions: [number, number];
  tieBreak: MajorMatchTieBreak | null;
  matchType: MajorMatchType;
  primaryMajorSlug: string;
  altMajorSlugs: [string, string, string];
  mcAnswers: McAnswerItem[];
  shortAnswers: ShortAnswerItem[];
  language: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MajorMatchAccessStatus {
  canStart: boolean;
  requiresCommunityEnrollment: boolean;
  isCommunityEnrolled: boolean;
  freeSuccessfulAttemptsLimit: number;
  successfulAttemptsUsed: number;
  freeAttemptsRemaining: number;
  promptTitle: string;
  promptMessage: string;
}

export interface MajorMatchStatusResponse {
  hasCompletedV2: boolean;
  hasCompletedLegacy: boolean;
  latest: MajorMatchResult | null;
  access: MajorMatchAccessStatus;
}

export const majorMatchApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    submitMajorMatch: builder.mutation<MajorMatchResult, SubmitMajorMatchRequest>({
      query: (body) => ({
        url: '/major-match/submit',
        method: 'POST',
        body,
      }),
      // Scoped to this one student's status — never a bare/app-wide tag.
      invalidatesTags: (_result, _error, arg) => [
        { type: 'MajorMatchV2Status', id: arg.studentProfileId },
      ],
    }),

    getMajorMatchStatus: builder.query<MajorMatchStatusResponse, string>({
      query: (studentProfileId) => `/major-match/status/${studentProfileId}`,
      providesTags: (_result, _error, studentProfileId) => [
        { type: 'MajorMatchV2Status', id: studentProfileId },
      ],
    }),

    getMajorMatchResult: builder.query<MajorMatchResult, string>({
      query: (id) => `/major-match/result/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'MajorMatchV2Result', id }],
    }),

    getAllMajorMatchResults: builder.query<MajorMatchResult[], string>({
      query: (studentProfileId) => `/major-match/all/${studentProfileId}`,
      providesTags: (_result, _error, studentProfileId) => [
        { type: 'MajorMatchV2Result', id: `LIST-${studentProfileId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useSubmitMajorMatchMutation,
  useGetMajorMatchStatusQuery,
  useGetMajorMatchResultQuery,
  useGetAllMajorMatchResultsQuery,
} = majorMatchApi;
