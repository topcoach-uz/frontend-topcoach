import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  useCreateUserPreferencesMutation,
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
} from 'src/app/services/student-hub/dashboardApi';
import { useGetCurrentSubscriptionQuery } from 'src/app/services/subscription';
import { useTypedSelector } from 'src/app/store';

const LEGACY_PREMIUM_KEY = 'topcoach_journey_premium';
const COMMUNITY_ENROLLED_KEY = 'topcoach_community_enrolled';

type JourneyExperienceValue = {
  /** @deprecated use isCommunityEnrolled - kept for existing imports */
  hasPremiumJourney: boolean;
  setPremiumJourney: (value: boolean) => void;
  unlockPremiumJourney: () => void;
  /** Community enrollment (mock: localStorage). Controls feed vs dashboard default & locked learning items. */
  isCommunityEnrolled: boolean;
  setCommunityEnrolled: (value: boolean) => void;
};

const JourneyExperienceContext = createContext<JourneyExperienceValue | null>(null);

function readCommunityEnrolled(): boolean {
  try {
    if (localStorage.getItem(COMMUNITY_ENROLLED_KEY) === 'true') return true;
    if (localStorage.getItem(LEGACY_PREMIUM_KEY) === 'true') return true;
    return false;
  } catch {
    return false;
  }
}

export function JourneyExperienceProvider({ children }: { children: React.ReactNode }) {
  const profile = useTypedSelector((s) => s.auth.profile);
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const { data: rawPreferences } = useGetUserPreferencesQuery();
  // Subscription state is the second source of community entitlement.
  // Anyone whose current subscription is `trialing` or `active` must
  // be treated as community-enrolled — that's the whole point of the
  // trial: pay (or card-on-file) → instant access. We still keep the
  // user_preferences flag for admin/Full-Support grants and as the
  // explicit "switch back to standard" override.
  const { data: subscription } = useGetCurrentSubscriptionQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [createUserPreferences] = useCreateUserPreferencesMutation();
  const [updateUserPreferences] = useUpdateUserPreferencesMutation();
  const [preferenceMode, setState] = useState(readCommunityEnrolled);
  const preferences = ((rawPreferences as any)?.data ?? rawPreferences ?? null) as any;
  const isSuperAdmin =
    profile?.managementRole === 'SuperAdmin' || (profile?.managementRole as string) === 'Owner';

  useEffect(() => {
    const mode = preferences?.applicationSettings?.communityExperienceMode;
    if (mode === 'community') setState(true);
    if (mode === 'standard') setState(false);
  }, [preferences?.applicationSettings?.communityExperienceMode]);

  // A `trialing` / `active` subscription with `cancelAtPeriodEnd=true`
  // still grants access until the period actually ends — Stripe / Apple
  // both work this way. The cron transitions status → canceled / expired
  // at period end, at which point this gate flips closed automatically.
  const hasEntitlingSubscription =
    subscription?.status === 'active' || subscription?.status === 'trialing';

  const isCommunityEnrolled = preferenceMode || hasEntitlingSubscription;

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
    }),
    [isCommunityEnrolled, setCommunityEnrolled, setPremiumJourney, unlockPremiumJourney],
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
};

export function useJourneyExperience(): JourneyExperienceValue {
  const ctx = useContext(JourneyExperienceContext);
  return ctx ?? FALLBACK_VALUE;
}
