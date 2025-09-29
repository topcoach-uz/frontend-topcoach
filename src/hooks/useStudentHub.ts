// 🎓 Student Hub Custom Hooks
// Custom hooks for easier data management and state handling

import { useCallback, useMemo } from 'react';
import { message } from 'antd';
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
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useGetMyStudentProfileQuery();

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
        refetchProfile();
        return result;
      } catch (error: any) {
        throw error;
      }
    },
    [profile?.id, updateProfile, refetchProfile]
  );

  const recalculateCompletion = useCallback(async () => {
    if (!profile?.id) return;

    try {
      await calculateCompletion(profile.id).unwrap();
      message.success('Completion percentage recalculated!');
      refetchProfile();
    } catch (error: any) {
      message.error(error?.data?.message || 'Failed to recalculate completion');
      throw error;
    }
  }, [profile?.id, calculateCompletion, refetchProfile]);

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
    refetchProfile,
  };
};

// ========================================
// 📊 DASHBOARD HOOKS
// ========================================

export const useDashboard = () => {
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useGetDashboardStatsQuery();

  const dashboard = dashboardData;

  // Debug logging
  console.log('useDashboard - Dashboard data:', dashboardData);
  console.log('useDashboard - Loading:', dashboardLoading);
  console.log('useDashboard - Error:', dashboardError);

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
    refetchDashboard,
  };
};

// ========================================
// 🔔 NOTIFICATIONS HOOKS
// ========================================

export const useNotifications = (page = 1, limit = 10) => {
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useGetNotificationsQuery({ page, limit });

  const {
    data: unreadCountData,
    isLoading: unreadCountLoading,
    refetch: refetchUnreadCount,
  } = useGetUnreadNotificationCountQuery();

  const [markAsRead, { isLoading: markAsReadLoading }] = useMarkNotificationAsReadMutation();

  const notifications = notificationsData?.data || [];
  const totalNotifications = notificationsData?.total || 0;
  const unreadCount = unreadCountData?.count || 0;

  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markAsRead(notificationId).unwrap();
        refetchNotifications();
        refetchUnreadCount();
      } catch (error: any) {
        message.error(error?.data?.message || 'Failed to mark notification as read');
        throw error;
      }
    },
    [markAsRead, refetchNotifications, refetchUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      // This would need to be implemented in the backend
      // For now, we'll mark each notification individually
      const unreadNotifications = notifications.filter(n => n.status === 'unread');
      await Promise.all(unreadNotifications.map(n => markAsRead(n.id).unwrap()));
      refetchNotifications();
      refetchUnreadCount();
      message.success('All notifications marked as read');
    } catch (error: any) {
      message.error('Failed to mark all notifications as read');
      throw error;
    }
  }, [notifications, markAsRead, refetchNotifications, refetchUnreadCount]);

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
    refetchNotifications,
    refetchUnreadCount,
  };
};

// ========================================
// ⚙️ USER PREFERENCES HOOKS
// ========================================

export const useUserPreferences = () => {
  const {
    data: preferencesData,
    isLoading: preferencesLoading,
    error: preferencesError,
    refetch: refetchPreferences,
  } = useGetUserPreferencesQuery();

  const [updatePreferences, { isLoading: updateLoading }] = useUpdateUserPreferencesMutation();

  const preferences = preferencesData;

  const updateUserPreferences = useCallback(
    async (data: Partial<UserPreferences>) => {
      try {
        await updatePreferences(data).unwrap();
        message.success('Preferences updated successfully!');
        refetchPreferences();
      } catch (error: any) {
        message.error(error?.data?.message || 'Failed to update preferences');
        throw error;
      }
    },
    [updatePreferences, refetchPreferences]
  );

  const updateNotificationSettings = useCallback(
    async (settings: UserPreferences['notificationSettings']) => {
      if (!preferences) return;

      try {
        await updatePreferences({
          notificationSettings: { ...preferences.notificationSettings, ...settings },
        }).unwrap();
        message.success('Notification settings updated!');
        refetchPreferences();
      } catch (error: any) {
        message.error('Failed to update notification settings');
        throw error;
      }
    },
    [preferences, updatePreferences, refetchPreferences]
  );

  const updateDisplaySettings = useCallback(
    async (settings: UserPreferences['displaySettings']) => {
      if (!preferences) return;

      try {
        await updatePreferences({
          displaySettings: { ...preferences.displaySettings, ...settings },
        }).unwrap();
        message.success('Display settings updated!');
        refetchPreferences();
      } catch (error: any) {
        message.error('Failed to update display settings');
        throw error;
      }
    },
    [preferences, updatePreferences, refetchPreferences]
  );

  const updateAISettings = useCallback(
    async (settings: UserPreferences['aiSettings']) => {
      if (!preferences) return;

      try {
        await updatePreferences({
          aiSettings: { ...preferences.aiSettings, ...settings },
        }).unwrap();
        message.success('AI settings updated!');
        refetchPreferences();
      } catch (error: any) {
        message.error('Failed to update AI settings');
        throw error;
      }
    },
    [preferences, updatePreferences, refetchPreferences]
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
    refetchPreferences,
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

  // Debug logging
  console.log('useStudentHub - Profile:', profile);
  console.log('useStudentHub - Dashboard:', dashboard);
  console.log('useStudentHub - Notifications:', notifications);
  console.log('useStudentHub - Preferences:', preferences);
  console.log('useStudentHub - IsLoading:', isLoading);
  console.log('useStudentHub - HasError:', hasError);

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