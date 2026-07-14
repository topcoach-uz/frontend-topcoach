import { RtkApi } from './api';

/**
 * Counselor Console API — org-scoped endpoints for the new `/counselor-console`
 * surface. A parallel backend agent is implementing these to the EXACT shapes
 * declared below, so keep the interfaces authoritative: the page agents import
 * both the hooks and the types from here.
 *
 * Endpoint map:
 *   GET /org/me                    → useGetMyOrgsQuery()
 *   GET /org/:orgId                → useGetOrgContextQuery(orgId)
 *   GET /org/:orgId/dashboard      → useGetOrgDashboardQuery(orgId)
 *   GET /org/:orgId/students       → useGetOrgStudentsQuery({ orgId, ... })
 */

// ── Shared enums / value unions ────────────────────────────────────────────

export type OrgMembershipRole = 'owner' | 'counselor' | 'student';

export type OrgMembershipStatus = 'active' | 'invited' | 'archived';

export type OrgStatus = 'active' | 'suspended' | 'archived';

export type OrgStudentStatus = 'active' | 'invited' | 'archived';

export type TelegramStatus = 'linked' | 'pending' | 'unlinked';

// ── Organization / membership ──────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: OrgStatus;
}

/** One row of `GET /org/me` — the user's membership in an organization. */
export interface OrgMembership {
  organization: Organization;
  role: OrgMembershipRole;
  status: OrgMembershipStatus;
  joinedAt: string;
}

/** `GET /org/:orgId` — the full org context for the active organization. */
export interface OrgContext {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: OrgStatus;
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export interface OrgDashboardNeedsAttention {
  userId: string;
  name: string;
  reason: string;
}

export interface OrgDashboardEnrollmentTrend {
  month: string;
  count: number;
}

export interface OrgDashboard {
  totalStudents: number;
  activeStudents: number;
  newThisMonth: number;
  avgProgress: number;
  avgProfileCompletion: number;
  applicationsStarted: number;
  applicationsSubmitted: number;
  upcomingSessions: number;
  needsAttention: OrgDashboardNeedsAttention[];
  enrollmentTrends: OrgDashboardEnrollmentTrend[];
}

// ── Students ───────────────────────────────────────────────────────────────

export interface OrgStudent {
  userId: string;
  name: string;
  email: string;
  /** Profile picture URL, or null when the student has none. */
  avatarUrl: string | null;
  /** May be a raw number (11) or a label ("Grade 11") depending on source. */
  gradeLevel: string | number | null;
  graduationYear: number | null;
  programs: string[];
  progress: number;
  /** Program the `progress` value comes from (its furthest-along program). */
  topProgram: string | null;
  lastActiveAt: string | null;
  status: OrgStudentStatus;
  telegramStatus: TelegramStatus;
}

export interface OrgStudentsResponse {
  items: OrgStudent[];
  total: number;
  page: number;
  limit: number;
}

export interface GetOrgStudentsArgs {
  orgId: string;
  search?: string;
  status?: OrgStudentStatus | string;
  page?: number;
  limit?: number;
  sort?: string;
}

// ── Per-student program enrollment (drill-down) ──────────────────────────────
// `GET /org/:orgId/students/:userId/programs` — one nullable block per program
// the org offers; `null` means the student is not enrolled in that program.

export interface StudentAdmissionsProgram {
  enrolled: boolean;
  progress: number;
  applications: { total: number; submitted: number };
}

export interface StudentSatProgram {
  enrolled: boolean;
  bestScore: number;
  accuracy: number;
  questionsAttempted: number;
  lessonsProgress: number;
}

export interface StudentResearchProgram {
  enrolled: boolean;
  weeksCompleted: number;
  totalWeeks: number;
  progress: number;
}

export interface StudentFullSupportApplication {
  program: string;
  stage: string;
  status: string;
}

export interface StudentFullSupportProgram {
  enrolled: boolean;
  sessions: { total: number; completed: number };
  milestones: { done: number; total: number; progress: number };
  tasks: { total: number; pending: number };
  applications: StudentFullSupportApplication[];
}

export interface StudentCommunityProgram {
  active: boolean;
}

export interface StudentProgramsResponse {
  admissions: StudentAdmissionsProgram | null;
  sat: StudentSatProgram | null;
  research: StudentResearchProgram | null;
  fullSupport: StudentFullSupportProgram | null;
  community: StudentCommunityProgram;
}

export interface GetStudentProgramsArgs {
  orgId: string;
  userId: string;
}

export interface RemoveStudentArgs {
  orgId: string;
  userId: string;
}

// ── Invitations ─────────────────────────────────────────────────────────────

export type OrgInvitationStatus =
  | 'pending'
  | 'accepted'
  | 'expired'
  | 'revoked';

/** One row of `GET /org/:orgId/invitations`. */
export interface OrgInvitation {
  id: string;
  email: string;
  role: OrgMembershipRole;
  status: OrgInvitationStatus;
  inviteeName: string | null;
  gradeLevel: string | null;
  graduationYear: number | null;
  invitedBy: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface OrgInvitationsResponse {
  items: OrgInvitation[];
  total: number;
  page: number;
  limit: number;
}

export interface GetInvitationsArgs {
  orgId: string;
  status?: OrgInvitationStatus | string;
  page?: number;
  limit?: number;
}

/** Body of `POST /org/:orgId/invitations`. */
export interface CreateInvitationBody {
  email: string;
  role: OrgMembershipRole;
  name?: string;
  gradeLevel?: string;
  graduationYear?: number;
  phone?: string;
}

export interface CreateInvitationArgs extends CreateInvitationBody {
  orgId: string;
}

/** Body of `POST /org/:orgId/invitations/bulk`. */
export interface BulkInviteArgs {
  orgId: string;
  invitations: CreateInvitationBody[];
}

export interface BulkInviteSkipped {
  email: string;
  reason: string;
}

export interface BulkInviteResult {
  created: number;
  skipped: BulkInviteSkipped[];
}

export interface InvitationMutationArgs {
  orgId: string;
  id: string;
}

// ── Existing-user search / direct add ────────────────────────────────────────

/** One row of `GET /org/:orgId/user-search?q=` — an existing TopCoach user
 *  who is not already an active member of the organization. */
export interface OrgUserSearchResult {
  id: string;
  name: string;
  email: string;
}

export interface SearchOrgUsersArgs {
  orgId: string;
  q: string;
}

/** Body of `POST /org/:orgId/members` — add an existing user as an active
 *  member. `role: 'counselor'` is owner-only server-side. */
export interface AddOrgMemberArgs {
  orgId: string;
  userId: string;
  role: 'student' | 'counselor';
}

// ── Analytics (broad org analytics) ──────────────────────────────────────────

/** Time window driving the analytics query. */
export type OrgAnalyticsRange = '30d' | '90d' | '365d';

export interface OrgAnalyticsProgramRow {
  program: string;
  enrolled: number;
  completed: number;
  avgProgress: number;
}

export interface OrgAnalyticsBucket {
  bucket: string;
  count: number;
}

export interface OrgAnalyticsFunnelStage {
  stage: string;
  count: number;
}

export interface OrgAnalyticsApplicationsPoint {
  month: string;
  started: number;
  submitted: number;
}

export interface OrgAnalyticsWeeklyActivePoint {
  week: string;
  count: number;
}

export interface OrgAnalyticsCohort {
  cohort: string;
  count: number;
}

export interface OrgAnalyticsUsageRow {
  type: string;
  count: number;
}

export interface OrgAnalyticsTopEarner {
  userId: string;
  name: string;
  coins: number;
}

export interface OrgAnalyticsSessionMonth {
  month: string;
  count: number;
}

export interface OrgAnalyticsHistoryPoint {
  date: string;
  students: number;
  activeStudents: number;
  applicationsSubmitted: number;
  avgProgress: number;
}

/** `GET /org/:orgId/analytics?range=` — broad, cross-domain org analytics. */
export interface OrgAnalytics {
  range: OrgAnalyticsRange | string;
  programs: {
    byProgram: OrgAnalyticsProgramRow[];
    progressDistribution: OrgAnalyticsBucket[];
    /** Count of the org's students who are active Community members. */
    communityMembers: number;
  };
  admissions: {
    funnel: OrgAnalyticsFunnelStage[];
    applicationsOverTime: OrgAnalyticsApplicationsPoint[];
  };
  engagement: {
    weeklyActive: OrgAnalyticsWeeklyActivePoint[];
    lastActiveCohorts: OrgAnalyticsCohort[];
    messagesSent: number;
  };
  ai: {
    majorMatchAttempts: number;
    majorMatchCompleted: number;
    usageByType: OrgAnalyticsUsageRow[];
  };
  coins: {
    totalEarned: number;
    totalRedeemed: number;
    topEarners: OrgAnalyticsTopEarner[];
  };
  sessions: {
    booked: number;
    attended: number;
    upcoming: number;
    byMonth: OrgAnalyticsSessionMonth[];
  };
  events: {
    registrations: number;
    attended: number;
    upcoming: number;
  };
  history: OrgAnalyticsHistoryPoint[];
}

export interface GetOrgAnalyticsArgs {
  orgId: string;
  range: OrgAnalyticsRange;
}

// ── Member admin (archive / transfer) ────────────────────────────────────────

export interface ArchiveStudentArgs {
  orgId: string;
  userId: string;
}

export interface TransferStudentArgs {
  orgId: string;
  userId: string;
  targetOrgId: string;
}

// ── API slice ──────────────────────────────────────────────────────────────

export const counselorConsoleApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyOrgs: builder.query<OrgMembership[], void>({
      query: () => ({ url: '/org/me', method: 'GET' }),
      providesTags: ['CounselorOrgs'],
    }),

    getOrgContext: builder.query<OrgContext, string>({
      query: (orgId) => ({
        url: `/org/${encodeURIComponent(orgId)}`,
        method: 'GET',
      }),
      providesTags: (_res, _err, orgId) => [
        { type: 'CounselorOrgContext' as const, id: orgId },
      ],
    }),

    getOrgDashboard: builder.query<OrgDashboard, string>({
      query: (orgId) => ({
        url: `/org/${encodeURIComponent(orgId)}/dashboard`,
        method: 'GET',
      }),
      providesTags: (_res, _err, orgId) => [
        { type: 'CounselorDashboard' as const, id: orgId },
      ],
    }),

    getOrgStudents: builder.query<OrgStudentsResponse, GetOrgStudentsArgs>({
      query: ({ orgId, search, status, page, limit, sort }) => ({
        url: `/org/${encodeURIComponent(orgId)}/students`,
        method: 'GET',
        params: {
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
          ...(page != null ? { page } : {}),
          ...(limit != null ? { limit } : {}),
          ...(sort ? { sort } : {}),
        },
      }),
      providesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorStudents' as const, id: orgId },
      ],
    }),

    getStudentPrograms: builder.query<
      StudentProgramsResponse,
      GetStudentProgramsArgs
    >({
      query: ({ orgId, userId }) => ({
        url: `/org/${encodeURIComponent(orgId)}/students/${encodeURIComponent(userId)}/programs`,
        method: 'GET',
      }),
      providesTags: (_res, _err, { userId }) => [
        { type: 'CounselorStudentPrograms' as const, id: userId },
      ],
    }),

    removeStudent: builder.mutation<void, RemoveStudentArgs>({
      query: ({ orgId, userId }) => ({
        url: `/org/${encodeURIComponent(orgId)}/students/${encodeURIComponent(userId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorStudents' as const, id: orgId },
        { type: 'CounselorDashboard' as const, id: orgId },
      ],
    }),

    // ── Existing-user search / direct add ─────────────────────────────────────
    searchOrgUsers: builder.query<OrgUserSearchResult[], SearchOrgUsersArgs>({
      query: ({ orgId, q }) => ({
        url: `/org/${encodeURIComponent(orgId)}/user-search`,
        method: 'GET',
        params: { q },
      }),
      providesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorUserSearch' as const, id: orgId },
      ],
    }),

    addOrgMember: builder.mutation<void, AddOrgMemberArgs>({
      query: ({ orgId, userId, role }) => ({
        url: `/org/${encodeURIComponent(orgId)}/members`,
        method: 'POST',
        body: { userId, role },
      }),
      invalidatesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorStudents' as const, id: orgId },
        { type: 'CounselorStaff' as const, id: orgId },
        { type: 'CounselorDashboard' as const, id: orgId },
        { type: 'CounselorUserSearch' as const, id: orgId },
      ],
    }),

    // ── Analytics ──────────────────────────────────────────────────────────────
    getOrgAnalytics: builder.query<OrgAnalytics, GetOrgAnalyticsArgs>({
      query: ({ orgId, range }) => ({
        url: `/org/${encodeURIComponent(orgId)}/analytics`,
        method: 'GET',
        params: { range },
      }),
      providesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorAnalytics' as const, id: orgId },
      ],
    }),

    // ── Invitations ──────────────────────────────────────────────────────────
    getInvitations: builder.query<OrgInvitationsResponse, GetInvitationsArgs>({
      query: ({ orgId, status, page, limit }) => ({
        url: `/org/${encodeURIComponent(orgId)}/invitations`,
        method: 'GET',
        params: {
          ...(status ? { status } : {}),
          ...(page != null ? { page } : {}),
          ...(limit != null ? { limit } : {}),
        },
      }),
      providesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorInvitations' as const, id: orgId },
      ],
    }),

    createInvitation: builder.mutation<OrgInvitation, CreateInvitationArgs>({
      query: ({ orgId, ...body }) => ({
        url: `/org/${encodeURIComponent(orgId)}/invitations`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorInvitations' as const, id: orgId },
        { type: 'CounselorStudents' as const, id: orgId },
      ],
    }),

    bulkInvite: builder.mutation<BulkInviteResult, BulkInviteArgs>({
      query: ({ orgId, invitations }) => ({
        url: `/org/${encodeURIComponent(orgId)}/invitations/bulk`,
        method: 'POST',
        body: { invitations },
      }),
      invalidatesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorInvitations' as const, id: orgId },
        { type: 'CounselorStudents' as const, id: orgId },
      ],
    }),

    resendInvitation: builder.mutation<OrgInvitation, InvitationMutationArgs>({
      query: ({ orgId, id }) => ({
        url: `/org/${encodeURIComponent(orgId)}/invitations/${encodeURIComponent(id)}/resend`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorInvitations' as const, id: orgId },
      ],
    }),

    revokeInvitation: builder.mutation<OrgInvitation, InvitationMutationArgs>({
      query: ({ orgId, id }) => ({
        url: `/org/${encodeURIComponent(orgId)}/invitations/${encodeURIComponent(id)}/revoke`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorInvitations' as const, id: orgId },
      ],
    }),

    // ── Member admin (archive / transfer) ────────────────────────────────────
    archiveStudent: builder.mutation<void, ArchiveStudentArgs>({
      query: ({ orgId, userId }) => ({
        url: `/org/${encodeURIComponent(orgId)}/students/${encodeURIComponent(userId)}/archive`,
        method: 'PATCH',
      }),
      invalidatesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorStudents' as const, id: orgId },
        { type: 'CounselorDashboard' as const, id: orgId },
      ],
    }),

    transferStudent: builder.mutation<void, TransferStudentArgs>({
      query: ({ orgId, userId, targetOrgId }) => ({
        url: `/org/${encodeURIComponent(orgId)}/students/${encodeURIComponent(userId)}/transfer`,
        method: 'POST',
        body: { targetOrgId },
      }),
      invalidatesTags: (_res, _err, { orgId, targetOrgId }) => [
        { type: 'CounselorStudents' as const, id: orgId },
        { type: 'CounselorStudents' as const, id: targetOrgId },
        { type: 'CounselorDashboard' as const, id: orgId },
        { type: 'CounselorDashboard' as const, id: targetOrgId },
      ],
    }),
  }),
});

export const {
  useGetMyOrgsQuery,
  useGetOrgContextQuery,
  useGetOrgDashboardQuery,
  useGetOrgAnalyticsQuery,
  useGetOrgStudentsQuery,
  useGetStudentProgramsQuery,
  useRemoveStudentMutation,
  useSearchOrgUsersQuery,
  useAddOrgMemberMutation,
  useGetInvitationsQuery,
  useCreateInvitationMutation,
  useBulkInviteMutation,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
  useArchiveStudentMutation,
  useTransferStudentMutation,
} = counselorConsoleApi;
