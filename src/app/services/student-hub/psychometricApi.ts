import { RtkApi } from '../api';
import { ApiResponse, PaginatedResponse } from './types';

// ========================================
// PSYCHOMETRIC ASSESSMENT TYPES
// ========================================

export interface AssessmentQuestion {
  id: string;
  questionType: 'riasec' | 'big-five' | 'values' | 'aptitude' | 'work-style';
  category: string;
  questionText: string;
  questionData: {
    type: 'likert' | 'multiple-choice' | 'forced-choice' | 'open-ended';
    options?: string[];
    scale?: { min: number; max: number; labels?: string[] };
    weight?: number;
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
  whyFits: string;
  keyContributors: string[];
  academicFeasibility: string;
  nextSteps: string[];
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
  }),
  overrideExisting: false,
});

export const {
  useStartAssessmentMutation,
  useSubmitAnswerMutation,
  useCompleteAssessmentMutation,
  useGetLatestAssessmentQuery,
  useGetAllAssessmentsQuery,
  useCalculateMajorFitScoresQuery,
  useGetRecommendationsQuery,
} = psychometricApi;

