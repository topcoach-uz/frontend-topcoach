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
  /** Actual school assignment, distinguished from administrator preview access. */
  isAssignedMember?: boolean;
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

/** A student near the top of the cohort by program progress. */
export interface OrgDashboardTopPerformer {
  userId: string;
  name: string;
  avatarUrl: string | null;
  /** Average progress across enrolled programs, 0-100. Always > 0. */
  progress: number;
  context: string | null;
}

export interface OrgDashboardNeedsAttention {
  userId: string;
  name: string;
  avatarUrl: string | null;
  reason: string;
  /** Supporting detail, e.g. "Invited 9 days ago" / "Last active Jun 28". */
  context: string | null;
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
  topPerformers: OrgDashboardTopPerformer[];
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
  /**
   * Student profile completeness 0-100, from `student_profiles.completionPercentage`.
   * 0 when the student has no profile row yet. Same source as the dashboard's
   * `avgProfileCompletion`, so the two always agree.
   */
  profileCompletion: number;
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
  /** Admissions course progress, 0-100. */
  progress: number;
  /** Lessons completed vs. active lessons in the Admissions course. */
  lessons: { completed: number; total: number };
  /** Total Admissions lesson time watched, in SECONDS. */
  totalTimeWatched: number;
  /** ISO timestamp of last Admissions activity; null when there is none. */
  lastWatchedAt: string | null;
  /**
   * Dead field — application creation was never adopted by users. Kept so
   * existing consumers keep compiling; don't build new UI on it.
   */
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

/**
 * AI Major Match. Null when the student has never completed an assessment —
 * that's what gates the Major Match tab (Major Match has no "enrolment", so
 * presence of assessments is the only meaningful signal).
 */
export interface StudentMajorMatchProgram {
  assessments: number;
  latestRiasecCode: string | null;
  lastCompletedAt: string | null;
}

export interface StudentProgramsResponse {
  admissions: StudentAdmissionsProgram | null;
  sat: StudentSatProgram | null;
  research: StudentResearchProgram | null;
  fullSupport: StudentFullSupportProgram | null;
  community: StudentCommunityProgram;
  majorMatch: StudentMajorMatchProgram | null;
}

export interface GetStudentProgramsArgs {
  orgId: string;
  userId: string;
}

// ── Per-program DETAIL drill-downs ──────────────────────────────────────────
// Three read-only endpoints backing the per-program tabs on the student
// profile. All are org-scoped (OrgScopeGuard + @OrgRoles(OWNER, COUNSELOR))
// and additionally re-verify the target student's membership server-side.

/** `GET /org/:orgId/students/:userId/sat-progress` */
export interface StudentSatDetailArgs {
  orgId: string;
  userId: string;
}

/**
 * SAT composite. `estimatedScore` is a 200–800 PER-SECTION score, so `total`
 * (400–1600) exists only when BOTH sections have been mocked — never infer a
 * composite from one section.
 */
export interface SatComposite {
  math: number | null;
  readingWriting: number | null;
  total: number | null;
}

export interface SatMasteryRow {
  skill: string;
  domain: string;
  /** 'math' | 'reading-writing' */
  section: string;
  attempts: number;
  correct: number;
  pct: number;
}

export interface SatSessionRow {
  id: string;
  mode: 'mock' | 'pack' | 'practice';
  section: string;
  title: string;
  totalQ: number;
  correctQ: number;
  durationSec: number;
  /** 200–800, mock mode only. */
  estimatedScore: number | null;
  completedAt: string;
}

export interface StudentSatDetail {
  enrolled: boolean;
  composite: SatComposite;
  personalBest: { score: number; title: string; completedAt: string } | null;
  lastSession: SatSessionRow | null;
  streak: { count: number; lastPracticeDate: string | null };
  focusArea: SatMasteryRow | null;
  masteryRows: SatMasteryRow[];
  recentSessions: SatSessionRow[];
  mockSessions: SatSessionRow[];
  packSessions: SatSessionRow[];
}

/** `GET /org/:orgId/students/:userId/research` — null when never enrolled. */
export interface StudentResearchDetailArgs {
  orgId: string;
  userId: string;
}

export type ResearchSubmissionStatus =
  | 'submitted'
  | 'under_review'
  | 'graded'
  | 'returned_for_revision';

export type ResearchWeekLockReason =
  | 'previous-week-not-submitted'
  | 'video-lessons-incomplete'
  | 'quiz-not-passed'
  | 'module-locked';

/** Quiz question with the answer key stripped server-side (no correctIndex). */
export interface ResearchQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  hint?: string;
}

export interface ResearchWeek {
  id: string;
  weekNumber: number;
  title: string;
  tagline: string;
  videoLessons: { id: string; title: string; durationSeconds: number }[];
  quiz: { id: string; title: string; questions: ResearchQuizQuestion[] };
  assignment: { id: string; title: string; instructionsMd: string };
}

export interface ResearchWeekLockState {
  weekId: string;
  weekNumber: number;
  weekLocked: boolean;
  weekLockReason?: ResearchWeekLockReason;
  videos: Record<string, { completed: boolean; progressPercent: number }>;
  quiz: {
    locked: boolean;
    passed: boolean;
    bestScorePercent: number;
    attempts: number;
    lockReason?: ResearchWeekLockReason;
  };
  assignment: {
    locked: boolean;
    submissionStatus: ResearchSubmissionStatus | 'none';
    lockReason?: ResearchWeekLockReason;
  };
}

export interface ResearchSubmission {
  id: string;
  weekNumber: number;
  weekTitle: string;
  attemptNumber: number;
  status: ResearchSubmissionStatus;
  submittedAt: string;
  gradedAt?: string;
  gradedByName?: string;
  feedbackMd?: string;
  score?: number;
  fileName?: string;
  fileUrl?: string;
}

export interface StudentResearchDetail {
  enrolled: boolean;
  summary: {
    weeksCompleted: number;
    overallPercent: number;
    currentWeekNumber: number;
    totalAssignmentsGraded: number;
    totalAssignmentsPending: number;
  };
  weeks: ResearchWeek[];
  lockState: ResearchWeekLockState[];
  submissions: ResearchSubmission[];
}

/** `GET /org/:orgId/students/:userId/full-support` — null when not enrolled. */
export interface StudentFullSupportDetailArgs {
  orgId: string;
  userId: string;
}

export interface FullSupportMentor {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

export interface FullSupportSession {
  id: string;
  dateTime: string;
  /** Raw string, e.g. '1h' / '1.5h'. */
  duration: string;
  description: string;
  done: boolean;
  meetingLink: string | null;
}

/**
 * Both figures are LIFETIME totals — the schema has no allocation column and no
 * monthly bucket, so never label these "this month" or "allocated".
 */
export interface FullSupportHours {
  completed: number;
  logged: number;
}

export interface FullSupportMilestone {
  id: string;
  label: string;
  date: string | null;
  done: boolean;
}

export interface FullSupportPipelineRow {
  id: string;
  program: string;
  stage: string;
  status: string;
  aid: boolean;
  deadline: string | null;
}

export interface StudentFullSupportDetail {
  enrolled: boolean;
  mentor: FullSupportMentor | null;
  sessions: FullSupportSession[];
  hours: FullSupportHours;
  milestones: FullSupportMilestone[];
  pipeline: FullSupportPipelineRow[];
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
  /** `smallint` on the backend — a NUMBER, never a string like "11th". */
  gradeLevel: number | null;
  graduationYear: number | null;
  invitedBy: string | null;
  expiresAt: string | null;
  createdAt: string;
  /** When the invite email actually left the server. `null` = never sent. */
  emailSentAt: string | null;
  /**
   * Why the last send attempt failed. When this is set the invitee NEVER got
   * the email — the console must surface it rather than implying success.
   */
  lastEmailError: string | null;
}

export interface OrgInvitationsResponse {
  items: OrgInvitation[];
  total: number;
  page: number;
  limit: number;
}

export interface GetInvitationsArgs {
  orgId: string;
  /**
   * Omit for the actionable list (pending + expired). Accepted and revoked
   * invitations are only returned when asked for by name.
   */
  status?: OrgInvitationStatus | string;
  /** Splits the Students and Staff invitation tabs. */
  role?: OrgMembershipRole;
  page?: number;
  limit?: number;
}

/** Body of `POST /org/:orgId/invitations`. */
export interface CreateInvitationBody {
  email: string;
  role: OrgMembershipRole;
  name?: string;
  /** `@IsInt() @Min(1) @Max(13)` server-side — send a number or omit it. */
  gradeLevel?: number;
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
  /**
   * The invitations that were actually created — an ARRAY of rows, not a
   * count. Render `created.length`; rendering the array itself throws.
   */
  created: OrgInvitation[];
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
  /** Profile photo. Null when the student has never uploaded one — the avatar
   *  component falls back to initials. */
  avatarUrl: string | null;
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

    // ── Per-program detail drill-downs ────────────────────────────────────────
    getStudentSatDetail: builder.query<StudentSatDetail, StudentSatDetailArgs>({
      query: ({ orgId, userId }) => ({
        url: `/org/${encodeURIComponent(orgId)}/students/${encodeURIComponent(userId)}/sat-progress`,
        method: 'GET',
      }),
      providesTags: (_res, _err, { userId }) => [
        { type: 'CounselorStudentPrograms' as const, id: userId },
      ],
    }),

    getStudentResearchDetail: builder.query<
      StudentResearchDetail | null,
      StudentResearchDetailArgs
    >({
      query: ({ orgId, userId }) => ({
        url: `/org/${encodeURIComponent(orgId)}/students/${encodeURIComponent(userId)}/research`,
        method: 'GET',
      }),
      providesTags: (_res, _err, { userId }) => [
        { type: 'CounselorStudentPrograms' as const, id: userId },
      ],
    }),

    getStudentFullSupportDetail: builder.query<
      StudentFullSupportDetail | null,
      StudentFullSupportDetailArgs
    >({
      query: ({ orgId, userId }) => ({
        url: `/org/${encodeURIComponent(orgId)}/students/${encodeURIComponent(userId)}/full-support`,
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
      query: ({ orgId, status, role, page, limit }) => ({
        url: `/org/${encodeURIComponent(orgId)}/invitations`,
        method: 'GET',
        params: {
          ...(status ? { status } : {}),
          ...(role ? { role } : {}),
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

    /**
     * Soft-removes the invitation record entirely (204). Distinct from
     * `revokeInvitation`, which only flips the status and leaves the row in
     * place — this is how a counselor clears a dead invite for good.
     */
    deleteInvitation: builder.mutation<void, InvitationMutationArgs>({
      query: ({ orgId, id }) => ({
        url: `/org/${encodeURIComponent(orgId)}/invitations/${encodeURIComponent(id)}`,
        method: 'DELETE',
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
        { type: 'CounselorAudit' as const, id: orgId },
        { type: 'CounselorAudit' as const, id: targetOrgId },
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
  useGetStudentSatDetailQuery,
  useGetStudentResearchDetailQuery,
  useGetStudentFullSupportDetailQuery,
  useRemoveStudentMutation,
  useSearchOrgUsersQuery,
  useAddOrgMemberMutation,
  useGetInvitationsQuery,
  useCreateInvitationMutation,
  useBulkInviteMutation,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
  useDeleteInvitationMutation,
  useArchiveStudentMutation,
  useTransferStudentMutation,
} = counselorConsoleApi;
