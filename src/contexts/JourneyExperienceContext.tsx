import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  useCreateUserPreferencesMutation,
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
} from 'src/app/services/student-hub/dashboardApi';
import { useGetCurrentSubscriptionQuery } from 'src/app/services/subscription';
import { useTypedSelector } from 'src/app/store';
import { useGetMyOrgMembershipQuery } from 'src/app/services/student-hub/orgMembershipApi';
import { hasActiveCommunityOrgMembership } from 'src/lib/communityOrgAccess';
import { hasActiveDirectCommunityAccess } from 'src/lib/communityAccess';

const LEGACY_PREMIUM_KEY = 'topcoach_journey_premium';
const COMMUNITY_ENROLLED_KEY = 'topcoach_community_enrolled';

type JourneyExperienceValue = {
  /** @deprecated use isCommunityEnrolled - kept for existing imports */
  hasPremiumJourney: boolean;
  setPremiumJourney: (value: boolean) => void;
  unlockPremiumJourney: () => void;
  /** Community entitlement. Controls feed vs dashboard default and locked learning items. */
  isCommunityEnrolled: boolean;
  setCommunityEnrolled: (value: boolean) => void;
  /**
   * True while preferences, subscription, or organization membership are loading
   * and no entitlement has been confirmed yet.
   * Consumers that route/redirect based on isCommunityEnrolled should
   * wait for this to go false — otherwise an enrolled user on a fresh
   * device gets routed as not-enrolled and then yanked to the right
   * place when the subscription resolves.
   */
  isEntitlementLoading: boolean;
};

const JourneyExperienceContext = createContext<JourneyExperienceValue | null>(null);

export function JourneyExperienceProvider({ children }: { children: React.ReactNode }) {
  const profile = useTypedSelector((s) => s.auth.profile);
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const { data: rawPreferences, isLoading: preferencesLoading } = useGetUserPreferencesQuery();
  // Subscription state is the second source of community entitlement.
  // Anyone whose current subscription is `trialing` or `active` must
  // be treated as community-enrolled — that's the whole point of the
  // trial: pay (or card-on-file) → instant access. We still keep the
  // user_preferences flag for admin/Full-Support grants and as the
  // explicit "switch back to standard" override.
  const { data: subscription, isLoading: subscriptionLoading } =
    useGetCurrentSubscriptionQuery(undefined, {
      skip: !isAuthenticated,
    });
  const { data: orgMemberships, isLoading: orgMembershipsLoading } =
    useGetMyOrgMembershipQuery(undefined, {
      skip: !isAuthenticated,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 60_000,
    });
  const [createUserPreferences] = useCreateUserPreferencesMutation();
  const [updateUserPreferences] = useUpdateUserPreferencesMutation();
  // Local storage is never an entitlement: an organization can revoke a seat
  // from another session, and an old browser flag must not keep access open.
  const [preferenceMode, setState] = useState(false);
  const preferences = ((rawPreferences as any)?.data ?? rawPreferences ?? null) as any;
  const isSuperAdmin =
    profile?.managementRole === 'SuperAdmin' || (profile?.managementRole as string) === 'Owner';

  useEffect(() => {
    setState(hasActiveDirectCommunityAccess(preferences?.applicationSettings));
  }, [
    preferences?.applicationSettings?.communityExperienceMode,
    preferences?.applicationSettings?.communityAccessExpiresAt,
  ]);

  // A `trialing` / `active` subscription with `cancelAtPeriodEnd=true`
  // still grants access until the period actually ends — Stripe / Apple
  // both work this way. The cron transitions status → canceled / expired
  // at period end, at which point this gate flips closed automatically.
  const hasEntitlingSubscription =
    subscription?.status === 'active' || subscription?.status === 'trialing';

  const isCommunityEnrolled = preferenceMode || hasEntitlingSubscription ||
    hasActiveCommunityOrgMembership(orgMemberships);
  // Only an unconfirmed entitlement needs the loading state.
  const isEntitlementLoading =
    !isCommunityEnrolled && (preferencesLoading || subscriptionLoading || orgMembershipsLoading);

  const setCommunityEnrolled = useCallback((value: boolean) => {
    setState(value);
    try {
      if (value) {
        localStorage.setItem(COMMUNITY_ENROLLED_KEY, 'true');
        localStorage.setItem(LEGACY_PREMIUM_KEY, 'true');
      } else {
        localStorage.removeItem(COMMUNITY_ENROLLED_KEY);
        localStorage.removeItem(LEGACY_PREMIUM_KEY);
      }
    } catch {
      /* ignore */
    }
    const payload = {
      ...(preferences?.id ? { id: preferences.id } : {}),
      applicationSettings: {
        ...(preferences?.applicationSettings || {}),
        communityExperienceMode: value ? 'community' : 'standard',
      },
    };
    void updateUserPreferences(payload)
      .unwrap()
      .catch((error: any) => {
        const msg = error?.data?.message || error?.message || '';
        if (
          msg.includes('Resource id not provided') ||
          msg.includes('Resource not found')
        ) {
          return createUserPreferences({
            applicationSettings: payload.applicationSettings,
          }).unwrap();
        }
        return Promise.reject(error);
      })
      .catch(() => {
        // ignore background preference persistence errors; local state is still applied
      });
  }, [preferences?.id, preferences?.applicationSettings, updateUserPreferences, createUserPreferences]);

  /** Legacy alias */
  const setPremiumJourney = setCommunityEnrolled;
  const unlockPremiumJourney = useCallback(() => {
    if (!isSuperAdmin) return;
    setCommunityEnrolled(true);
  }, [isSuperAdmin, setCommunityEnrolled]);

  const value = useMemo(
    () => ({
      hasPremiumJourney: isCommunityEnrolled,
      setPremiumJourney,
      unlockPremiumJourney,
      isCommunityEnrolled,
      setCommunityEnrolled,
      isEntitlementLoading,
    }),
    [isCommunityEnrolled, setCommunityEnrolled, setPremiumJourney, unlockPremiumJourney, isEntitlementLoading],
  );

  return <JourneyExperienceContext.Provider value={value}>{children}</JourneyExperienceContext.Provider>;
}

/**
 * Safe defaults so the hook can be called outside the provider (e.g. on the
 * mentor home or admin console). Reads/writes degrade to no-ops in that
 * case — the only consumer still wired to those values is the Research Prep
 * teaser, which gracefully hides.
 */
const FALLBACK_VALUE: JourneyExperienceValue = {
  hasPremiumJourney: false,
  setPremiumJourney: () => {},
  unlockPremiumJourney: () => {},
  isCommunityEnrolled: false,
  setCommunityEnrolled: () => {},
  isEntitlementLoading: false,
};

export function useJourneyExperience(): JourneyExperienceValue {
  const ctx = useContext(JourneyExperienceContext);
  return ctx ?? FALLBACK_VALUE;
}

/** Visual walkthrough only. Never changes persisted account entitlements. */
export function LocalFreeJourneyPreview({ children }: { children: React.ReactNode }) {
  if (!import.meta.env.DEV) return null;
  return <JourneyExperienceContext.Provider value={FALLBACK_VALUE}>{children}</JourneyExperienceContext.Provider>;
}
