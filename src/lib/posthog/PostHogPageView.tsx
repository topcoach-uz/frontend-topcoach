import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { posthog, posthogEnabled } from 'src/lib/posthog';

/**
 * Drives the PostHog tracking that depends on app state. Renders nothing.
 *
 *  - Captures a `$pageview` on first load and on every react-router navigation.
 *    SPA route changes aren't auto-tracked (automatic pageview capture is turned
 *    off in the PostHog config), so we do it here off `useLocation`.
 *  - Identifies the signed-in user — and resets on logout — so events are tied
 *    to a stable person across sessions.
 *
 * Must be mounted inside the router (for `useLocation`); it reads auth state
 * from the Redux store, which sits above the router in the provider tree.
 */
export default function PostHogPageView() {
  const location = useLocation();
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const profile = useTypedSelector((s) => s.auth.profile);
  const identifiedId = useRef<string | null>(null);

  // Pageview on mount + every route change.
  useEffect(() => {
    if (!posthogEnabled) return;
    posthog.capture('$pageview', { $current_url: window.location.href });
  }, [location.pathname, location.search]);

  // Associate events with the logged-in user; clear identity on logout.
  useEffect(() => {
    if (!posthogEnabled) return;

    const userId = profile?.id;
    if (isAuthenticated && userId) {
      if (identifiedId.current !== userId) {
        posthog.identify(userId, {
          email: profile?.email,
          name: profile?.profile?.name,
          role: profile?.profile?.role,
          managementRole: profile?.managementRole,
        });
        identifiedId.current = userId;
      }
    } else if (!isAuthenticated && identifiedId.current) {
      posthog.reset();
      identifiedId.current = null;
    }
  }, [
    isAuthenticated,
    profile?.id,
    profile?.email,
    profile?.profile?.name,
    profile?.profile?.role,
    profile?.managementRole,
  ]);

  return null;
}
