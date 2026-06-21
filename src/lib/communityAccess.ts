import { useMemo } from 'react';

import { useGetPlacementTestStatusQuery } from 'src/app/services/placementTestApi';
import { useGetCurrentSubscriptionQuery } from 'src/app/services/subscription';
import { useTypedSelector } from 'src/app/store';
import { useJourneyExperience } from 'src/contexts/JourneyExperienceContext';

/**
 * Routes used by the funnel. The placement-test pages are mounted as
 * internal sections of `CommunityHubMockPage` so they inherit the
 * COMMUNITY/LEARNING/ACCOUNT sidebar. URLs are query-param-driven via
 * `?section=...`, matching how the rest of the hub works.
 *
 * The old top-level `/placement-test*` URLs still exist as redirects
 * for backwards compatibility, so external links keep working.
 */
export const COMMUNITY_FUNNEL_PATHS = {
  placementTest: '/student-hub?section=placement-test',
  profileBase: '/student-hub?section=placement-profile',
  roadmap: '/student-hub?section=placement-roadmap',
  subscriptionTab: '/student-hub?section=account&target=settings&tab=subscription',
  community: '/student-hub',
  signIn: '/auth/signin',
} as const;

/**
 * Path helper for the profile wizard at a specific sub-step. Defaults
 * to `'basic'` when no step is provided.
 */
export function profilePath(step?: string): string {
  const s = step && step.length > 0 ? step : 'basic';
  return `${COMMUNITY_FUNNEL_PATHS.profileBase}&step=${s}`;
}

export type CommunityGateState =
  | 'loading'
  | 'eligible'                // Admin-granted OR active/trialing subscription
  | 'needs_sign_in'           // Anonymous user — bounce to /auth/signin first
  | 'needs_placement_test'
  | 'needs_profile'
  | 'needs_subscription';     // Test + profile done; only payment is left

export interface CommunityGateScoreBadge {
  percentage: number;
  level: string;
}

export interface CommunityGateResult {
  state: CommunityGateState;
  /** Where to send the user when they click an Unlock CTA. */
  destination: string;
  /**
   * Most-recent placement attempt summary, available once the user has
   * a finished attempt — passed or not. Useful for callers that want to
   * surface a "you scored X%" breadcrumb.
   */
  scoreBadge: CommunityGateScoreBadge | null;
}

/**
 * Single source of truth for "where should this user go when they click
 * a Join Community / Unlock CTA". Every locked-feature surface should
 * call this hook and route to `result.destination`.
 *
 * State precedence:
 *   1. Not signed in → bounce to /auth/signin?next=<funnel-start>
 *   2. Admin-granted community access (`isCommunityEnrolled`) → already in
 *   3. Active or trialing subscription → already in
 *   4. Hasn't passed the placement test → /placement-test
 *   5. Passed test, no profile yet → /placement-test/profile/:lastEditedStep
 *   6. Profile done, no active subscription → Subscription tab in Settings
 *      (the only remaining step is payment; never bounce back to a stale
 *      previously-generated roadmap)
 *
 * Skip behaviour: queries are skipped while unauthenticated so we don't
 * hammer the backend for users who can't be funneled yet.
 */
export function useCommunityAccessGate(): CommunityGateResult {
  const { isAuthenticated } = useTypedSelector((s) => s.auth);
  const { isCommunityEnrolled } = useJourneyExperience();

  const { data: status, isLoading: statusLoading } =
    useGetPlacementTestStatusQuery(undefined, { skip: !isAuthenticated });
  const { data: subscription, isLoading: subLoading } =
    useGetCurrentSubscriptionQuery(undefined, { skip: !isAuthenticated });

  return useMemo(() => {
    if (!isAuthenticated) {
      const next = encodeURIComponent(COMMUNITY_FUNNEL_PATHS.placementTest);
      return {
        state: 'needs_sign_in' as const,
        destination: `${COMMUNITY_FUNNEL_PATHS.signIn}?next=${next}`,
        scoreBadge: null,
      };
    }

    if (isCommunityEnrolled) {
      return {
        state: 'eligible' as const,
        destination: COMMUNITY_FUNNEL_PATHS.community,
        scoreBadge: null,
      };
    }

    if (subscription && isEntitled(subscription)) {
      return {
        state: 'eligible' as const,
        destination: COMMUNITY_FUNNEL_PATHS.community,
        scoreBadge: status?.lastAttempt
          ? {
              percentage: status.lastAttempt.scorePercentage,
              level: status.lastAttempt.level,
            }
          : null,
      };
    }

    // While the status / subscription queries are still loading we don't
    // want to flicker the CTA from "Subscribe" → "Take test" → final.
    // Park on `loading` and let callers show a skeleton.
    if (statusLoading || subLoading || !status) {
      return {
        state: 'loading' as const,
        destination: COMMUNITY_FUNNEL_PATHS.placementTest,
        scoreBadge: null,
      };
    }

    const scoreBadge: CommunityGateScoreBadge | null = status.lastAttempt
      ? {
          percentage: status.lastAttempt.scorePercentage,
          level: status.lastAttempt.level,
        }
      : null;

    if (!status.passed) {
      return {
        state: 'needs_placement_test' as const,
        destination: COMMUNITY_FUNNEL_PATHS.placementTest,
        scoreBadge,
      };
    }

    if (!status.profile.completed) {
      return {
        state: 'needs_profile' as const,
        destination: profilePath(status.profile.lastEditedStep ?? 'basic'),
        scoreBadge,
      };
    }

    // Profile done, no active sub (never subscribed, trial expired, or
    // canceled) → the only thing left is payment, so send them straight
    // to the Subscription tab in Settings. We intentionally do NOT route
    // back to the roadmap: a returning user who already generated one
    // would just see stale content instead of the place where they can
    // actually re-subscribe.
    return {
      state: 'needs_subscription' as const,
      destination: COMMUNITY_FUNNEL_PATHS.subscriptionTab,
      scoreBadge,
    };
  }, [isAuthenticated, isCommunityEnrolled, status, statusLoading, subscription, subLoading]);
}

/**
 * Defense-in-depth entitlement check: status alone isn't trusted.
 * Even if the backend's lazy reconciliation hasn't run (e.g. a stale
 * cached response), an `active`/`trialing` row whose `currentPeriodEnd`
 * is already in the past doesn't count as live. Same rule as Stripe /
 * Netflix — time is the ground truth, status is just the intent.
 */
function isEntitled(
  sub:
    | {
        status: string | null | undefined;
        currentPeriodEnd?: string | null;
        trialEndsAt?: string | null;
      }
    | null
    | undefined,
): boolean {
  if (!sub) return false;
  if (sub.status !== 'active' && sub.status !== 'trialing') return false;

  const now = Date.now();
  // The trial uses `trialEndsAt`; recurring billing extends `currentPeriodEnd`.
  // For a trialing sub both are equal, but we check both for safety.
  const periodEnd = sub.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).getTime()
    : null;
  const trialEnd = sub.trialEndsAt
    ? new Date(sub.trialEndsAt).getTime()
    : null;

  // Whichever extends access furthest wins; if neither is set, fall
  // back to status-only (e.g. PENDING rows shouldn't be live anyway).
  const accessUntil = Math.max(periodEnd ?? 0, trialEnd ?? 0);
  if (accessUntil === 0) return true;
  return accessUntil > now;
}
