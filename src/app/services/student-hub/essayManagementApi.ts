import { RtkApi } from '../api';
import {
  StudentEssay,
  CreateStudentEssayRequest,
  UpdateStudentEssayRequest,
  AiConsultationSession,
  CreateAiConsultationSessionRequest,
  UpdateAiConsultationSessionRequest,
  PaginatedResponse,
  ApiResponse,
} from './types';

export interface EssayIdeaAngle {
  id: string;
  title: string;
  why: string;
  sources: Array<{ kind: 'major_match' | 'profile' | 'college_list' | 'prompt' | 'document'; label: string }>;
  questions: string[];
}

export interface EssayIdeasResponse {
  angles: EssayIdeaAngle[];
  generatedAt: string;
  cached: boolean;
  remainingToday: number;
  documents?: EssayIdeasDocument[];
}

export interface EssayIdeasDocument {
  id: string;
  name: string;
  used: boolean;
  reason?: string;
}

export const essayManagementApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================
    // ✍️ STUDENT ESSAYS
    // ========================================

    // Get student essays
    getStudentEssays: builder.query<
      PaginatedResponse<StudentEssay>,
      { page?: number; limit?: number; type?: string; status?: string }
    >({
      query: ({ page = 1, limit = 10, type, status }) => ({
        url: '/essay-management/essays',
        method: 'GET',
        params: { page, limit, type, status },
      }),
      providesTags: ['StudentEssays'],
    }),

    // Get student essay by ID
    getStudentEssay: builder.query<ApiResponse<StudentEssay>, string>({
      query: (id) => ({
        url: `/essay-management/essays/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any): ApiResponse<StudentEssay> => {
        // Handle both wrapped and direct response formats
        if (response?.data !== undefined && response?.success !== undefined) {
          return response;
        }
        return { data: response, success: true };
      },
      providesTags: (result, error, id) => [{ type: 'StudentEssays', id }],
    }),

    // Create student essay
    createStudentEssay: builder.mutation<
      ApiResponse<StudentEssay>,
      CreateStudentEssayRequest
    >({
      query: (data) => ({
        url: '/essay-management/essays',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: any): ApiResponse<StudentEssay> => {
        // Handle both wrapped and direct response formats
        if (response?.data !== undefined && response?.success !== undefined) {
          return response;
        }
        return { data: response, success: true };
      },
      invalidatesTags: ['StudentEssays'],
    }),

    // Upload essay file
    uploadEssay: builder.mutation<
      ApiResponse<StudentEssay>,
      FormData
    >({
      query: (formData) => ({
        url: '/essay-management/essays/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['StudentEssays'],
    }),

    // Update student essay
    updateStudentEssay: builder.mutation<
      ApiResponse<StudentEssay>,
      { id: string; data: UpdateStudentEssayRequest }
    >({
      query: ({ id, data }) => ({
        url: `/essay-management/essays/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'StudentEssays', id },
        'StudentEssays',
      ],
    }),

    // Delete student essay
    deleteStudentEssay: builder.mutation<void, string>({
      query: (id) => ({
        url: `/essay-management/essays/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StudentEssays'],
    }),

    // Analyze essay with AI
    analyzeEssay: builder.mutation<
      ApiResponse<{
        analysis: {
          readability: number;
          wordCount: number;
          characterCount: number;
          suggestions: string[];
          strengths: string[];
          improvements: string[];
        };
        feedback: string;
      }>,
      { id: string; content?: string }
    >({
      query: ({ id, content }) => ({
        url: `/essay-management/essays/${id}/analyze`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'StudentEssays', id },
        'StudentEssays',
      ],
    }),

    // ========== NEW AI-POWERED ENDPOINTS ==========

    // Generate AI brainstorming
    generateBrainstorming: builder.mutation<
      ApiResponse<StudentEssay['aiBrainstorming']>,
      { topic: string; essayType: string; prompt?: string }
    >({
      query: (data) => ({
        url: '/essay-management/essays/brainstorm',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: any): ApiResponse<StudentEssay['aiBrainstorming']> => {
        // Handle both wrapped and direct response formats
        if (response?.data !== undefined && response?.success !== undefined) {
          return response;
        }
        return { data: response, success: true };
      },
    }),

    // Generate essay outline
    generateOutline: builder.mutation<
      ApiResponse<StudentEssay['outline']>,
      { topic: string; essayType: string; selectedIdea?: any }
    >({
      query: (data) => ({
        url: '/essay-management/essays/outline',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: any): ApiResponse<StudentEssay['outline']> => {
        // Handle both wrapped and direct response formats
        if (response?.data !== undefined && response?.success !== undefined) {
          return response;
        }
        return { data: response, success: true };
      },
    }),

    // Get enhanced AI feedback
    getEnhancedFeedback: builder.query<
      ApiResponse<StudentEssay['aiFeedback']>,
      string
    >({
      query: (id) => ({
        url: `/essay-management/essays/${id}/feedback`,
        method: 'GET',
      }),
      transformResponse: (response: any): ApiResponse<StudentEssay['aiFeedback']> => {
        // Handle both wrapped and direct response formats
        if (response?.data !== undefined && response?.success !== undefined) {
          return response;
        }
        return { data: response, success: true };
      },
      providesTags: (result, error, id) => [
        { type: 'StudentEssays', id },
        'StudentEssays',
      ],
    }),

    // Auto-save essay
    autoSaveEssay: builder.mutation<
      ApiResponse<{ message: string }>,
      { id: string; content: string }
    >({
      query: ({ id, content }) => ({
        url: `/essay-management/essays/${id}/autosave`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'StudentEssays', id },
      ],
    }),

    // Get essay versions
    getEssayVersions: builder.query<
      ApiResponse<Array<{
        id: string;
        content: string;
        version: number;
        createdAt: string;
        changeSummary?: string;
      }>>,
      string
    >({
      query: (essayId) => ({
        url: `/essay-management/essays/${essayId}/versions`,
        method: 'GET',
      }),
      transformResponse: (response: any) =>
        response?.data !== undefined && response?.success !== undefined
          ? response
          : { data: response, success: true },
      providesTags: (result, error, essayId) => [
        { type: 'StudentEssays', id: essayId },
      ],
    }),

    // Create essay version
    createEssayVersion: builder.mutation<
      ApiResponse<{ id: string; version: number }>,
      { essayId: string; content: string; changeSummary?: string }
    >({
      query: ({ essayId, content, changeSummary }) => ({
        url: `/essay-management/essays/${essayId}/versions`,
        method: 'POST',
        body: { content, changeSummary },
      }),
      transformResponse: (response: any) =>
        response?.data !== undefined && response?.success !== undefined
          ? response
          : { data: response, success: true },
      invalidatesTags: (result, error, { essayId }) => [
        { type: 'StudentEssays', id: essayId },
      ],
    }),

    // ========================================
    // 📝 ESSAY TEMPLATES
    // ========================================

    // Get essay templates
    getEssayTemplates: builder.query<
      PaginatedResponse<{
        id: string;
        name: string;
        type: string;
        description: string;
        structure: string;
        tips: string[];
        examples: string[];
        wordCount: number;
        difficulty: string;
        isActive: boolean;
        usageCount: number;
        averageRating: number;
        createdAt: string;
      }>,
      { page?: number; limit?: number; type?: string; difficulty?: string }
    >({
      query: ({ page = 1, limit = 10, type, difficulty }) => ({
        url: '/essay-management/templates',
        method: 'GET',
        params: { page, limit, type, difficulty },
      }),
      providesTags: ['EssayTemplates'],
    }),

    // Get essay template by ID
    getEssayTemplate: builder.query<ApiResponse<any>, string>({
      query: (id) => ({
        url: `/essay-management/templates/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'EssayTemplates', id }],
    }),

    // Use essay template
    useEssayTemplate: builder.mutation<
      ApiResponse<StudentEssay>,
      { templateId: string; title: string; prompt: string }
    >({
      query: ({ templateId, title, prompt }) => ({
        url: `/essay-management/templates/${templateId}/use`,
        method: 'POST',
        body: { title, prompt },
      }),
      invalidatesTags: ['StudentEssays'],
    }),

    // ========================================
    // 🤖 AI CONSULTATION SESSIONS
    // ========================================

    // Get AI consultation sessions
    getAiConsultationSessions: builder.query<
      PaginatedResponse<AiConsultationSession>,
      { page?: number; limit?: number; type?: string }
    >({
      query: ({ page = 1, limit = 10, type }) => ({
        url: '/essay-management/ai-sessions',
        method: 'GET',
        params: { page, limit, type },
      }),
      providesTags: ['AiConsultationSessions'],
    }),

    // Get AI consultation session by ID
    getAiConsultationSession: builder.query<ApiResponse<AiConsultationSession>, string>({
      query: (id) => ({
        url: `/essay-management/ai-sessions/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'AiConsultationSessions', id }],
    }),

    // Create AI consultation session
    createAiConsultationSession: builder.mutation<
      ApiResponse<AiConsultationSession>,
      CreateAiConsultationSessionRequest
    >({
      query: (data) => ({
        url: '/essay-management/ai-sessions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AiConsultationSessions'],
    }),

    // Update AI consultation session
    updateAiConsultationSession: builder.mutation<
      ApiResponse<AiConsultationSession>,
      { id: string; data: UpdateAiConsultationSessionRequest }
    >({
      query: ({ id, data }) => ({
        url: `/essay-management/ai-sessions/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AiConsultationSessions', id },
        'AiConsultationSessions',
      ],
    }),

    // ========================================
    // 💬 ESSAY FEEDBACK
    // ========================================

    // Get essay feedback
    getEssayFeedback: builder.query<
      PaginatedResponse<{
        id: string;
        essayId: string;
        feedbackType: 'ai' | 'mentor' | 'peer' | 'self';
        content: string;
        rating?: number;
        suggestions: string[];
        createdAt: string;
        createdBy: string;
      }>,
      { essayId: string; page?: number; limit?: number }
    >({
      query: ({ essayId, page = 1, limit = 10 }) => ({
        url: `/essay-management/essays/${essayId}/feedback`,
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: (result, error, { essayId }) => [
        { type: 'EssayFeedback', id: essayId },
      ],
    }),

    // Create essay feedback
    createEssayFeedback: builder.mutation<
      ApiResponse<{ id: string }>,
      {
        essayId: string;
        feedbackType: 'ai' | 'mentor' | 'peer' | 'self';
        content: string;
        rating?: number;
        suggestions?: string[];
      }
    >({
      query: ({ essayId, ...data }) => ({
        url: `/essay-management/essays/${essayId}/feedback`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { essayId }) => [
        { type: 'EssayFeedback', id: essayId },
        { type: 'StudentEssays', id: essayId },
      ],
    }),

    // AI story angles for the Ideas panel
    getEssayIdeas: builder.mutation<
      EssayIdeasResponse,
      { essayId: string; refresh?: boolean; documentIds?: string[] }
    >({
      query: ({ essayId, refresh, documentIds }) => ({
        url: `/essay-management/essays/${essayId}/ideas`,
        method: 'POST',
        body: {
          refresh: Boolean(refresh),
          ...(documentIds && documentIds.length > 0 ? { documentIds } : {}),
        },
      }),
    }),

    // ========================================
    // 📊 ESSAY ANALYTICS
    // ========================================

    // Get essay analytics
    getEssayAnalytics: builder.query<
      ApiResponse<{
        totalEssays: number;
        inProgressEssays: number;
        completedEssays: number;
        submittedEssays: number;
        totalWordCount: number;
        averageWordCount: number;
        essaysByType: Record<string, number>;
        essaysByStatus: Record<string, number>;
        recentActivity: Array<{
          id: string;
          title: string;
          type: string;
          timestamp: string;
          status: string;
        }>;
      }>,
      void
    >({
      query: () => ({
        url: '/essay-management/analytics',
        method: 'GET',
      }),
      providesTags: ['StudentEssays'],
    }),
  }),
});

export const {
  // Student Essays
  useGetStudentEssaysQuery,
  useGetStudentEssayQuery,
  useCreateStudentEssayMutation,
  useUpdateStudentEssayMutation,
  useDeleteStudentEssayMutation,
  useAnalyzeEssayMutation,
  useGetEssayVersionsQuery,
  useCreateEssayVersionMutation,

  // Essay Templates
  useGetEssayTemplatesQuery,
  useGetEssayTemplateQuery,
  useUseEssayTemplateMutation,

  // AI Consultation Sessions
  useGetAiConsultationSessionsQuery,
  useGetAiConsultationSessionQuery,
  useCreateAiConsultationSessionMutation,
  useUpdateAiConsultationSessionMutation,

  // Essay Feedback
  useGetEssayFeedbackQuery,
  useCreateEssayFeedbackMutation,

  // Essay Analytics
  useGetEssayAnalyticsQuery,

  // NEW AI-POWERED FEATURES
  useGenerateBrainstormingMutation,
  useGenerateOutlineMutation,
  useGetEnhancedFeedbackQuery,
  useAutoSaveEssayMutation,
  useGetEssayIdeasMutation,
} = essayManagementApi;
