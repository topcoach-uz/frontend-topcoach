/**
 * Research Prep RTK slice — live backend at `/api/research-prep`.
 *
 * Mirrors the controller in `src/modules/research-prep/research-prep.controller.ts`
 * one-for-one. The shapes match `./types` so callers don't change.
 */

import { RtkApi } from '../api';
import type {
  QuizAttemptResult,
  ResearchAdminStudent,
  ResearchAssignment,
  ResearchAttachment,
  ResearchProgressSummary,
  ResearchQuizQuestion,
  ResearchSubmission,
  ResearchVideoLesson,
  ResearchWeek,
  WeekLockState,
} from './types';

const BASE = '/research-prep';

export const researchPrepApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Mentee ────────────────────────────────────────────────────────────
    getResearchStructure: builder.query<ResearchWeek[], void>({
      query: () => `${BASE}/structure`,
      providesTags: ['ResearchPrepStructure'],
    }),

    getResearchLockState: builder.query<WeekLockState[], void>({
      query: () => `${BASE}/lock-state`,
      providesTags: ['ResearchPrepProgress'],
    }),

    getResearchProgressSummary: builder.query<ResearchProgressSummary, void>({
      query: () => `${BASE}/progress-summary`,
      providesTags: ['ResearchPrepProgress'],
    }),

    markVideoComplete: builder.mutation<WeekLockState, { weekId: string; videoId: string }>({
      query: (body) => ({
        url: `${BASE}/mark-video-complete`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ResearchPrepProgress'],
    }),

    submitQuizAttempt: builder.mutation<
      QuizAttemptResult,
      { weekId: string; answers: Array<{ questionId: string; selectedIndex: number }> }
    >({
      query: (body) => ({
        url: `${BASE}/submit-quiz`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ResearchPrepProgress'],
    }),

    submitAssignment: builder.mutation<
      ResearchSubmission,
      { weekId: string; file?: File; text?: string }
    >({
      query: ({ weekId, file, text }) => {
        const formData = new FormData();
        formData.append('weekId', weekId);
        if (text) formData.append('text', text);
        if (file) formData.append('file', file);
        return {
          url: `${BASE}/submit-assignment`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['ResearchPrepProgress', 'ResearchPrepSubmissions'],
    }),

    getMyAssignmentSubmissions: builder.query<ResearchSubmission[], void>({
      query: () => `${BASE}/my-submissions`,
      providesTags: ['ResearchPrepSubmissions'],
    }),

    // ── Grader (mentor) ──────────────────────────────────────────────────
    getGraderInbox: builder.query<ResearchSubmission[], void>({
      query: () => `${BASE}/grader/inbox`,
      providesTags: ['ResearchPrepGradingInbox'],
    }),

    claimSubmission: builder.mutation<ResearchSubmission, string>({
      query: (submissionId) => ({
        url: `${BASE}/grader/submissions/${submissionId}/claim`,
        method: 'POST',
      }),
      invalidatesTags: ['ResearchPrepGradingInbox'],
    }),

    gradeSubmission: builder.mutation<
      ResearchSubmission,
      {
        submissionId: string;
        feedbackMd: string;
        score: number;
        action: 'mark-graded' | 'return-for-revision';
        /** Optional graded copy uploaded alongside feedback. */
        file?: File;
      }
    >({
      query: ({ submissionId, feedbackMd, score, action, file }) => {
        const formData = new FormData();
        formData.append('feedbackMd', feedbackMd);
        formData.append('score', String(score));
        formData.append('action', action);
        if (file) formData.append('file', file);
        return {
          url: `${BASE}/grader/submissions/${submissionId}/grade`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['ResearchPrepGradingInbox'],
    }),

    // ── Admin authoring ─────────────────────────────────────────────────
    getAdminStudents: builder.query<ResearchAdminStudent[], void>({
      query: () => `${BASE}/admin/students`,
      providesTags: ['ResearchPrepAdmin'],
    }),

    updateWeek: builder.mutation<
      ResearchWeek,
      { weekId: string; patch: Partial<Pick<ResearchWeek, 'title' | 'tagline'>> & { quizTitle?: string } }
    >({
      query: ({ weekId, patch }) => ({
        url: `${BASE}/admin/weeks/${weekId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['ResearchPrepStructure', 'ResearchPrepAdmin'],
    }),

    upsertVideoLesson: builder.mutation<
      ResearchVideoLesson,
      { weekId: string; lesson: ResearchVideoLesson }
    >({
      query: ({ weekId, lesson }) => ({
        url: `${BASE}/admin/weeks/${weekId}/lessons`,
        method: 'PUT',
        body: lesson,
      }),
      invalidatesTags: ['ResearchPrepStructure', 'ResearchPrepAdmin'],
    }),

    deleteVideoLesson: builder.mutation<{ ok: true }, { weekId: string; lessonId: string }>({
      query: ({ weekId, lessonId }) => ({
        url: `${BASE}/admin/weeks/${weekId}/lessons/${lessonId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ResearchPrepStructure', 'ResearchPrepAdmin'],
    }),

    upsertAttachment: builder.mutation<
      ResearchAttachment,
      { weekId: string; lessonId: string; attachment: ResearchAttachment }
    >({
      query: ({ weekId, lessonId, attachment }) => ({
        url: `${BASE}/admin/weeks/${weekId}/lessons/${lessonId}/attachments`,
        method: 'PUT',
        body: attachment,
      }),
      invalidatesTags: ['ResearchPrepStructure', 'ResearchPrepAdmin'],
    }),

    deleteAttachment: builder.mutation<
      { ok: true },
      { weekId: string; lessonId: string; attachmentId: string }
    >({
      query: ({ weekId, lessonId, attachmentId }) => ({
        url: `${BASE}/admin/weeks/${weekId}/lessons/${lessonId}/attachments/${attachmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ResearchPrepStructure', 'ResearchPrepAdmin'],
    }),

    upsertQuizQuestion: builder.mutation<
      ResearchQuizQuestion,
      { weekId: string; question: ResearchQuizQuestion }
    >({
      query: ({ weekId, question }) => ({
        url: `${BASE}/admin/weeks/${weekId}/questions`,
        method: 'PUT',
        body: question,
      }),
      invalidatesTags: ['ResearchPrepStructure', 'ResearchPrepAdmin'],
    }),

    deleteQuizQuestion: builder.mutation<
      { ok: true },
      { weekId: string; questionId: string }
    >({
      query: ({ weekId, questionId }) => ({
        url: `${BASE}/admin/weeks/${weekId}/questions/${questionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ResearchPrepStructure', 'ResearchPrepAdmin'],
    }),

    upsertAssignment: builder.mutation<
      ResearchAssignment,
      { weekId: string; assignment: ResearchAssignment }
    >({
      query: ({ weekId, assignment }) => ({
        url: `${BASE}/admin/weeks/${weekId}/assignment`,
        method: 'PUT',
        body: assignment,
      }),
      invalidatesTags: ['ResearchPrepStructure', 'ResearchPrepAdmin'],
    }),
  }),
});

export const {
  useGetResearchStructureQuery,
  useGetResearchLockStateQuery,
  useGetResearchProgressSummaryQuery,
  useMarkVideoCompleteMutation,
  useSubmitQuizAttemptMutation,
  useSubmitAssignmentMutation,
  useGetMyAssignmentSubmissionsQuery,
  useGetGraderInboxQuery,
  useClaimSubmissionMutation,
  useGradeSubmissionMutation,
  useGetAdminStudentsQuery,
  useUpdateWeekMutation,
  useUpsertVideoLessonMutation,
  useDeleteVideoLessonMutation,
  useUpsertAttachmentMutation,
  useDeleteAttachmentMutation,
  useUpsertQuizQuestionMutation,
  useDeleteQuizQuestionMutation,
  useUpsertAssignmentMutation,
} = researchPrepApi;

export * from './types';
