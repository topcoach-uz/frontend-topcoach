import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import { recoverDocumentRead, isRecoverableDocumentRead } from '../student-hub/documentReadRecovery';
import { ACCESS_TOKEN } from 'src/constants/storage';
import { LANGUAGE } from 'src/constants/storage';
import { apiTagTypes, baseUrl } from './const';

// Create our baseQuery instance
const baseQuery = fetchBaseQuery({
  baseUrl: baseUrl,
  prepareHeaders: (headers) => {
    // By default, if we have a token in the store, let's use that for authenticated requests
    const token = localStorage.getItem(ACCESS_TOKEN);
    const language = localStorage.getItem(LANGUAGE) || 'en';

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    headers.set('language', language);

    return headers;
  },
  timeout: 30000, // 30 seconds timeout
});

// Create a separate base query for video uploads with longer timeout
const videoUploadBaseQuery = fetchBaseQuery({
  baseUrl: baseUrl,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
  timeout: 300000, // 5 minutes timeout for video uploads
});

export { baseQuery, videoUploadBaseQuery };

const baseQueryWithRetry = retry(baseQuery, { maxRetries: 0 });
// Keep automatic replay limited to these safe GETs; review submissions/uploads
// must never be duplicated after an uncertain network response.
const baseQueryWithDocumentRecovery: typeof baseQuery = (args, api, options) => {
  const url = typeof args === 'string' ? args : args.url;
  const method = typeof args === 'string' ? 'GET' : (args.method ?? 'GET');
  const documentRead = isRecoverableDocumentRead(url, method);
  return documentRead
    ? recoverDocumentRead(async () => {
        // Keep the deadline active through body reading. RTK's own timer ends
        // at headers and aborts the whole query, so isolate each attempt here.
        const controller = new AbortController();
        const abort = () => controller.abort();
        api.signal.addEventListener('abort', abort, { once: true });
        if (api.signal.aborted) abort();
        let timedOut = false;
        const deadline = setTimeout(() => {
          timedOut = true;
          abort();
        }, 10000);
        try {
          const result = await baseQuery(
            { ...(typeof args === 'string' ? { url: args } : args), timeout: 0 },
            { ...api, signal: controller.signal, abort },
            options,
          );
          return timedOut
            ? { error: { status: 'TIMEOUT_ERROR' as const, error: 'Document read attempt timed out' }, meta: result.meta }
            : result;
        } finally {
          clearTimeout(deadline);
          api.signal.removeEventListener('abort', abort);
        }
      }, api.signal)
    : baseQueryWithRetry(args, api, options);
};

/**
 * Create a base API to inject endpoints into elsewhere.
 * Components using this API should import from the injected site,
 * in order to get the appropriate types,
 * and to ensure that the file injecting the endpoints is loaded
 */
export const RtkApi = createApi({
  /**
   * `reducerPath` is optional and will not be required by most users.
   * This is useful if you have multiple API definitions,
   * e.g. where each has a different domain, with no interaction between endpoints.
   * Otherwise, a single API definition should be used in order to support tag invalidation,
   * among other features
   */
  // reducerPath: "splitApi",
  /**
   * A bare bones base query would just be `baseQuery: fetchBaseQuery({ baseUrl: '/' })`
   */
  baseQuery: baseQueryWithDocumentRecovery,
  /**
   * Tag types must be defined in the original API definition
   * for any tags that would be provided by injected endpoints
   */
  tagTypes: apiTagTypes,
  /**
   * This api has endpoints injected in adjacent files,
   * which is why no endpoints are shown below.
   * If you want all endpoints defined in the same file, they could be included here instead
   */
  endpoints: () => ({}),
});

export const enhancedApi = RtkApi.enhanceEndpoints({
  endpoints: () => ({
    getPost: () => 'test',
  }),
});

export const plansApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentPlans: builder.query<any[], void>({
      query: () => 'payments/plans',
    }),
  }),
});

export const { useGetPaymentPlansQuery } = plansApi;

// Subscription RTK Query slice removed — the legacy plan-quota gate is
// gone (sessions are paid per booking; AI search uses its own Redis
// limiter via the backend). Phase 2+ will introduce a fresh slice for
// the new Community-plan checkout under `/payments/*`.

// ========================================
// 🎓 STUDENT HUB API SERVICES
// ========================================
// Import types from student-hub
import {
  DashboardStats,
  Notification,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  ProgressTracking,
  CreateProgressTrackingRequest,
  UpdateProgressTrackingRequest,
  UserPreferences,
  UpdateUserPreferencesRequest,
  StudentProfile,
  CreateStudentProfileRequest,
  UpdateStudentProfileRequest,
  CollegeApplication,
  CreateCollegeApplicationRequest,
  UpdateCollegeApplicationRequest,
  ApplicationTask,
  CreateApplicationTaskRequest,
  UpdateApplicationTaskRequest,
  ScholarshipApplication,
  CreateScholarshipApplicationRequest,
  UpdateScholarshipApplicationRequest,
  StudentEssay,
  CreateStudentEssayRequest,
  UpdateStudentEssayRequest,
  PaginatedResponse,
  ApiResponse,
} from '../student-hub/types';

// Re-export types for external use
export type {
  DashboardStats,
  Notification,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  ProgressTracking,
  CreateProgressTrackingRequest,
  UpdateProgressTrackingRequest,
  UserPreferences,
  UpdateUserPreferencesRequest,
  StudentProfile,
  CreateStudentProfileRequest,
  UpdateStudentProfileRequest,
  CollegeApplication,
  CreateCollegeApplicationRequest,
  UpdateCollegeApplicationRequest,
  ApplicationTask,
  CreateApplicationTaskRequest,
  UpdateApplicationTaskRequest,
  ScholarshipApplication,
  CreateScholarshipApplicationRequest,
  UpdateScholarshipApplicationRequest,
  StudentEssay,
  CreateStudentEssayRequest,
  UpdateStudentEssayRequest,
  PaginatedResponse,
  ApiResponse,
};

// Student Hub Dashboard API
export const studentHubDashboardApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get dashboard stats
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => ({
        url: '/student-hub/dashboard',
        method: 'GET',
      }),
      providesTags: [
        'StudentProfile',
        'CollegeApplications',
        'ApplicationTasks',
        'ScholarshipApplications',
        'StudentEssays',
        'Notifications',
        'ProgressTracking',
        'UserPreferences',
      ],
    }),

    // Get notifications
    getNotifications: builder.query<PaginatedResponse<Notification>, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: '/notifications',
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['Notifications'],
    }),

    // Get unread notification count
    getUnreadNotificationCount: builder.query<{ count: number }, void>({
      query: () => ({
        url: '/notifications/unread-count',
        method: 'GET',
      }),
      providesTags: ['Notifications'],
    }),

    // Mark notification as read
    markNotificationAsRead: builder.mutation<void, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),

    // Get progress tracking
    getProgressTracking: builder.query<ProgressTracking[], void>({
      query: () => ({
        url: '/progress-tracking',
        method: 'GET',
      }),
      providesTags: ['ProgressTracking'],
    }),

    // Create progress tracking
    createProgressTracking: builder.mutation<ProgressTracking, CreateProgressTrackingRequest>({
      query: (data) => ({
        url: '/progress-tracking',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ProgressTracking'],
    }),

    // Update progress tracking
    updateProgressTracking: builder.mutation<ProgressTracking, { id: string; data: UpdateProgressTrackingRequest }>({
      query: ({ id, data }) => ({
        url: `/progress-tracking/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['ProgressTracking'],
    }),

    // Get user preferences
    getUserPreferences: builder.query<UserPreferences, void>({
      query: () => ({
        url: '/user-preferences',
        method: 'GET',
      }),
      providesTags: ['UserPreferences'],
    }),

    // Update user preferences
    updateUserPreferences: builder.mutation<UserPreferences, UpdateUserPreferencesRequest>({
      query: (data) => ({
        url: '/user-preferences',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['UserPreferences'],
    }),
  }),
});

// Student Profile API - REMOVED (using student-hub API instead)

// Application Tracking API
export const applicationTrackingApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get college applications
    getCollegeApplications: builder.query<PaginatedResponse<CollegeApplication>, void>({
      query: () => ({
        url: '/application-tracking/college-applications',
        method: 'GET',
      }),
      providesTags: ['CollegeApplications'],
    }),

    // Create college application
    createCollegeApplication: builder.mutation<CollegeApplication, CreateCollegeApplicationRequest>({
      query: (data) => ({
        url: '/application-tracking/college-applications',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CollegeApplications'],
    }),

    // Update college application
    updateCollegeApplication: builder.mutation<CollegeApplication, { id: string; data: UpdateCollegeApplicationRequest }>({
      query: ({ id, data }) => ({
        url: `/application-tracking/college-applications/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['CollegeApplications'],
    }),

    // Delete college application
    deleteCollegeApplication: builder.mutation<void, string>({
      query: (id) => ({
        url: `/application-tracking/college-applications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CollegeApplications'],
    }),

    // Get application tasks
    getApplicationTasks: builder.query<PaginatedResponse<ApplicationTask>, void>({
      query: () => ({
        url: '/application-tracking/tasks',
        method: 'GET',
      }),
      providesTags: ['ApplicationTasks'],
    }),

    // Create application task
    createApplicationTask: builder.mutation<ApplicationTask, CreateApplicationTaskRequest>({
      query: (data) => ({
        url: '/application-tracking/tasks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ApplicationTasks'],
    }),

    // Update application task
    updateApplicationTask: builder.mutation<ApplicationTask, { id: string; data: UpdateApplicationTaskRequest }>({
      query: ({ id, data }) => ({
        url: `/application-tracking/tasks/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['ApplicationTasks'],
    }),

    // Delete application task
    deleteApplicationTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `/application-tracking/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ApplicationTasks'],
    }),

    // Get scholarship applications
    getScholarshipApplications: builder.query<PaginatedResponse<ScholarshipApplication>, void>({
      query: () => ({
        url: '/application-tracking/scholarship-applications',
        method: 'GET',
      }),
      providesTags: ['ScholarshipApplications'],
    }),

    // Create scholarship application
    createScholarshipApplication: builder.mutation<ScholarshipApplication, CreateScholarshipApplicationRequest>({
      query: (data) => ({
        url: '/application-tracking/scholarship-applications',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ScholarshipApplications'],
    }),

    // Update scholarship application
    updateScholarshipApplication: builder.mutation<ScholarshipApplication, { id: string; data: UpdateScholarshipApplicationRequest }>({
      query: ({ id, data }) => ({
        url: `/application-tracking/scholarship-applications/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['ScholarshipApplications'],
    }),

    // Delete scholarship application
    deleteScholarshipApplication: builder.mutation<void, string>({
      query: (id) => ({
        url: `/application-tracking/scholarship-applications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ScholarshipApplications'],
    }),
  }),
});

// Essay Management API
export const essayManagementApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get student essays
    getStudentEssays: builder.query<PaginatedResponse<StudentEssay>, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: '/essay-management/essays',
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['StudentEssays'],
    }),

    // Create student essay
    createStudentEssay: builder.mutation<StudentEssay, CreateStudentEssayRequest>({
      query: (data) => ({
        url: '/essay-management/essays',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['StudentEssays'],
    }),

    // Update student essay
    updateStudentEssay: builder.mutation<StudentEssay, { id: string; data: UpdateStudentEssayRequest }>({
      query: ({ id, data }) => ({
        url: `/essay-management/essays/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['StudentEssays'],
    }),

    // Delete student essay
    deleteStudentEssay: builder.mutation<void, string>({
      query: (id) => ({
        url: `/essay-management/essays/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StudentEssays'],
    }),
  }),
});

// Export all student hub hooks
export const {
  useGetDashboardStatsQuery,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useGetProgressTrackingQuery,
  useCreateProgressTrackingMutation,
  useUpdateProgressTrackingMutation,
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
} = studentHubDashboardApi;

// Student Profile API exports removed - using student-hub API instead

export const {
  useGetCollegeApplicationsQuery,
  useCreateCollegeApplicationMutation,
  useUpdateCollegeApplicationMutation,
  useDeleteCollegeApplicationMutation,
  useGetApplicationTasksQuery,
  useCreateApplicationTaskMutation,
  useUpdateApplicationTaskMutation,
  useDeleteApplicationTaskMutation,
  useGetScholarshipApplicationsQuery,
  useCreateScholarshipApplicationMutation,
  useUpdateScholarshipApplicationMutation,
  useDeleteScholarshipApplicationMutation,
} = applicationTrackingApi;

export const {
  useGetStudentEssaysQuery,
  useCreateStudentEssayMutation,
  useUpdateStudentEssayMutation,
  useDeleteStudentEssayMutation,
} = essayManagementApi;

