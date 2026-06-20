# top_coach

Frontend for TopCoach — a Vite + React + TypeScript single-page app.

## Tech stack

- **Vite 5** + **React 18** + **TypeScript**
- **Redux Toolkit** + **React Router v6**
- **Ant Design** UI
- **i18next** (internationalization)
- Observability: **Sentry** (errors), **PostHog** (product analytics), **GA4**

## Getting started

```bash
# Install dependencies (yarn is the canonical package manager — see Dockerfile)
yarn install

# Copy env template and fill in values
cp .env.example .env.local

# Start the dev server
yarn dev

# Type-check + production build
yarn build

# Preview the production build
yarn preview
```

## Environment variables

All client config is provided via `VITE_`-prefixed variables (see
[`.env.example`](.env.example)). Because they are inlined into the browser
bundle, **none of them are secrets**. Each integration is optional and stays
disabled until its key is set.

| Variable | Purpose |
| --- | --- |
| `VITE_PUBLIC_POSTHOG_KEY` | PostHog project API key (`phc_…`). Enables product analytics. |
| `VITE_PUBLIC_POSTHOG_HOST` | PostHog API host. Defaults to `https://us.i.posthog.com` (EU: `https://eu.i.posthog.com`). |
| `VITE_SENTRY_DSN` | Sentry DSN for error monitoring. |
| `VITE_SENTRY_ENVIRONMENT` | Sentry environment label (defaults to Vite's mode). |
| `VITE_GA4_MEASUREMENT_ID` | Google Analytics 4 measurement ID. |

### Analytics (PostHog)

PostHog is initialized in [`src/lib/posthog/index.tsx`](src/lib/posthog/index.tsx)
and wired into the app via `PostHogProvider` in
[`src/App.tsx`](src/App.tsx). Set `VITE_PUBLIC_POSTHOG_KEY` to enable it.

- **Pageviews** for the SPA are captured on each route change in
  [`src/lib/posthog/PostHogPageView.tsx`](src/lib/posthog/PostHogPageView.tsx)
  (automatic pageview capture is turned off to avoid double counting).
- **User identification** runs on login (`posthog.identify`) and is cleared on
  logout (`posthog.reset`).
- Use the `usePostHog()` hook anywhere in the tree to capture custom events:

  ```tsx
  import { usePostHog } from 'posthog-js/react';

  const posthog = usePostHog();
  posthog.capture('event_name', { property: 'value' });
  ```
