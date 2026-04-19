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
  }),
});

export const {
  useGetAdminDashboardStatsQuery,
  useGetAdminUsersDirectoryQuery,
  useGetAdminPaymentsQuery,
  useGetAdminSessionsOverviewQuery,
  useGetAdminEventsQuery,
  useGetAdminUserDetailQuery,
} = adminConsoleApi;
