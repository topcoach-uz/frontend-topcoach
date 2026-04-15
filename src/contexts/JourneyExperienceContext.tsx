import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  useCreateUserPreferencesMutation,
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
} from 'src/app/services/student-hub/dashboardApi';
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
  const { data: rawPreferences } = useGetUserPreferencesQuery();
  const [createUserPreferences] = useCreateUserPreferencesMutation();
  const [updateUserPreferences] = useUpdateUserPreferencesMutation();
  const [isCommunityEnrolled, setState] = useState(readCommunityEnrolled);
  const preferences = ((rawPreferences as any)?.data ?? rawPreferences ?? null) as any;
  const isSuperAdmin =
    profile?.managementRole === 'SuperAdmin' || (profile?.managementRole as string) === 'Owner';

  useEffect(() => {
    const mode = preferences?.applicationSettings?.communityExperienceMode;
    if (mode === 'community') setState(true);
    if (mode === 'standard') setState(false);
  }, [preferences?.applicationSettings?.communityExperienceMode]);

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

export function useJourneyExperience(): JourneyExperienceValue {
  const ctx = useContext(JourneyExperienceContext);
  if (!ctx) {
    throw new Error('useJourneyExperience must be used within JourneyExperienceProvider');
  }
  return ctx;
}
