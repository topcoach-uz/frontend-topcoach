import { RtkApi } from '../api';
import {
  CollegeApplication,
  CreateCollegeApplicationRequest,
  UpdateCollegeApplicationRequest,
  ApplicationTask,
  CreateApplicationTaskRequest,
  UpdateApplicationTaskRequest,
  ScholarshipApplication,
  CreateScholarshipApplicationRequest,
  UpdateScholarshipApplicationRequest,
  PaginatedResponse,
  ApiResponse,
} from './types';

export const applicationTrackingApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================
    // 🎓 COLLEGE APPLICATIONS
    // ========================================

    // Get college applications
    getCollegeApplications: builder.query<
      PaginatedResponse<CollegeApplication>,
      { page?: number; limit?: number; status?: string; category?: string }
    >({
      query: ({ page = 1, limit = 10, status, category }) => ({
        url: '/application-tracking/college-applications',
        method: 'GET',
        params: { page, limit, status, category },
      }),
      providesTags: ['CollegeApplications'],
      keepUnusedDataFor: 600,
    }),

    // Get college application by ID
    getCollegeApplication: builder.query<ApiResponse<CollegeApplication>, string>({
      query: (id) => ({
        url: `/application-tracking/college-applications/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: unknown): ApiResponse<CollegeApplication> => {
        const raw = response && typeof response === 'object' && 'data' in (response as object)
          ? (response as { data: unknown }).data
          : response;
        const entity = raw && typeof raw === 'object' && raw !== null && 'id' in (raw as object)
          ? (raw as CollegeApplication)
          : null;
        return { data: entity as CollegeApplication, success: !!entity };
      },
      providesTags: (result, error, id) => [{ type: 'CollegeApplications', id }],
    }),

    // Create college application
    createCollegeApplication: builder.mutation<
      ApiResponse<CollegeApplication>,
      CreateCollegeApplicationRequest
    >({
      query: (data) => ({
        url: '/application-tracking/college-applications',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CollegeApplications'],
    }),

    // Update college application
    updateCollegeApplication: builder.mutation<
      ApiResponse<CollegeApplication>,
      { id: string; data: UpdateCollegeApplicationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/application-tracking/college-applications/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CollegeApplications', id },
        'CollegeApplications',
      ],
    }),

    // Delete college application
    deleteCollegeApplication: builder.mutation<void, string>({
      query: (id) => ({
        url: `/application-tracking/college-applications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CollegeApplications'],
    }),

    // ========================================
    // ✅ APPLICATION TASKS
    // ========================================

    // Get application tasks
    getApplicationTasks: builder.query<
      PaginatedResponse<ApplicationTask>,
      { page?: number; limit?: number; status?: string; priority?: string }
    >({
      query: ({ page = 1, limit = 10, status, priority }) => ({
        url: '/application-tracking/tasks',
        method: 'GET',
        params: { page, limit, status, priority },
      }),
      providesTags: ['ApplicationTasks'],
      keepUnusedDataFor: 300,
    }),

    // Get application task by ID
    getApplicationTask: builder.query<ApiResponse<ApplicationTask>, string>({
      query: (id) => ({
        url: `/application-tracking/tasks/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'ApplicationTasks', id }],
    }),

    // Create application task
    createApplicationTask: builder.mutation<
      ApiResponse<ApplicationTask>,
      CreateApplicationTaskRequest
    >({
      query: (data) => ({
        url: '/application-tracking/tasks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ApplicationTasks'],
    }),

    // Update application task
    updateApplicationTask: builder.mutation<
      ApiResponse<ApplicationTask>,
      { id: string; data: UpdateApplicationTaskRequest }
    >({
      query: ({ id, data }) => ({
        url: `/application-tracking/tasks/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ApplicationTasks', id },
        'ApplicationTasks',
      ],
    }),

    // Delete application task
    deleteApplicationTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `/application-tracking/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ApplicationTasks'],
    }),

    // Mark task as completed
    completeTask: builder.mutation<
      ApiResponse<ApplicationTask>,
      { id: string; completedDate?: string }
    >({
      query: ({ id, completedDate }) => ({
        url: `/application-tracking/tasks/${id}/complete`,
        method: 'PATCH',
        body: { completedDate },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ApplicationTasks', id },
        'ApplicationTasks',
      ],
    }),

    // ========================================
    // 🏆 SCHOLARSHIP APPLICATIONS
    // ========================================

    // Get scholarship applications
    getScholarshipApplications: builder.query<
      PaginatedResponse<ScholarshipApplication>,
      { page?: number; limit?: number; status?: string }
    >({
      query: ({ page = 1, limit = 10, status }) => ({
        url: '/application-tracking/scholarship-applications',
        method: 'GET',
        params: { page, limit, status },
      }),
      providesTags: ['ScholarshipApplications'],
      keepUnusedDataFor: 600,
    }),

    // Get scholarship application by ID
    getScholarshipApplication: builder.query<ApiResponse<ScholarshipApplication>, string>({
      query: (id) => ({
        url: `/application-tracking/scholarship-applications/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'ScholarshipApplications', id }],
    }),

    // Create scholarship application
    createScholarshipApplication: builder.mutation<
      ApiResponse<ScholarshipApplication>,
      CreateScholarshipApplicationRequest
    >({
      query: (data) => ({
        url: '/application-tracking/scholarship-applications',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ScholarshipApplications'],
    }),

    // Update scholarship application
    updateScholarshipApplication: builder.mutation<
      ApiResponse<ScholarshipApplication>,
      { id: string; data: UpdateScholarshipApplicationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/application-tracking/scholarship-applications/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ScholarshipApplications', id },
        'ScholarshipApplications',
      ],
    }),

    // Delete scholarship application
    deleteScholarshipApplication: builder.mutation<void, string>({
      query: (id) => {
        const url = `/application-tracking/scholarship-applications/${id}`;
        console.log('🎯 RTK Query: DELETE URL:', url);
        return {
          url,
          method: 'DELETE',
        };
      },
      invalidatesTags: ['ScholarshipApplications'],
    }),

    // ========================================
    // 📊 DASHBOARD & ANALYTICS
    // ========================================

    // Get application dashboard
    getApplicationDashboard: builder.query<
      ApiResponse<{
        totalApplications: number;
        submittedApplications: number;
        inProgressApplications: number;
        acceptedApplications: number;
        rejectedApplications: number;
        waitlistedApplications: number;
        upcomingDeadlines: Array<{
          id: string;
          title: string;
          deadline: string;
          priority: string;
        }>;
        recentActivity: Array<{
          id: string;
          type: string;
          title: string;
          timestamp: string;
          status: string;
        }>;
        progressOverview: Array<{
          category: string;
          completed: number;
          total: number;
          percentage: number;
        }>;
      }>,
      void
    >({
      query: () => ({
        url: '/application-tracking/dashboard',
        method: 'GET',
      }),
      providesTags: ['CollegeApplications', 'ApplicationTasks', 'ScholarshipApplications'],
    }),

    // Get application timeline
    getApplicationTimeline: builder.query<
      ApiResponse<Array<{
        id: string;
        title: string;
        date: string;
        type: string;
        status: string;
        description?: string;
      }>>,
      void
    >({
      query: () => ({
        url: '/application-tracking/timeline',
        method: 'GET',
      }),
      providesTags: ['CollegeApplications', 'ApplicationTasks'],
    }),
  }),
});

export const {
  // College Applications
  useGetCollegeApplicationsQuery,
  useGetCollegeApplicationQuery,
  useCreateCollegeApplicationMutation,
  useUpdateCollegeApplicationMutation,
  useDeleteCollegeApplicationMutation,

  // Application Tasks
  useGetApplicationTasksQuery,
  useGetApplicationTaskQuery,
  useCreateApplicationTaskMutation,
  useUpdateApplicationTaskMutation,
  useDeleteApplicationTaskMutation,
  useCompleteTaskMutation,

  // Scholarship Applications
  useGetScholarshipApplicationsQuery,
  useGetScholarshipApplicationQuery,
  useCreateScholarshipApplicationMutation,
  useUpdateScholarshipApplicationMutation,
  useDeleteScholarshipApplicationMutation,

  // Dashboard & Analytics
  useGetApplicationDashboardQuery,
  useGetApplicationTimelineQuery,
} = applicationTrackingApi;