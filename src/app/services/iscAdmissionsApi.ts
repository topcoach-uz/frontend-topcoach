import { RtkApi } from './api';

/* ── Shared types (mirror the backend entity/response shapes) ───────── */
export type IscProgram = 'bachelor' | 'master';
export type IscApplicantType = 'local' | 'international';
export type IscApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'reviewed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'accepted'
  | 'waitlisted'
  | 'rejected'
  | 'withdrawn';
export type IscRecommendation =
  | 'strong_recommend'
  | 'recommend'
  | 'neutral'
  | 'not_recommend';

export interface IscScoreBreakdown {
  academicPotential: number;
  leadership: number;
  extracurricular: number;
  motivation: number;
  communication: number;
}

export interface IscApplicationRow {
  id: string;
  userId: string;
  program: IscProgram;
  applicantType: IscApplicantType;
  status: IscApplicationStatus;
  draft: Record<string, unknown>;
  fullName?: string | null;
  email?: string | null;
  country?: string | null;
  intendedMajor?: string | null;
  submittedAt?: string | null;
  aiScore?: string | null;
  reviewScoreAvg?: string | null;
  decidedAt?: string | null;
  autoRejectedAt?: string | null;
  autoRejectedReason?: string | null;
  /** ISC 2026 participation-fee Atmos link; present only for invoiced students. */
  paymentLink?: string | null;
  createdAt: string;
}

export type IscAiRecommendation2 =
  | 'strong_yes'
  | 'yes'
  | 'lean_yes'
  | 'borderline'
  | 'lean_no'
  | 'no';

export interface IscAiAssessment {
  recommendation: IscAiRecommendation2;
  headline: string;
  dimensions: {
    key: keyof IscScoreBreakdown;
    score: number;
    justification: string;
  }[];
  strengths: string[];
  concerns: string[];
  authenticity: {
    verdict: 'authentic' | 'mixed' | 'likely_ai' | 'uncertain';
    confidence: number;
    reasoning: string;
  };
  fit: string;
  interviewQuestions: string[];
  verify: string[];
}

export interface IscAiEvaluation {
  id: string;
  applicationId: string;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  scores?: (IscScoreBreakdown & { total: number }) | null;
  summary?: string | null;
  flags?: { type: string; severity: 'info' | 'warn' | 'high'; detail: string }[] | null;
  assessment?: IscAiAssessment | null;
  model?: string | null;
  evaluatedAt?: string | null;
  error?: string | null;
}

export interface IscReviewRow extends IscScoreBreakdown {
  id: string;
  applicationId: string;
  reviewerUserId: string;
  total: number;
  recommendation: IscRecommendation;
  notes?: string | null;
  submittedAt?: string | null;
}

export interface IscAssignmentRow {
  id: string;
  applicationId: string;
  reviewerUserId: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'recused';
  reviewer?: { id: string; email: string; profile?: { name?: string } } | null;
}

export interface IscInterviewRow {
  id: string;
  applicationId: string;
  reviewerUserId?: string | null;
  interviewerName?: string | null;
  scheduledAt?: string | null;
  meetingLink?: string | null;
  status: 'scheduled' | 'completed' | 'no_show' | 'cancelled';
  scores?: {
    communication: number;
    leadership: number;
    criticalThinking: number;
    motivation: number;
    campFit: number;
  } | null;
  interviewTotal?: number | null;
  interviewRecommendation?: IscRecommendation | null;
  notes?: string | null;
}

export interface IscDecisionRow {
  id: string;
  applicationId: string;
  decision: 'accepted' | 'waitlisted' | 'rejected';
  rationale?: string | null;
  decidedAt: string;
}

export interface IscConfig {
  applicationsOpen: boolean;
  openAt: string | null;
  closeAt: string | null;
  deadlineLabel: string;
}

export interface IscAdminStats {
  total: number;
  byStatus: Record<IscApplicationStatus, number>;
  byProgram: { bachelor: number; master: number };
  byApplicantType: { local: number; international: number };
  avgAiScore: number;
  awaitingReview: number;
  inInterview: number;
  accepted: number;
  reviewerWorkload: {
    reviewerUserId: string;
    assigned: number;
    completed: number;
    remaining: number;
  }[];
}

export interface IscReviewerRow {
  id: string;
  email: string;
  name: string;
  assigned: number;
  reviewed: number;
  remaining: number;
  avgScoreGiven: number;
}

export interface IscAdminApplicationDetail {
  application: IscApplicationRow;
  ai: IscAiEvaluation | null;
  reviews: IscReviewRow[];
  assignments: IscAssignmentRow[];
  interviews: IscInterviewRow[];
  decision: IscDecisionRow | null;
}

export interface IscReviewerQueueRow {
  application: IscApplicationRow;
  reviewed: boolean;
  myReviewTotal: number | null;
}

export interface SubmitIscReviewBody extends IscScoreBreakdown {
  recommendation: IscRecommendation;
  notes?: string;
}

export interface IscListParams {
  page?: number;
  limit?: number;
  status?: IscApplicationStatus;
  program?: IscProgram;
  applicantType?: IscApplicantType;
  reviewerUserId?: string;
  q?: string;
  minScore?: number;
  maxScore?: number;
  minAiScore?: number;
  maxAiScore?: number;
  /** Hide applications auto-rejected as previous-season attendees. */
  excludeAutoRejected?: boolean;
  sort?: 'submittedAt' | 'aiScore' | 'reviewScoreAvg';
}

const BASE = 'isc-admissions';

export const iscAdmissionsApi = RtkApi.injectEndpoints({
  endpoints: (b) => ({
    /* ── Applicant ── */
    getIscConfig: b.query<IscConfig, void>({
      query: () => `${BASE}/config`,
    }),
    getIscApplicationMe: b.query<{ application: IscApplicationRow | null }, void>({
      query: () => `${BASE}/applications/me`,
      providesTags: ['IscApplicationMe'],
    }),
    submitIscApplication: b.mutation<
      { application: IscApplicationRow },
      { program: IscProgram; applicantType: IscApplicantType; draft: Record<string, unknown> }
    >({
      query: (body) => ({ url: `${BASE}/applications`, method: 'POST', body }),
      invalidatesTags: ['IscApplicationMe', 'IscAdminApplications', 'IscAdminStats'],
    }),
    uploadIscDocument: b.mutation<{ path: string; originalName: string }, FormData>({
      query: (formData) => ({
        url: `${BASE}/applications/me/documents`,
        method: 'POST',
        body: formData,
      }),
    }),
    withdrawIscApplication: b.mutation<{ application: IscApplicationRow }, void>({
      query: () => ({ url: `${BASE}/applications/me/withdraw`, method: 'POST' }),
      invalidatesTags: ['IscApplicationMe', 'IscAdminApplications', 'IscAdminStats'],
    }),

    /* ── Reviewer ── */
    getIscReviewerQueue: b.query<IscReviewerQueueRow[], void>({
      query: () => `${BASE}/reviewer/queue`,
      providesTags: ['IscReviewerQueue'],
    }),
    getIscReviewerStats: b.query<
      { assigned: number; reviewed: number; remaining: number },
      void
    >({
      query: () => `${BASE}/reviewer/stats/me`,
      providesTags: ['IscReviewerStats'],
    }),
    getIscReviewApplication: b.query<
      { application: IscApplicationRow; ai: IscAiEvaluation | null; myReview: IscReviewRow | null },
      string
    >({
      query: (id) => `${BASE}/reviewer/applications/${id}`,
    }),
    submitIscReview: b.mutation<
      { review: IscReviewRow; application: IscApplicationRow },
      { applicationId: string; body: SubmitIscReviewBody }
    >({
      query: ({ applicationId, body }) => ({
        url: `${BASE}/reviewer/applications/${applicationId}/review`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'IscReviewerQueue',
        'IscReviewerStats',
        'IscAdminApplications',
        'IscAdminApplication',
        'IscAdminStats',
      ],
    }),

    /* ── Admin ── */
    getIscAdminApplications: b.query<
      { items: IscApplicationRow[]; total: number; page: number; limit: number },
      IscListParams | void
    >({
      query: (params) => ({ url: `${BASE}/admin/applications`, params: params ?? {} }),
      providesTags: ['IscAdminApplications'],
    }),
    getIscAdminApplication: b.query<IscAdminApplicationDetail, string>({
      query: (id) => `${BASE}/admin/applications/${id}`,
      providesTags: ['IscAdminApplication'],
    }),
    getIscAdminStats: b.query<IscAdminStats, void>({
      query: () => `${BASE}/admin/stats`,
      providesTags: ['IscAdminStats'],
    }),
    getIscAdminInterviews: b.query<
      { interviews: { interview: IscInterviewRow; applicant: { id: string; fullName?: string | null; program: IscProgram } | null }[] },
      void
    >({
      query: () => `${BASE}/admin/interviews`,
      providesTags: ['IscInterviews'],
    }),
    getIscReviewers: b.query<IscReviewerRow[], void>({
      query: () => `${BASE}/admin/reviewers`,
      providesTags: ['IscReviewers'],
    }),
    getIscAdminReviewerQueue: b.query<IscReviewerQueueRow[], string>({
      query: (reviewerUserId) => `${BASE}/admin/reviewers/${reviewerUserId}/queue`,
      providesTags: ['IscReviewerQueue'],
    }),
    assignIscReviewers: b.mutation<unknown, { applicationId: string; reviewerUserIds: string[] }>({
      query: ({ applicationId, reviewerUserIds }) => ({
        url: `${BASE}/admin/applications/${applicationId}/assignments`,
        method: 'POST',
        body: { reviewerUserIds },
      }),
      invalidatesTags: ['IscAdminApplications', 'IscAdminApplication', 'IscAdminStats', 'IscReviewers'],
    }),
    unassignIscReviewer: b.mutation<unknown, string>({
      query: (assignmentId) => ({ url: `${BASE}/admin/assignments/${assignmentId}`, method: 'DELETE' }),
      invalidatesTags: ['IscAdminApplication', 'IscReviewers'],
    }),
    grantIscReviewer: b.mutation<unknown, string>({
      query: (userId) => ({ url: `${BASE}/admin/reviewers/${userId}/grant`, method: 'POST' }),
      invalidatesTags: ['IscReviewers'],
    }),
    grantIscReviewerByEmail: b.mutation<
      { ok: boolean; reviewer?: { id: string; email: string; name: string }; message?: string },
      string
    >({
      query: (email) => ({ url: `${BASE}/admin/reviewers/grant-by-email`, method: 'POST', body: { email } }),
      invalidatesTags: ['IscReviewers'],
    }),
    revokeIscReviewer: b.mutation<unknown, string>({
      query: (userId) => ({ url: `${BASE}/admin/reviewers/${userId}/revoke`, method: 'POST' }),
      invalidatesTags: ['IscReviewers'],
    }),
    scheduleIscInterview: b.mutation<
      unknown,
      { applicationId: string; scheduledAt?: string; interviewerName?: string; meetingLink?: string }
    >({
      query: (body) => ({ url: `${BASE}/admin/interviews`, method: 'POST', body }),
      invalidatesTags: ['IscInterviews', 'IscAdminApplications', 'IscAdminApplication', 'IscAdminStats'],
    }),
    updateIscInterview: b.mutation<unknown, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `${BASE}/admin/interviews/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['IscInterviews'],
    }),
    cancelIscInterview: b.mutation<unknown, string>({
      query: (id) => ({ url: `${BASE}/admin/interviews/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['IscInterviews', 'IscAdminApplications', 'IscAdminApplication', 'IscAdminStats'],
    }),
    recordIscInterviewEval: b.mutation<unknown, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `${BASE}/admin/interviews/${id}/evaluation`, method: 'POST', body }),
      invalidatesTags: ['IscInterviews', 'IscAdminApplications', 'IscAdminApplication', 'IscAdminStats'],
    }),
    decideIscApplication: b.mutation<
      unknown,
      { applicationId: string; decision: 'accepted' | 'waitlisted' | 'rejected'; rationale?: string }
    >({
      query: ({ applicationId, decision, rationale }) => ({
        url: `${BASE}/admin/applications/${applicationId}/decision`,
        method: 'POST',
        body: { decision, rationale },
      }),
      invalidatesTags: ['IscAdminApplications', 'IscAdminApplication', 'IscAdminStats'],
    }),
    rerunIscAiEval: b.mutation<unknown, string>({
      query: (applicationId) => ({
        url: `${BASE}/admin/applications/${applicationId}/ai-eval/rerun`,
        method: 'POST',
      }),
      invalidatesTags: ['IscAdminApplication'],
    }),
    rerunAllIscAi: b.mutation<
      { started: boolean; total: number; alreadyRunning: boolean },
      { onlyPending?: boolean } | void
    >({
      query: (body) => ({
        url: `${BASE}/admin/ai-eval/rerun-all`,
        method: 'POST',
        body: body ?? {},
      }),
    }),
    getIscAiProgress: b.query<
      {
        running: boolean;
        total: number;
        completed: number;
        failed: number;
        skipped: number;
        attempted: number;
        remaining: number;
        startedAt: string | null;
        finishedAt: string | null;
      },
      void
    >({
      query: () => `${BASE}/admin/ai-eval/progress`,
    }),
    reviewAsIsc: b.query<
      { application: IscApplicationRow; ai: IscAiEvaluation | null; myReview: IscReviewRow | null },
      { applicationId: string; reviewerUserId: string }
    >({
      query: ({ applicationId, reviewerUserId }) =>
        `${BASE}/admin/applications/${applicationId}/review-as/${reviewerUserId}`,
    }),
    submitReviewAsIsc: b.mutation<
      unknown,
      { applicationId: string; reviewerUserId: string; body: SubmitIscReviewBody }
    >({
      query: ({ applicationId, reviewerUserId, body }) => ({
        url: `${BASE}/admin/applications/${applicationId}/review-as/${reviewerUserId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['IscAdminApplication', 'IscAdminApplications', 'IscAdminStats'],
    }),
  }),
});

export const {
  useGetIscConfigQuery,
  useGetIscApplicationMeQuery,
  useSubmitIscApplicationMutation,
  useUploadIscDocumentMutation,
  useWithdrawIscApplicationMutation,
  useGetIscReviewerQueueQuery,
  useGetIscReviewerStatsQuery,
  useGetIscReviewApplicationQuery,
  useSubmitIscReviewMutation,
  useGetIscAdminApplicationsQuery,
  useGetIscAdminApplicationQuery,
  useGetIscAdminStatsQuery,
  useGetIscAdminInterviewsQuery,
  useGetIscReviewersQuery,
  useGetIscAdminReviewerQueueQuery,
  useAssignIscReviewersMutation,
  useUnassignIscReviewerMutation,
  useGrantIscReviewerMutation,
  useGrantIscReviewerByEmailMutation,
  useRevokeIscReviewerMutation,
  useScheduleIscInterviewMutation,
  useUpdateIscInterviewMutation,
  useCancelIscInterviewMutation,
  useRecordIscInterviewEvalMutation,
  useDecideIscApplicationMutation,
  useRerunIscAiEvalMutation,
  useRerunAllIscAiMutation,
  useGetIscAiProgressQuery,
  useReviewAsIscQuery,
  useSubmitReviewAsIscMutation,
} = iscAdmissionsApi;
