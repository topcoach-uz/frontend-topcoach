import { useEffect, useState } from 'react';
import { useGetCurrentSubscriptionQuery } from 'src/app/services/subscription';
import { useGetUserPreferencesQuery } from 'src/app/services/student-hub/dashboardApi';
import { useGetMyOrgMembershipQuery } from 'src/app/services/student-hub/orgMembershipApi';
import { profileMembership } from './profileMembershipModel';
import ProfileMembershipAction from './ProfileMembershipAction';

export default function ProfileMembership({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const subscription = useGetCurrentSubscriptionQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: visible ? 30_000 : 0,
  });
  const preferences = useGetUserPreferencesQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: visible ? 60_000 : 0,
  });
  const organizations = useGetMyOrgMembershipQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: visible ? 60_000 : 0,
  });
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const updateVisibility = () => {
      setVisible(document.visibilityState !== 'hidden');
      setNow(Date.now());
    };
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);
  const membership = profileMembership({
    subscription: subscription.currentData,
    settings: preferences.currentData?.data?.applicationSettings,
    memberships: organizations.currentData,
    now,
  });
  const queries = [subscription, preferences, organizations];
  return (
    <ProfileMembershipAction
      membership={membership}
      loading={
        membership.state !== 'active' &&
        queries.some((query) => query.isLoading)
      }
      unavailable={
        membership.state !== 'active' && queries.some((query) => query.isError)
      }
      onNavigate={() => {
        if (membership.state === 'pending') {
          void subscription.refetch();
          void preferences.refetch();
          void organizations.refetch();
        }
        onNavigate?.();
      }}
    />
  );
}
