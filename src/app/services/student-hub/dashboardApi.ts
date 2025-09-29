import { RtkApi } from '../api';
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
  PaginatedResponse,
  ApiResponse,
} from './types';

export const dashboardApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================
    // 📊 DASHBOARD STATS
    // ========================================

    // Get dashboard stats
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => ({
        url: '/student-hub/dashboard',
        method: 'GET',
      }),
      providesTags: [
        'StudentProfile',
        'CollegeApplications',
        'StudentEssays',
        'ApplicationTasks',
        'Notifications',
        'ProgressTracking',
      ],
    }),

    // Get profile completion stats
    getProfileCompletionStats: builder.query<
      ApiResponse<{
        completionPercentage: number;
        sectionsCompleted: number;
        totalSections: number;
        lastUpdated: string;
        sections: Array<{
          name: string;
          completed: boolean;
          percentage: number;
          lastUpdated: string;
        }>;
      }>,
      void
    >({
      query: () => ({
        url: '/student-hub/dashboard/profile-completion',
        method: 'GET',
      }),
      providesTags: ['StudentProfile'],
    }),

    // Get application progress stats
    getApplicationProgressStats: builder.query<
      ApiResponse<{
        totalApplications: number;
        submittedApplications: number;
        inProgressApplications: number;
        acceptedApplications: number;
        rejectedApplications: number;
        waitlistedApplications: number;
        applicationsByCategory: Record<string, number>;
        applicationsByStatus: Record<string, number>;
        upcomingDeadlines: Array<{
          id: string;
          title: string;
          deadline: string;
          priority: string;
          daysRemaining: number;
        }>;
      }>,
      void
    >({
      query: () => ({
        url: '/student-hub/dashboard/application-progress',
        method: 'GET',
      }),
      providesTags: ['CollegeApplications'],
    }),

    // Get essay progress stats
    getEssayProgressStats: builder.query<
      ApiResponse<{
        totalEssays: number;
        inProgressEssays: number;
        completedEssays: number;
        submittedEssays: number;
        totalWordCount: number;
        averageWordCount: number;
        essaysByType: Record<string, number>;
        essaysByStatus: Record<string, number>;
        recentEssays: Array<{
          id: string;
          title: string;
          type: string;
          status: string;
          wordCount: number;
          lastModified: string;
        }>;
      }>,
      void
    >({
      query: () => ({
        url: '/student-hub/dashboard/essay-progress',
        method: 'GET',
      }),
      providesTags: ['StudentEssays'],
    }),

    // Get task progress stats
    getTaskProgressStats: builder.query<
      ApiResponse<{
        totalTasks: number;
        pendingTasks: number;
        inProgressTasks: number;
        completedTasks: number;
        overdueTasks: number;
        tasksByPriority: Record<string, number>;
        tasksByStatus: Record<string, number>;
        recentTasks: Array<{
          id: string;
          title: string;
          priority: string;
          status: string;
          dueDate: string;
          daysRemaining: number;
        }>;
      }>,
      void
    >({
      query: () => ({
        url: '/student-hub/dashboard/task-progress',
        method: 'GET',
      }),
      providesTags: ['ApplicationTasks'],
    }),

    // ========================================
    // 🔔 NOTIFICATIONS
    // ========================================

    // Get notifications
    getNotifications: builder.query<
      PaginatedResponse<Notification>,
      { page?: number; limit?: number; status?: string; type?: string }
    >({
      query: ({ page = 1, limit = 10, status, type }) => ({
        url: '/notifications',
        method: 'GET',
        params: { page, limit, status, type },
      }),
      providesTags: ['Notifications'],
    }),

    // Get notification by ID
    getNotification: builder.query<ApiResponse<Notification>, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Notifications', id }],
    }),

    // Create notification
    createNotification: builder.mutation<
      ApiResponse<Notification>,
      CreateNotificationRequest
    >({
      query: (data) => ({
        url: '/notifications',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Notifications'],
    }),

    // Update notification
    updateNotification: builder.mutation<
      ApiResponse<Notification>,
      { id: string; data: UpdateNotificationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/notifications/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Notifications', id },
        'Notifications',
      ],
    }),

    // Mark notification as read
    markNotificationAsRead: builder.mutation<
      ApiResponse<Notification>,
      string
    >({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notifications', id },
        'Notifications',
      ],
    }),

    // Get unread notification count
    getUnreadNotificationCount: builder.query<
      ApiResponse<{ count: number }>,
      void
    >({
      query: () => ({
        url: '/notifications/unread-count',
        method: 'GET',
      }),
      providesTags: ['Notifications'],
    }),

    // Get notification statistics
    getNotificationStats: builder.query<
      ApiResponse<{
        total: number;
        unread: number;
        read: number;
        clicked: number;
        dismissed: number;
        archived: number;
        byType: Record<string, number>;
        byPriority: Record<string, number>;
      }>,
      void
    >({
      query: () => ({
        url: '/notifications/stats',
        method: 'GET',
      }),
      providesTags: ['Notifications'],
    }),

    // ========================================
    // 📊 PROGRESS TRACKING
    // ========================================

    // Get progress tracking records
    getProgressTracking: builder.query<
      PaginatedResponse<ProgressTracking>,
      { page?: number; limit?: number; category?: string; metric?: string }
    >({
      query: ({ page = 1, limit = 10, category, metric }) => ({
        url: '/progress-tracking',
        method: 'GET',
        params: { page, limit, category, metric },
      }),
      providesTags: ['ProgressTracking'],
    }),

    // Get progress tracking by ID
    getProgressTrackingRecord: builder.query<ApiResponse<ProgressTracking>, string>({
      query: (id) => ({
        url: `/progress-tracking/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'ProgressTracking', id }],
    }),

    // Create progress tracking record
    createProgressTrackingRecord: builder.mutation<
      ApiResponse<ProgressTracking>,
      CreateProgressTrackingRequest
    >({
      query: (data) => ({
        url: '/progress-tracking/record',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ProgressTracking'],
    }),

    // Update progress tracking record
    updateProgressTrackingRecord: builder.mutation<
      ApiResponse<ProgressTracking>,
      { id: string; data: UpdateProgressTrackingRequest }
    >({
      query: ({ id, data }) => ({
        url: `/progress-tracking/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ProgressTracking', id },
        'ProgressTracking',
      ],
    }),

    // Delete progress tracking record
    deleteProgressTrackingRecord: builder.mutation<void, string>({
      query: (id) => ({
        url: `/progress-tracking/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProgressTracking'],
    }),

    // Get progress summary
    getProgressSummary: builder.query<
      ApiResponse<{
        overallProgress: number;
        categories: Array<{
          name: string;
          progress: number;
          completed: number;
          total: number;
          lastUpdated: string;
        }>;
        trends: Array<{
          date: string;
          value: number;
          category: string;
        }>;
        milestones: Array<{
          id: string;
          title: string;
          description: string;
          achieved: boolean;
          achievedAt?: string;
        }>;
      }>,
      void
    >({
      query: () => ({
        url: '/progress-tracking/summary',
        method: 'GET',
      }),
      providesTags: ['ProgressTracking'],
    }),

    // Get progress trends
    getProgressTrends: builder.query<
      ApiResponse<Array<{
        date: string;
        value: number;
        category: string;
        metric: string;
        change: number;
        changeRate: number;
      }>>,
      { category: string; metric: string; days?: number }
    >({
      query: ({ category, metric, days = 30 }) => ({
        url: '/progress-tracking/trends',
        method: 'GET',
        params: { category, metric, days },
      }),
      providesTags: ['ProgressTracking'],
    }),

    // ========================================
    // ⚙️ USER PREFERENCES
    // ========================================

    // Get user preferences
    getUserPreferences: builder.query<ApiResponse<UserPreferences>, void>({
      query: () => ({
        url: '/user-preferences',
        method: 'GET',
      }),
      providesTags: ['UserPreferences'],
    }),

    // Update user preferences
    updateUserPreferences: builder.mutation<
      ApiResponse<UserPreferences>,
      UpdateUserPreferencesRequest
    >({
      query: (data) => ({
        url: '/user-preferences',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['UserPreferences'],
    }),

    // Update notification settings
    updateNotificationSettings: builder.mutation<
      ApiResponse<UserPreferences>,
      UserPreferences['notificationSettings']
    >({
      query: (data) => ({
        url: '/user-preferences/notifications',
        method: 'PATCH',
        body: { notificationSettings: data },
      }),
      invalidatesTags: ['UserPreferences'],
    }),

    // Update privacy settings
    updatePrivacySettings: builder.mutation<
      ApiResponse<UserPreferences>,
      UserPreferences['privacySettings']
    >({
      query: (data) => ({
        url: '/user-preferences/privacy',
        method: 'PATCH',
        body: { privacySettings: data },
      }),
      invalidatesTags: ['UserPreferences'],
    }),

    // Update display settings
    updateDisplaySettings: builder.mutation<
      ApiResponse<UserPreferences>,
      UserPreferences['displaySettings']
    >({
      query: (data) => ({
        url: '/user-preferences/display',
        method: 'PATCH',
        body: { displaySettings: data },
      }),
      invalidatesTags: ['UserPreferences'],
    }),

    // Update AI settings
    updateAISettings: builder.mutation<
      ApiResponse<UserPreferences>,
      UserPreferences['aiSettings']
    >({
      query: (data) => ({
        url: '/user-preferences/ai',
        method: 'PATCH',
        body: { aiSettings: data },
      }),
      invalidatesTags: ['UserPreferences'],
    }),

    // Get preferences summary
    getPreferencesSummary: builder.query<
      ApiResponse<{
        notificationSettings: UserPreferences['notificationSettings'];
        privacySettings: UserPreferences['privacySettings'];
        displaySettings: UserPreferences['displaySettings'];
        applicationSettings: UserPreferences['applicationSettings'];
        aiSettings: UserPreferences['aiSettings'];
        mentorPreferences: UserPreferences['mentorPreferences'];
      }>,
      void
    >({
      query: () => ({
        url: '/user-preferences/summary',
        method: 'GET',
      }),
      providesTags: ['UserPreferences'],
    }),

    // Reset preferences to defaults
    resetPreferencesToDefaults: builder.mutation<
      ApiResponse<UserPreferences>,
      void
    >({
      query: () => ({
        url: '/user-preferences/reset-defaults',
        method: 'PATCH',
      }),
      invalidatesTags: ['UserPreferences'],
    }),
  }),
});

export const {
  // Dashboard Stats
  useGetDashboardStatsQuery,
  useGetProfileCompletionStatsQuery,
  useGetApplicationProgressStatsQuery,
  useGetEssayProgressStatsQuery,
  useGetTaskProgressStatsQuery,

  // Notifications
  useGetNotificationsQuery,
  useGetNotificationQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useMarkNotificationAsReadMutation,
  useGetUnreadNotificationCountQuery,
  useGetNotificationStatsQuery,

  // Progress Tracking
  useGetProgressTrackingQuery,
  useGetProgressTrackingRecordQuery,
  useCreateProgressTrackingRecordMutation,
  useUpdateProgressTrackingRecordMutation,
  useDeleteProgressTrackingRecordMutation,
  useGetProgressSummaryQuery,
  useGetProgressTrendsQuery,

  // User Preferences
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  useUpdateNotificationSettingsMutation,
  useUpdatePrivacySettingsMutation,
  useUpdateDisplaySettingsMutation,
  useUpdateAISettingsMutation,
  useGetPreferencesSummaryQuery,
  useResetPreferencesToDefaultsMutation,
} = dashboardApi;