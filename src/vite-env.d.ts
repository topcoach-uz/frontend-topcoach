/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** PostHog project API key (`phc_…`). Public, client-side token. Analytics is disabled when unset. */
  readonly VITE_PUBLIC_POSTHOG_KEY?: string;
  /** PostHog API host. Defaults to https://us.i.posthog.com (use https://eu.i.posthog.com for EU). */
  readonly VITE_PUBLIC_POSTHOG_HOST?: string;

  /** Sentry DSN. Error monitoring is disabled when unset. */
  readonly VITE_SENTRY_DSN?: string;
  /** Sentry environment label. Falls back to Vite's MODE. */
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  /** Google Analytics 4 measurement ID. GA is disabled when unset. */
  readonly VITE_GA4_MEASUREMENT_ID?: string;
}
