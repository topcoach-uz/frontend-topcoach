import { RtkApi } from '../api';
import { ApiResponse, PaginatedResponse } from './types';

// ========================================
// PSYCHOMETRIC ASSESSMENT TYPES
// ========================================

export interface AssessmentQuestion {
  id: string;
  questionType: 'riasec' | 'big-five' | 'values' | 'aptitude' | 'work-style' | 'sjt';
  category: string;
  questionText: string;
  questionData: {
    type: 'likert' | 'multiple-choice' | 'forced-choice' | 'open-ended';
    options?: string[];
    scale?: { min: number; max: number; labels?: string[] };
    weight?: number;
    maxLength?: number; // for open-ended questions
    /**
     * V2: Forced-choice scoring metadata
     * Each option maps to a dimension for proper scoring
     */
    forcedChoiceMeta?: {
      optionDimensions: string[];
    };
  };
  order: number;
  translations?: {
    uz?: string;
    ru?: string;
  };
}

export interface StartAssessmentRequest {
  studentProfileId: string;
  language?: 'en' | 'uz' | 'ru';
  includeAptitude?: boolean;
}

export interface StartAssessmentResponse {
  sessionId: string;
  questions: AssessmentQuestion[];
  resumedFrom?: {
    answeredCount: number;
    totalCount: number;
  };
}

export interface SessionProgressResponse {
  answeredCount: number;
  totalCount: number;
  responses: Array<{ questionId: string; answer: any }>;
}

export interface ActiveSessionResponse {
  hasActiveSession: boolean;
  sessionId?: string;
  answeredCount?: number;
  totalCount?: number;
  includeAptitude?: boolean;
  lastUpdated?: string;
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

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: any;
}

export interface CompleteAssessmentRequest {
  sessionId: string;
  studentProfileId: string;
}

export interface PsychometricAssessment {
  id: string;
  studentProfileId: string;
  riasecScores: {
    realistic: number;
    investigative: number;
    artistic: number;
    social: number;
    enterprising: number;
    conventional: number;
  };
  riasecCode: string;
  bigFiveScores: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  valuesScores: {
    achievement: number;
    creativity: number;
    helpingOthers: number;
    independence: number;
    security: number;
    prestige: number;
    workLifeBalance: number;
    intellectualStimulation: number;
  };
  aptitudeScores?: {
    numerical?: number;
    verbal?: number;
    spatial?: number;
  };
  workStyleProfile: {
    preferredEnvironment: 'structured' | 'flexible' | 'mixed';
    collaborationStyle: 'independent' | 'team' | 'mixed';
    pacePreference: 'fast' | 'moderate' | 'deliberate';
    leadershipTendency: number;
    riskTolerance: number;
  };
  assessmentMetadata: {
    completionTime: number;
    questionCount: number;
    version: string;
    language: 'en' | 'uz' | 'ru';
    assessmentPath: 'core_only' | 'core_plus_aptitude';
    startedAt: string;
    completedAt: string;
  };
  academicConfidenceScore?: number;
  riskFlags: string[];
  rawResponses: Array<{
    questionId: string;
    questionType: string;
    response: any;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface MajorFitScore {
  majorName: string;
  fitBreakdown: {
    interestFit: number;
    valuesFit: number;
    aptitudeFit: number;
    workStyleFit: number;
    academicFit: number;
    activitiesFit: number;
    overallFit: number;
  };
  majorProfile: {
    id: string;
    majorName: string;
    riasecCode: string;
    idealRiasecScores: any;
    requiredAptitude: any;
    typicalValues: any;
    workStyleProfile: any;
    difficultyGroup: 'A' | 'B' | 'C';
    relatedCareers: string[];
    relatedMajors: string[];
    description?: string;
    tags: string[];
  };
}

export interface MajorExplanation {
  majorOverview?: string; // 2-3 sentences describing what the major is
  whyFits: string;
  keyContributors: string[];
  academicFeasibility: string;
  nextSteps: string[];
  confidence?: 'High' | 'Medium' | 'Low'; // Confidence in this recommendation
}

export interface MajorRecommendation {
  majorName: string;
  fitScore: number;
  fitBreakdown: {
    interestFit: number;
    valuesFit: number;
    aptitudeFit: number;
    workStyleFit: number;
    academicFit: number;
    activitiesFit: number;
    overallFit: number;
  };
  explanation: MajorExplanation;
  majorProfile: any;
}

export interface RecommendationsResponse {
  recommendations: MajorRecommendation[];
  shouldRecommendAptitude: boolean;
  confidenceScore?: number; // Overall confidence level (0-100)
  assessmentSummary: {
    riasecCode: string;
    topInterests: Array<{ dimension: string; score: number }>;
    topValues: Array<{ value: string; score: number }>;
  };
}

// ========================================
// PSYCHOMETRIC ASSESSMENT API
// ========================================

export const psychometricApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // Start assessment session
    startAssessment: builder.mutation<StartAssessmentResponse, StartAssessmentRequest>({
      query: (body) => ({
        url: '/psychometric-assessment/start',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PsychometricAssessment'],
    }),

    // Submit answer
    submitAnswer: builder.mutation<{ success: boolean }, SubmitAnswerRequest>({
      query: (body) => ({
        url: '/psychometric-assessment/answer',
        method: 'POST',
        body,
      }),
    }),

    // Complete assessment
    completeAssessment: builder.mutation<PsychometricAssessment, CompleteAssessmentRequest>({
      query: (body) => ({
        url: '/psychometric-assessment/complete',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PsychometricAssessment'],
    }),

    // Get latest assessment
    getLatestAssessment: builder.query<PsychometricAssessment, string>({
      query: (studentProfileId) => ({
        url: `/psychometric-assessment/latest/${studentProfileId}`,
        method: 'GET',
      }),
      providesTags: ['PsychometricAssessment'],
    }),

    // Get assessment by ID
    getAssessmentById: builder.query<PsychometricAssessment, string>({
      query: (assessmentId) => ({
        url: `/psychometric-assessment/assessment/${assessmentId}`,
        method: 'GET',
      }),
      providesTags: (result, error, assessmentId) => [{ type: 'PsychometricAssessment', id: assessmentId }],
    }),

    // Get all assessments
    getAllAssessments: builder.query<PsychometricAssessment[], string>({
      query: (studentProfileId) => ({
        url: `/psychometric-assessment/all/${studentProfileId}`,
        method: 'GET',
      }),
      providesTags: ['PsychometricAssessment'],
    }),

    // Calculate major fit scores
    calculateMajorFitScores: builder.query<MajorFitScore[], string>({
      query: (studentProfileId) => ({
        url: `/psychometric-assessment/major-fit-scores/${studentProfileId}`,
        method: 'GET',
      }),
      providesTags: ['PsychometricAssessment'],
    }),

    // Get personalized recommendations
    getRecommendations: builder.query<RecommendationsResponse, string>({
      query: (studentProfileId) => ({
        url: `/psychometric-assessment/recommendations/${studentProfileId}`,
        method: 'GET',
      }),
      providesTags: ['PsychometricAssessment'],
    }),

    // Get session progress
    getSessionProgress: builder.query<SessionProgressResponse, string>({
      query: (sessionId) => ({
        url: `/psychometric-assessment/session/${sessionId}/progress`,
        method: 'GET',
      }),
    }),

    // Check for active session
    checkActiveSession: builder.query<ActiveSessionResponse, string>({
      query: (studentProfileId) => ({
        url: `/psychometric-assessment/active-session/${studentProfileId}`,
        method: 'GET',
      }),
      providesTags: ['PsychometricAssessment'],
    }),

    getMajorMatchAccessStatus: builder.query<MajorMatchAccessStatus, string>({
      query: (studentProfileId) => ({
        url: `/psychometric-assessment/access-status/${studentProfileId}`,
        method: 'GET',
      }),
      providesTags: ['PsychometricAssessment'],
    }),

    // Cancel session
    cancelSession: builder.mutation<{ success: boolean }, { sessionId: string; studentProfileId: string }>({
      query: ({ sessionId, studentProfileId }) => ({
        url: `/psychometric-assessment/session/${sessionId}/cancel`,
        method: 'POST',
        body: { studentProfileId },
      }),
      invalidatesTags: ['PsychometricAssessment'],
    }),

    // Delete assessment
    deleteAssessment: builder.mutation<{ success: boolean; message: string }, string>({
      query: (assessmentId) => ({
        url: `/psychometric-assessment/assessment/${assessmentId}/delete`,
        method: 'POST',
      }),
      invalidatesTags: ['PsychometricAssessment'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useStartAssessmentMutation,
  useSubmitAnswerMutation,
  useCompleteAssessmentMutation,
  useGetLatestAssessmentQuery,
  useGetAssessmentByIdQuery,
  useGetAllAssessmentsQuery,
  useCalculateMajorFitScoresQuery,
  useGetRecommendationsQuery,
  useGetSessionProgressQuery,
  useCheckActiveSessionQuery,
  useGetMajorMatchAccessStatusQuery,
  useCancelSessionMutation,
  useDeleteAssessmentMutation,
} = psychometricApi;

