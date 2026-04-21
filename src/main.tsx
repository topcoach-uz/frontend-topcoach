import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';

import './styles/global.scss';
import './lib/fontawesome';

// Initialize Sentry
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development';

if (SENTRY_DSN) {
  const isProd = SENTRY_ENVIRONMENT === 'production';
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring — 100% sampling adds measurable overhead on every
    // route transition. Keep it high in dev for debugging, low in prod.
    tracesSampleRate: isProd ? 0.1 : 1.0,
    // Session Replay — record 1% of normal sessions, 100% of errored ones.
    replaysSessionSampleRate: isProd ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Initialize Google Analytics 4
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;
if (GA4_MEASUREMENT_ID) {
  // Load GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize GA4
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', GA4_MEASUREMENT_ID);
  
  // Make gtag available globally
  (window as any).gtag = gtag;
}

window.addEventListener('vite:preloadError', (event) => {
  window.location.reload(); // for example, refresh the page
});

createRoot(document.getElementById('root')!).render(<App />);
