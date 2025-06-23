import {
    AiAssessmentQuestion,
    AiAssessmentResult,
    AiAssessmentSession,
    SubmitAssessmentDto,
  } from 'src/app/api/types';
  import { RtkApi } from '.';
  
  export const aiAssessmentApi = RtkApi.injectEndpoints({
    endpoints: (builder) => ({
      getAiAssessmentQuestions: builder.query<AiAssessmentQuestion[], void>({
        query: () => 'ai-assessment/questions',
      }),
      startAiAssessment: builder.mutation<AiAssessmentSession, void>({
        query: () => ({
          url: 'ai-assessment/start',
          method: 'POST',
        }),
      }),
      submitAiAssessment: builder.mutation<
        AiAssessmentResult,
        SubmitAssessmentDto
      >({
        query: (body) => ({
          url: 'ai-assessment/submit',
          method: 'POST',
          body,
        }),
      }),
      getAiAssessmentResult: builder.query<AiAssessmentResult, string>({
        query: (sessionId) => `ai-assessment/result/${sessionId}`,
      }),
    }),
  });
  
  export const {
    useGetAiAssessmentQuestionsQuery,
    useStartAiAssessmentMutation,
    useSubmitAiAssessmentMutation,
    useGetAiAssessmentResultQuery,
  } = aiAssessmentApi; 