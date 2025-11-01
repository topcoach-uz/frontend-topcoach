// 🎓 Student Hub Custom Hooks
// Custom hooks for easier data management and state handling

import { useCallback, useMemo } from 'react';
import { message } from 'antd';
import { useTypedSelector } from '../app/store';
import {
  useGetMyStudentProfileQuery,
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

export const useStudentProfile = () => {
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useGetMyStudentProfileQuery(undefined, {
    skip: !isAuthenticated, // Skip the query if user is not authenticated
  });

  // Safe refetch function that checks authentication
  const safeRefetchProfile = useCallback(() => {
    if (isAuthenticated) {
      return refetchProfile();
    }
    return Promise.resolve();
  }, [isAuthenticated, refetchProfile]);

  const [updateProfile, { isLoading: updateLoading }] = useUpdateMyStudentProfileMutation();
  const [calculateCompletion, { isLoading: calculateLoading }] = useCalculateCompletionMutation();

  const profile = profileData;
  const isProfileComplete = profile?.completionPercentage === 100;
  const profileStatus = profile?.profileStatus;


  const updateStudentProfile = useCallback(
    async (data: any) => {
      if (!profile?.id) return;

      try {
        const result = await updateProfile(data).unwrap();
        safeRefetchProfile();
        return result;
      } catch (error: any) {
        throw error;
      }
    },
    [profile?.id, updateProfile, safeRefetchProfile]
  );

  const recalculateCompletion = useCallback(async () => {
    if (!profile?.id) return;

    try {
      await calculateCompletion(profile.id).unwrap();
      message.success('Completion percentage recalculated!');
      safeRefetchProfile();
    } catch (error: any) {
      message.error(error?.data?.message || 'Failed to recalculate completion');
      throw error;
    }
  }, [profile?.id, calculateCompletion, safeRefetchProfile]);

  return {
    profile,
    isLoading: profileLoading,
    error: profileError,
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
  const progressOverview = dashboard?.profile ? [
    { category: 'Academic Profile', completed: 0, total: 1, percentage: 0, status: 'pending' },
    { category: 'Personal Profile', completed: 0, total: 1, percentage: 0, status: 'pending' },
    { category: 'Activities Profile', completed: 0, total: 1, percentage: 0, status: 'pending' },
    { category: 'Documents Profile', completed: 0, total: 1, percentage: 0, status: 'pending' },
  ] : [];

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

export const useNotifications = (page = 1, limit = 10) => {
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useGetNotificationsQuery({ page, limit }, {
    skip: !isAuthenticated, // Skip the query if user is not authenticated
  });

  const {
    data: unreadCountData,
    isLoading: unreadCountLoading,
    refetch: refetchUnreadCount,
  } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !isAuthenticated, // Skip the query if user is not authenticated
  });

  // Safe refetch functions that check authentication
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

  const [markAsRead, { isLoading: markAsReadLoading }] = useMarkNotificationAsReadMutation();

  const notifications = notificationsData?.data || [];
  const totalNotifications = notificationsData?.total || 0;
  const unreadCount = unreadCountData?.count || 0;

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

  const markAllAsRead = useCallback(async () => {
    try {
      // This would need to be implemented in the backend
      // For now, we'll mark each notification individually
      const unreadNotifications = notifications.filter(n => n.status === 'unread');
      await Promise.all(unreadNotifications.map(n => markAsRead(n.id).unwrap()));
      safeRefetchNotifications();
      safeRefetchUnreadCount();
      message.success('All notifications marked as read');
    } catch (error: any) {
      message.error('Failed to mark all notifications as read');
      throw error;
    }
  }, [notifications, markAsRead, safeRefetchNotifications, safeRefetchUnreadCount]);

  return {
    notifications,
    totalNotifications,
    unreadCount,
    isLoading: notificationsLoading,
    unreadCountLoading,
    error: notificationsError,
    markNotificationAsRead,
    markAllAsRead,
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

  const updateAISettings = useCallback(
    async (settings: UserPreferences['aiSettings']) => {
      if (!preferences) return;

      try {
        await updatePreferences({
          aiSettings: { ...preferences.aiSettings, ...settings },
        }).unwrap();
        message.success('AI settings updated!');
        safeRefetchPreferences();
      } catch (error: any) {
        message.error('Failed to update AI settings');
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
    updateAISettings,
    updateLoading,
    refetchPreferences: safeRefetchPreferences,
  };
};

// ========================================
// 🎯 COMBINED STUDENT HUB HOOK
// ========================================

export const useStudentHub = () => {
  const profile = useStudentProfile();
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