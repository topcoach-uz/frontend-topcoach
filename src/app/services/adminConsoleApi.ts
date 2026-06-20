import { RtkApi } from './api';

export type AdminDashboardStats = {
  kpis: {
    totalStudents: number;
    activeMentors: number;
    sessionsThisMonth: number;
    pendingPaymentsSum: number;
    pendingPaymentsCount: number;
  };
  recentSessionFlags: Array<{
    id: string;
    title: string;
    pair: string;
    time: string;
    tag: 'Cancel' | 'Delay';
  }>;
  topMentors: Array<{
    id: string;
    name: string;
    roleLabel: string;
    type: 'Career' | 'Tech' | 'Leadership' | 'Business' | 'General';
    sessions: number;
    score: number;
  }>;
};

export type AdminDirectoryRow = {
  id: string;
  displayName: string;
  email: string;
  username: string;
  platformRole: 'Student' | 'Mentor' | 'SchoolCounselor';
  managementRole: string | null;
  isMentorAndAdmin: boolean;
  orgLabel: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  communityMode: 'community' | 'standard';
  communityAccess: boolean;
  programLabel: string | null;
  enrollmentStatus: 'active' | 'on_hold' | 'graduated' | 'at_risk';
  sessionsDone: number;
  sessionsPlanned: number;
  assignedMenteeCount?: number;
  mentorTier?: 'Junior' | 'Senior' | 'Expert';
  telegramConnected?: boolean;
};

export type AdminDirectoryResponse = {
  items: AdminDirectoryRow[];
  total: number;
  page: number;
  pageSize: number;
  telegramProfilesTotal: number;
};

export type AdminDirectoryQuery = {
  role?: 'mentees' | 'mentors' | 'counselors' | 'admins' | 'all';
  search?: string;
  program?: string;
  community?: 'all' | 'community' | 'standard';
  managementRole?: 'all' | 'any' | 'none';
  page?: number;
  pageSize?: number;
};

export type AdminPaymentRow = {
  id: string;
  amount: number;
  status: string;
  method: string | null;
  type: string | null;
  transactionId: string | null;
  notes?: string | null;
  createdAt: string;
  user?: { id: string; email: string; profile?: { name?: string | null } } | null;
};

// ─────────────── Subscriptions ───────────────

export type AdminSubscriptionStatus =
  | 'pending'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

export type AdminSubscriptionRow = {
  id: string;
  status: AdminSubscriptionStatus;
  planName: string | null;
  planPeriod: 'monthly' | 'yearly' | null;
  userId: string;
  userEmail: string | null;
  /** Telegram-connected phone number from `users.phoneNumber`. */
  userPhoneNumber: string | null;
  paymentMethodId: string | null;
  cardLast4: string | null;
  cardProvider: string | null;
  startDate: string;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  failedAttemptsInCycle: number;
  nextRetryAt: string | null;
  createdAt: string;
};

export type AdminSubscriptionAttempt = {
  id: string;
  status: 'pending' | 'success' | 'failed';
  provider: string | null;
  amountUzs: number;
  amountUsd: number | null;
  attemptNumber: number;
  idempotencyKey: string;
  providerPaymentId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type AdminSubscriptionEvent = {
  id: string;
  type: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AdminSubscriptionDetail = AdminSubscriptionRow & {
  attempts: AdminSubscriptionAttempt[];
  events: AdminSubscriptionEvent[];
};

export type AdminSubscriptionsQuery = {
  status?: AdminSubscriptionStatus[] | AdminSubscriptionStatus;
  planId?: string;
  userId?: string;
  createdSince?: string;
  createdUntil?: string;
  q?: string;
  page?: number;
  limit?: number;
};

export type AdminSubscriptionStats = {
  byStatus: Partial<Record<AdminSubscriptionStatus, number>>;
  mrrUsd: number;
  mrrUzs: number;
  charges24h: number;
  failures24h: number;
  pastDueOverdue: number;
  generatedAt: string;
};

export type AdminSubscriptionPlanRow = {
  id: string;
  name: string;
  period: 'monthly' | 'yearly';
  billingPeriodDays: number;
  trialDays: number;
  price: number;
  isActive: boolean;
  displayName?: Record<string, string> | null;
  descriptionI18n?: Record<string, string> | null;
  description?: string | null;
  features?: Record<string, unknown> | null;
  currency?: { id: string; code: string; symbol?: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminSubscriptionPlanInput = {
  name: string;
  period: 'monthly' | 'yearly';
  billingPeriodDays: number;
  trialDays: number;
  price: number;
  isActive?: boolean;
  displayName?: Record<string, string>;
  descriptionI18n?: Record<string, string>;
  description?: string;
  features?: Record<string, unknown>;
};

export type AdminSessionsOverview = {
  kpis: {
    upcomingCount: number;
    completedMonth: number;
    cancelledMonth: number;
    flaggedMonth: number;
  };
  upcoming: Array<{
    id: string;
    dateTime: string;
    mentorName: string;
    studentName: string;
    type: string;
  }>;
  flagged: Array<{
    id: string;
    title: string;
    pair: string;
    time: string;
    tag: 'Cancel' | 'Delay';
    reason: string | null;
  }>;
  reports: Array<{
    id: string;
    dateTime: string;
    mentorName: string;
    studentName: string;
    type: string;
    topicsCovered: string;
    notes: string;
    homework: string | null;
    rating: string | null;
    submittedAt: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    completed: number;
    cancelled: number;
    delayed: number;
  }>;
};

export type AdminUserDetailSession = {
  id: string;
  type: string;
  date: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'delayed';
  role?: 'mentor' | 'participant';
  otherPartyName?: string | null;
  cancelReason?: string | null;
};

export type AdminUserDetailEnrollment = {
  id: string;
  programLabel: string;
  status: string;
  paymentStatus: string;
  enrolledAt?: string | null;
  accessGrantedAt?: string | null;
  amount?: number | null;
};

export type AdminUserDetailPayment = {
  id: string;
  amount: number;
  status: string;
  method?: string | null;
  type?: string | null;
  createdAt?: string | null;
};

export type AdminUserDetailOrganization = {
  id: string;
  name: string;
  memberRole: string;
};

export type AdminUserDetailMentorProfile = {
  title?: string | null;
  summary?: string | null;
  university?: string | null;
  major?: string | null;
  level?: string | null;
  status?: string | null;
  visibleOnMentorsPage?: boolean | null;
};

export type AdminUserDetail = {
  id: string;
  email: string;
  displayName: string;
  platformRole: 'Student' | 'Mentor' | 'SchoolCounselor' | 'Unknown';
  managementRole?: string | null;
  phoneNumber?: string | null;
  location?: string | null;
  bio?: string | null;
  createdAt: string;
  lastActiveAt?: string | null;
  mentorProfile?: AdminUserDetailMentorProfile | null;
  sessionStats: {
    upcoming: number;
    completed: number;
    cancelled: number;
    delayed: number;
    total: number;
  };
  recentSessions: AdminUserDetailSession[];
  enrollments: AdminUserDetailEnrollment[];
  recentPayments: AdminUserDetailPayment[];
  organizations: AdminUserDetailOrganization[];
};

export type AdminMajorMatchPolicy = {
  id: string;
  isActive: boolean;
  freeSuccessfulAttempts: number;
  blockAfterFreeAttempts: boolean;
  promptTitle: string;
  promptMessage: string;
  updatedAt: string;
};

export type AdminMajorMatchUsageRow = {
  userId: string;
  email: string;
  displayName: string;
  startedAttempts: number;
  completedAttempts: number;
  successfulAttempts: number;
  blockedAttempts: number;
  lastAttemptAt: string | null;
  lastSuccessfulAt: string | null;
  lastBlockedAt: string | null;
};

export type AdminMajorMatchUsageResponse = {
  items: AdminMajorMatchUsageRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminMajorMatchHistoryRow = {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  riasecCode: string;
  completedAt: string;
  createdAt: string;
  topMajors: string[];
};

export type AdminMajorMatchHistoryResponse = {
  items: AdminMajorMatchHistoryRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminMajorMatchHistoryDetail = {
  id: string;
  createdAt: string;
  completedAt: string;
  user: { id: string; email: string; displayName: string };
  riasecCode: string;
  riasecScores: Record<string, number>;
  bigFiveScores: Record<string, number>;
  valuesScores: Record<string, number>;
  workStyleProfile: unknown;
  academicConfidenceScore: number | null;
  riskFlags: unknown[];
  metadata: Record<string, unknown>;
};

export type AdminEventRow = {
  id: string;
  title: string | Record<string, string> | null;
  startDate: string | null;
  endDate: string | null;
  type: string;
  price: number;
  maxParticipants?: number;
  currentParticipants?: number;
  createdAt: string;
};

function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in (res as object)) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const adminConsoleApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboardStats: builder.query<AdminDashboardStats, void>({
      query: () => ({ url: '/admin/dashboard/stats', method: 'GET' }),
      transformResponse: (res: unknown) => unwrap<AdminDashboardStats>(res),
      providesTags: ['AdminConsoleDashboard'],
    }),

    getAdminUsersDirectory: builder.query<AdminDirectoryResponse, AdminDirectoryQuery>({
      query: (params) => ({
        url: '/admin/users/directory',
        method: 'GET',
        params,
      }),
      transformResponse: (res: unknown) => {
        const raw = unwrap<Partial<AdminDirectoryResponse>>(res);
        return {
          items: raw.items ?? [],
          total: raw.total ?? 0,
          page: raw.page ?? 1,
          pageSize: raw.pageSize ?? 20,
          telegramProfilesTotal: raw.telegramProfilesTotal ?? 0,
        };
      },
      providesTags: ['AdminConsoleDirectory'],
    }),

    getAdminPayments: builder.query<
      { items: AdminPaymentRow[]; total: number },
      { start?: number; end?: number } | void
    >({
      query: (params) => {
        const start = params?.start ?? 0;
        const end = params?.end ?? 100;
        return {
          url: '/admin/payments',
          method: 'GET',
          params: { _start: String(start), _end: String(end), _sort: 'createdAt', _order: 'DESC' },
        };
      },
      transformResponse: (res: unknown) => {
        const raw = res as { data?: AdminPaymentRow[]; total?: number } | AdminPaymentRow[];
        if (Array.isArray(raw)) return { items: raw, total: raw.length };
        return { items: raw?.data ?? [], total: raw?.total ?? 0 };
      },
      providesTags: ['AdminConsolePayments'],
    }),

    getAdminSessionsOverview: builder.query<AdminSessionsOverview, void>({
      query: () => ({ url: '/admin/sessions/overview', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = unwrap<Partial<AdminSessionsOverview>>(res);
        return {
          kpis: raw.kpis ?? { upcomingCount: 0, completedMonth: 0, cancelledMonth: 0, flaggedMonth: 0 },
          upcoming: raw.upcoming ?? [],
          flagged: raw.flagged ?? [],
          reports: raw.reports ?? [],
          monthlyTrend: raw.monthlyTrend ?? [],
        };
      },
      providesTags: ['AdminConsoleSessions'],
    }),

    getAdminUserDetail: builder.query<AdminUserDetail, string>({
      query: (id) => ({ url: `/admin/users/${id}/detail`, method: 'GET' }),
      transformResponse: (res: unknown) => unwrap<AdminUserDetail>(res),
      providesTags: (_result, _err, id) => [{ type: 'AdminConsoleUserDetail', id }],
    }),

    getAdminMajorMatchPolicy: builder.query<AdminMajorMatchPolicy, void>({
      query: () => ({ url: '/admin/major-match/policy', method: 'GET' }),
      transformResponse: (res: unknown) => unwrap<AdminMajorMatchPolicy>(res),
      providesTags: ['AdminMajorMatchPolicy'],
    }),

    updateAdminMajorMatchPolicy: builder.mutation<
      AdminMajorMatchPolicy,
      Partial<Pick<AdminMajorMatchPolicy, 'freeSuccessfulAttempts' | 'blockAfterFreeAttempts' | 'promptTitle' | 'promptMessage'>>
    >({
      query: (body) => ({ url: '/admin/major-match/policy', method: 'PUT', body }),
      transformResponse: (res: unknown) => unwrap<AdminMajorMatchPolicy>(res),
      invalidatesTags: ['AdminMajorMatchPolicy'],
    }),

    getAdminMajorMatchUsage: builder.query<
      AdminMajorMatchUsageResponse,
      { search?: string; page?: number; pageSize?: number; onlyBlocked?: boolean } | void
    >({
      query: (params) => ({ url: '/admin/major-match/usage', method: 'GET', params: params ?? {} }),
      transformResponse: (res: unknown) => {
        const raw = unwrap<Partial<AdminMajorMatchUsageResponse>>(res);
        return {
          items: raw.items ?? [],
          total: raw.total ?? 0,
          page: raw.page ?? 1,
          pageSize: raw.pageSize ?? 25,
        };
      },
      providesTags: ['AdminMajorMatchUsage'],
    }),

    resetAdminMajorMatchUser: builder.mutation<{ userId: string; reset: boolean }, string>({
      query: (userId) => ({
        url: `/admin/major-match/usage/reset/${encodeURIComponent(userId)}`,
        method: 'POST',
      }),
      transformResponse: (res: unknown) => unwrap<{ userId: string; reset: boolean }>(res),
      invalidatesTags: ['AdminMajorMatchUsage'],
    }),

    resetAdminMajorMatchAll: builder.mutation<{ resetCount: number }, void>({
      query: () => ({ url: '/admin/major-match/usage/reset-all', method: 'POST' }),
      transformResponse: (res: unknown) => unwrap<{ resetCount: number }>(res),
      invalidatesTags: ['AdminMajorMatchUsage'],
    }),

    getAdminMajorMatchHistory: builder.query<
      AdminMajorMatchHistoryResponse,
      { search?: string; page?: number; pageSize?: number } | void
    >({
      query: (params) => ({ url: '/admin/major-match/history', method: 'GET', params: params ?? {} }),
      transformResponse: (res: unknown) => {
        const raw = unwrap<Partial<AdminMajorMatchHistoryResponse>>(res);
        return {
          items: raw.items ?? [],
          total: raw.total ?? 0,
          page: raw.page ?? 1,
          pageSize: raw.pageSize ?? 25,
        };
      },
      providesTags: ['AdminMajorMatchHistory'],
    }),

    getAdminMajorMatchHistoryDetail: builder.query<AdminMajorMatchHistoryDetail, string>({
      query: (id) => ({ url: `/admin/major-match/history/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown) => unwrap<AdminMajorMatchHistoryDetail>(res),
      providesTags: (_r, _e, id) => [{ type: 'AdminMajorMatchHistory', id }],
    }),

    getAdminEvents: builder.query<
      { items: AdminEventRow[]; total: number },
      { start?: number; end?: number } | void
    >({
      query: (params) => {
        const start = params?.start ?? 0;
        const end = params?.end ?? 100;
        return {
          url: '/admin/events',
          method: 'GET',
          params: { _start: String(start), _end: String(end), _sort: 'createdAt', _order: 'DESC' },
        };
      },
      transformResponse: (res: unknown) => {
        const raw = res as { data?: AdminEventRow[]; total?: number } | AdminEventRow[];
        if (Array.isArray(raw)) return { items: raw, total: raw.length };
        return { items: raw?.data ?? [], total: raw?.total ?? 0 };
      },
      providesTags: ['AdminConsoleEvents'],
    }),

    // ─────────────── Subscriptions ───────────────

    getAdminSubscriptions: builder.query<
      { items: AdminSubscriptionRow[]; total: number; page: number; limit: number },
      AdminSubscriptionsQuery | void
    >({
      query: (params) => ({
        url: '/admin/subscriptions',
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (res: unknown) => {
        const raw = unwrap<Partial<{ items: AdminSubscriptionRow[]; total: number; page: number; limit: number }>>(res);
        return {
          items: raw.items ?? [],
          total: raw.total ?? 0,
          page: raw.page ?? 1,
          limit: raw.limit ?? 25,
        };
      },
      providesTags: ['AdminConsoleSubscriptions'],
    }),

    getAdminSubscriptionStats: builder.query<AdminSubscriptionStats, void>({
      query: () => ({ url: '/admin/subscriptions/stats', method: 'GET' }),
      transformResponse: (res: unknown) => unwrap<AdminSubscriptionStats>(res),
      providesTags: ['AdminConsoleSubscriptionStats'],
    }),

    getAdminSubscriptionDetail: builder.query<AdminSubscriptionDetail, string>({
      query: (id) => ({ url: `/admin/subscriptions/${id}`, method: 'GET' }),
      transformResponse: (res: unknown) => unwrap<AdminSubscriptionDetail>(res),
      providesTags: (_r, _e, id) => [{ type: 'AdminConsoleSubscriptions', id }],
    }),

    extendAdminSubscription: builder.mutation<unknown, { id: string; days: number }>({
      query: ({ id, days }) => ({
        url: `/admin/subscriptions/${id}/extend`,
        method: 'POST',
        body: { days },
      }),
      invalidatesTags: ['AdminConsoleSubscriptions', 'AdminConsoleSubscriptionStats'],
    }),

    forceChargeAdminSubscription: builder.mutation<unknown, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/subscriptions/${id}/force-charge`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminConsoleSubscriptions', 'AdminConsoleSubscriptionStats'],
    }),

    cancelAdminSubscription: builder.mutation<
      unknown,
      { id: string; reason?: string; immediate?: boolean }
    >({
      query: ({ id, reason, immediate }) => ({
        url: `/admin/subscriptions/${id}/cancel`,
        method: 'POST',
        body: { reason, immediate },
      }),
      invalidatesTags: ['AdminConsoleSubscriptions', 'AdminConsoleSubscriptionStats'],
    }),

    // ─────────────── Subscription Plans (CRUD) ───────────────
    // Uses the generic /admin/subscription-plans endpoints (Crud decorator
    // on the backend — list/create/update/delete shapes are standard).

    getAdminSubscriptionPlans: builder.query<
      { items: AdminSubscriptionPlanRow[]; total: number },
      void
    >({
      query: () => ({ url: '/admin/subscription-plans', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res as
          | { data?: AdminSubscriptionPlanRow[]; total?: number }
          | AdminSubscriptionPlanRow[];
        if (Array.isArray(raw)) return { items: raw, total: raw.length };
        return { items: raw?.data ?? [], total: raw?.total ?? 0 };
      },
      providesTags: ['AdminConsoleSubscriptionPlans'],
    }),

    createAdminSubscriptionPlan: builder.mutation<
      AdminSubscriptionPlanRow,
      AdminSubscriptionPlanInput
    >({
      query: (body) => ({ url: '/admin/subscription-plans', method: 'POST', body }),
      invalidatesTags: ['AdminConsoleSubscriptionPlans'],
    }),

    updateAdminSubscriptionPlan: builder.mutation<
      AdminSubscriptionPlanRow,
      { id: string; patch: Partial<AdminSubscriptionPlanInput> }
    >({
      query: ({ id, patch }) => ({
        url: `/admin/subscription-plans/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['AdminConsoleSubscriptionPlans'],
    }),

    deleteAdminSubscriptionPlan: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/admin/subscription-plans/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminConsoleSubscriptionPlans'],
    }),
  }),
});

export const {
  useGetAdminDashboardStatsQuery,
  useGetAdminUsersDirectoryQuery,
  useGetAdminPaymentsQuery,
  useGetAdminSessionsOverviewQuery,
  useGetAdminEventsQuery,
  useGetAdminUserDetailQuery,
  useGetAdminMajorMatchPolicyQuery,
  useUpdateAdminMajorMatchPolicyMutation,
  useGetAdminMajorMatchUsageQuery,
  useResetAdminMajorMatchUserMutation,
  useResetAdminMajorMatchAllMutation,
  useGetAdminMajorMatchHistoryQuery,
  useGetAdminMajorMatchHistoryDetailQuery,
  useGetAdminSubscriptionsQuery,
  useGetAdminSubscriptionStatsQuery,
  useGetAdminSubscriptionDetailQuery,
  useExtendAdminSubscriptionMutation,
  useForceChargeAdminSubscriptionMutation,
  useCancelAdminSubscriptionMutation,
  useGetAdminSubscriptionPlansQuery,
  useCreateAdminSubscriptionPlanMutation,
  useUpdateAdminSubscriptionPlanMutation,
  useDeleteAdminSubscriptionPlanMutation,
} = adminConsoleApi;
