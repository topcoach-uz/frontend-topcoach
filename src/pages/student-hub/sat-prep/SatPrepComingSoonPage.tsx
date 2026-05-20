/**
 * SAT Prep "coming soon" placeholder. Shown to anyone who isn't on the
 * SuperAdmin / Owner allowlist while the product is gated by
 * SAT_PREP_SHOW_ALL = false. Sits inside the existing SatPrepLayout so
 * the breadcrumb + tabs still render — keeps the user oriented and lets
 * them go back without a separate top bar.
 *
 * Visual: the real Test Packs page is rendered behind a heavy blur as a
 * teaser, with the CommunityLockedPage (sat-course variant) portaled on
 * top to drive the unlock funnel. We deliberately do NOT list product
 * specifics like question counts in the lock copy — that lives in the
 * unblurred page once the user is enrolled.
 */

import React from 'react';
import SatTestPacksPage from './SatTestPacksPage';
import CommunityLockedPage from '../community/CommunityLockedPage';
import './sat-prep-coming-soon.scss';

const SatPrepComingSoonPage: React.FC = () => {
  return (
    <>
      {/* Blurred, non-interactive preview of the real Test Packs page so
          the user sees what they'd unlock — not a generic stub. */}
      <div
        className="sat-soon__preview"
        aria-hidden
        // inert keeps focus/tab navigation out of the blurred subtree;
        // pointer-events is also belt-and-braces in case a browser ignores
        // the attribute (Safari < 17).
        // @ts-expect-error — `inert` is valid HTML; React types lag.
        inert=""
      >
        <SatTestPacksPage />
      </div>

      {/* The lock modal portals to <body>, so it overlays the blurred page
          and the layout chrome above it. */}
      <CommunityLockedPage variant="sat-course" />
    </>
  );
};

export default SatPrepComingSoonPage;
