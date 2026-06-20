import { PropsWithChildren } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

/**
 * PostHog product analytics.
 *
 * Mirrors the env-guarded pattern used for Sentry / GA4 in `main.tsx`: the SDK
 * only boots when `VITE_PUBLIC_POSTHOG_KEY` is set, so local dev and previews
 * without a key are a complete no-op (no network calls, no console noise).
 *
 * Note: the PostHog project API key (`phc_…`) is a *public*, client-side token
 * that is designed to ship in the browser bundle — it is not a secret.
 */
const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

/** True when a PostHog key is configured; consumers should guard on this. */
export const posthogEnabled = Boolean(POSTHOG_KEY);

if (posthogEnabled) {
  posthog.init(POSTHOG_KEY as string, {
    api_host: POSTHOG_HOST,
    // The app uses react-router, so route changes are captured manually in
    // <PostHogPageView/>. Disable automatic pageviews to avoid double counting;
    // page-leave is still recorded for bounce/time-on-page.
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    // Only create person profiles for users we explicitly identify(), so
    // anonymous traffic doesn't inflate the tracked-person count.
    person_profiles: 'identified_only',
  });
}

/**
 * Wraps the app so descendants can use `usePostHog()` and the PostHog React
 * helpers. When PostHog isn't configured it renders children untouched.
 */
function PostHogProvider({ children }: PropsWithChildren) {
  if (!posthogEnabled) return <>{children}</>;
  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export default PostHogProvider;
export { posthog };
