// 🎓 Student Hub Custom Hooks
// Custom hooks for easier data management and state handling

import { useCallback, useMemo } from 'react';
import { message } from 'antd';
import { useTypedSelector } from '../app/store';
import {
  useGetMyStudentProfileQuery,
  useGetStudentProfileByUserIdQuery,
  useUpdateMyStudentProfileMutation,
  useCalculateCompletionMutation,
} from '../app/services/student-hub/studentProfileApi';
import {
  useGetDashboardStatsQuery,
} from '../app/services/student-hub/dashboardApi';
import {
  StudentProfile,
  DashboardStats,
} from '../app/services/student-hub/types';
import {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  Notification,
  UserPreferences,
} from '../app/services/api';

// ========================================
// 👤 STUDENT PROFILE HOOKS
// ========================================

// Options for read-only mode (when counselors view student data)
interface StudentProfileOptions {
  studentId?: string;  // If provided, fetch this student's profile (read-only mode)
}

export const useStudentProfile = (options?: StudentProfileOptions) => {
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  
  // Determine if we're in read-only mode based on options
  const isReadOnly = !!options?.studentId;
  const targetStudentId = options?.studentId;

  // If in read-only mode, fetch the specific student's profile by userId
  const { 
    data: studentProfileResponse, 
    isLoading: studentProfileLoading, 
    error: studentProfileError,
    refetch: refetchStudentProfile 
  } = useGetStudentProfileByUserIdQuery(targetStudentId || '', {
    skip: !isReadOnly || !targetStudentId || !isAuthenticated,
  });

  // Normal mode - get current user's profile
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useGetMyStudentProfileQuery(undefined, {
    skip: isReadOnly || !isAuthenticated, // Skip if in read-only mode
  });

  // Use the appropriate profile data based on mode.
  // The by-userId endpoint is declared as ApiResponse<StudentProfile>, but the
  // backend has historically returned the profile unwrapped on some paths, so
  // both shapes are accepted — without an `as any` that would erase the type
  // for every consumer of this hook.
  const actualProfileData: StudentProfile | undefined = isReadOnly
    ? studentProfileResponse?.data ??
      (studentProfileResponse as StudentProfile | undefined)
    : profileData;


  const actualProfileLoading = isReadOnly ? studentProfileLoading : profileLoading;
  const actualProfileError = isReadOnly ? studentProfileError : profileError;
  
  const actualRefetchProfile = isReadOnly 
    ? refetchStudentProfile 
    : refetchProfile;

  // Safe refetch function that checks authentication and mode
  const safeRefetchProfile = useCallback(() => {
    if (isAuthenticated) {
      return actualRefetchProfile();
    }
    return Promise.resolve();
  }, [isAuthenticated, actualRefetchProfile]);

  const [updateProfile, { isLoading: updateLoading }] = useUpdateMyStudentProfileMutation();
  const [calculateCompletion, { isLoading: calculateLoading }] = useCalculateCompletionMutation();

  const profile = actualProfileData;
  const isProfileComplete = profile?.completionPercentage === 100;
  const profileStatus = profile?.profileStatus;

  const updateStudentProfile = useCallback(
    async (data: any) => {
      if (!profile?.id || isReadOnly) return; // Don't allow updates in read-only mode

      try {
        const result = await updateProfile(data).unwrap();
        safeRefetchProfile();
        return result;
      } catch (error: any) {
        throw error;
      }
    },
    [profile?.id, updateProfile, safeRefetchProfile, isReadOnly]
  );

  const recalculateCompletion = useCallback(async () => {
    if (!profile?.id || isReadOnly) return; // Don't allow recalculation in read-only mode

    try {
      await calculateCompletion(profile.id).unwrap();
      message.success('Completion percentage recalculated!');
      safeRefetchProfile();
    } catch (error: any) {
      message.error(error?.data?.message || 'Failed to recalculate completion');
      throw error;
    }
  }, [profile?.id, calculateCompletion, safeRefetchProfile, isReadOnly]);

  return {
    profile,
    isLoading: actualProfileLoading,
    error: actualProfileError,
    isProfileComplete,
    profileStatus,
    updateStudentProfile,
    recalculateCompletion,
    updateLoading,
    calculateLoading,
    refetchProfile: safeRefetchProfile,
  };
};

// ========================================
// 📊 DASHBOARD HOOKS
// ========================================

export const useDashboard = () => {
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useGetDashboardStatsQuery(undefined, {
    skip: !isAuthenticated, // Skip the query if user is not authenticated
  });

  // Safe refetch function that checks authentication
  const safeRefetchDashboard = useCallback(() => {
    if (isAuthenticated) {
      return refetchDashboard();
    }
    return Promise.resolve();
  }, [isAuthenticated, refetchDashboard]);

  const dashboard = dashboardData;

  const stats = useMemo(() => {
    if (!dashboard) return null;

    // Map database statuses to frontend statuses
    const byStatus = dashboard.applications?.collegeApplications?.byStatus || {};
    const inProgressCount = (byStatus.under_review || 0) + (byStatus.in_progress || 0) + (byStatus.applying || 0);

    return {
      profileCompletion: dashboard.profile?.completionPercentage || 0,
      totalApplications: dashboard.applications?.collegeApplications?.total || 0,
      submittedApplications: byStatus.submitted || 0,
      inProgressApplications: inProgressCount,
      acceptedApplications: byStatus.accepted || 0,
      totalEssays: dashboard.essays?.total || 0,
      inProgressEssays: dashboard.essays?.byStatus?.in_progress || 0,
      completedEssays: dashboard.essays?.byStatus?.completed || 0,
      totalTasks: dashboard.applications?.tasks?.total || 0,
      pendingTasks: dashboard.applications?.tasks?.upcoming?.length || 0,
      overdueTasks: dashboard.applications?.tasks?.overdue || 0,
      upcomingDeadlines: dashboard.applications?.collegeApplications?.upcomingDeadlines?.length || 0,
    };
  }, [dashboard]);

  const recentActivity = dashboard?.notifications?.recentActivity || [];
  const progressOverview = dashboard?.profile ? {
    completionPercentage: dashboard.profile.completionPercentage,
    sectionsCompleted: dashboard.profile.sectionsCompleted || 0,
    totalSections: dashboard.profile.totalSections || 5,
  } : null;

  return {
    dashboard,
    stats,
    recentActivity,
    progressOverview,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetchDashboard: safeRefetchDashboard,
  };
};

// ========================================
// 🔔 NOTIFICATIONS HOOKS
// ========================================

export const useNotifications = () => {
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useGetNotificationsQuery({} as any, {
    skip: !isAuthenticated,
  });

  const {
    data: unreadCountData,
    isLoading: unreadCountLoading,
    error: unreadCountError,
    refetch: refetchUnreadCount,
  } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [markAsRead, { isLoading: markAsReadLoading }] = useMarkNotificationAsReadMutation();

  // Safe refetch functions
  const safeRefetchNotifications = useCallback(() => {
    if (isAuthenticated) {
      return refetchNotifications();
    }
    return Promise.resolve();
  }, [isAuthenticated, refetchNotifications]);

  const safeRefetchUnreadCount = useCallback(() => {
    if (isAuthenticated) {
      return refetchUnreadCount();
    }
    return Promise.resolve();
  }, [isAuthenticated, refetchUnreadCount]);

  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markAsRead(notificationId).unwrap();
        safeRefetchNotifications();
        safeRefetchUnreadCount();
      } catch (error: any) {
        message.error(error?.data?.message || 'Failed to mark notification as read');
        throw error;
      }
    },
    [markAsRead, safeRefetchNotifications, safeRefetchUnreadCount]
  );

  const notifications = notificationsData?.data || [];
  const unreadCount = (unreadCountData as any)?.count || 0;

  return {
    notifications,
    unreadCount,
    isLoading: notificationsLoading || unreadCountLoading,
    error: notificationsError || unreadCountError,
    markNotificationAsRead,
    markAsReadLoading,
    refetchNotifications: safeRefetchNotifications,
    refetchUnreadCount: safeRefetchUnreadCount,
  };
};

// ========================================
// ⚙️ USER PREFERENCES HOOKS
// ========================================

export const useUserPreferences = () => {
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  
  const {
    data: preferencesData,
    isLoading: preferencesLoading,
    error: preferencesError,
    refetch: refetchPreferences,
  } = useGetUserPreferencesQuery(undefined, {
    skip: !isAuthenticated, // Skip the query if user is not authenticated
  });

  // Safe refetch function that checks authentication
  const safeRefetchPreferences = useCallback(() => {
    if (isAuthenticated) {
      return refetchPreferences();
    }
    return Promise.resolve();
  }, [isAuthenticated, refetchPreferences]);

  const [updatePreferences, { isLoading: updateLoading }] = useUpdateUserPreferencesMutation();

  const preferences = preferencesData;

  const updateUserPreferences = useCallback(
    async (data: Partial<UserPreferences>) => {
      try {
        await updatePreferences(data).unwrap();
        message.success('Preferences updated successfully!');
        safeRefetchPreferences();
      } catch (error: any) {
        message.error(error?.data?.message || 'Failed to update preferences');
        throw error;
      }
    },
    [updatePreferences, safeRefetchPreferences]
  );

  const updateNotificationSettings = useCallback(
    async (settings: UserPreferences['notificationSettings']) => {
      if (!preferences) return;

      try {
        await updatePreferences({
          notificationSettings: { ...preferences.notificationSettings, ...settings },
        }).unwrap();
        message.success('Notification settings updated!');
        safeRefetchPreferences();
      } catch (error: any) {
        message.error('Failed to update notification settings');
        throw error;
      }
    },
    [preferences, updatePreferences, safeRefetchPreferences]
  );

  const updateDisplaySettings = useCallback(
    async (settings: UserPreferences['displaySettings']) => {
      if (!preferences) return;

      try {
        await updatePreferences({
          displaySettings: { ...preferences.displaySettings, ...settings },
        }).unwrap();
        message.success('Display settings updated!');
        safeRefetchPreferences();
      } catch (error: any) {
        message.error('Failed to update display settings');
        throw error;
      }
    },
    [preferences, updatePreferences, safeRefetchPreferences]
  );

  return {
    preferences,
    isLoading: preferencesLoading,
    error: preferencesError,
    updateUserPreferences,
    updateNotificationSettings,
    updateDisplaySettings,
    updateLoading,
    refetchPreferences: safeRefetchPreferences,
  };
};

// ========================================
// 🎯 COMBINED STUDENT HUB HOOK
// ========================================

// Options for the main useStudentHub hook
interface StudentHubOptions {
  studentId?: string;  // If provided, fetch this student's data (read-only mode for counselors)
}

export const useStudentHub = (options?: StudentHubOptions) => {
  const profile = useStudentProfile(options);
  const dashboard = useDashboard();
  const notifications = useNotifications();
  const preferences = useUserPreferences();

  const isLoading = profile.isLoading || dashboard.isLoading || preferences.isLoading;
  const hasError = profile.error || dashboard.error || preferences.error;

  const refreshAll = useCallback(() => {
    profile.refetchProfile();
    dashboard.refetchDashboard();
    notifications.refetchNotifications();
    preferences.refetchPreferences();
  }, [profile, dashboard, notifications, preferences]);

  return {
    profile,
    dashboard,
    stats: dashboard.stats,
    notifications,
    preferences,
    isLoading,
    hasError,
    refreshAll,
  };
};
