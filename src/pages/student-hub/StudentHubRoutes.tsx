import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import StudentHubLayout from '../../components/student-hub/StudentHubLayout';
import StudentHubErrorBoundary from '../../components/student-hub/StudentHubErrorBoundary';
import CommunityHubMockPage from './community/CommunityHubMockPage';
import { useTypedSelector } from 'src/app/store';
import { canUseSatPrep } from 'src/lib/satPrepAccess';

const NewScholarshipPage = lazy(() => import('./applications/NewScholarshipPage'));
const EditApplicationPage = lazy(() => import('./applications/EditApplicationPage'));
const PsychometricAssessmentPage = lazy(() => import('./psychometric-assessment/PsychometricAssessmentPage'));
const SatPrepLayout = lazy(() => import('src/components/sat-prep/SatPrepLayout'));
const SatDashboardPage = lazy(() => import('./sat-prep/SatDashboardPage'));
const SatPracticeFlowPage = lazy(() => import('./sat-prep/SatPracticeFlowPage'));
const SatTestPacksPage = lazy(() => import('./sat-prep/SatTestPacksPage'));
const SatMockTestsPage = lazy(() => import('./sat-prep/SatMockTestsPage'));
const SatTestRunnerPage = lazy(() => import('./sat-prep/SatMockTestPage'));
const SatLibraryPage = lazy(() => import('./sat-prep/SatLibraryPage'));
const SatPrepComingSoonPage = lazy(() => import('./sat-prep/SatPrepComingSoonPage'));

const RouteFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240, padding: 48 }}>
    <Spin size="large" />
  </div>
);

const withSuspense = (node: React.ReactNode) => <Suspense fallback={<RouteFallback />}>{node}</Suspense>;

/** Full-width shell for standalone psychometric route — matches hub vertical rhythm (hubDashEmbed ≈ 20px) */
const PsychometricRouteShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ paddingTop: 20, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>{children}</div>
);

/**
 * SAT Prep is gated by `SAT_PREP_SHOW_ALL` (see src/lib/satPrepAccess.ts).
 * If the flag is `false` and the user isn't a SuperAdmin/Owner, every SAT
 * route falls through to the SatPrepComingSoonPage. The runner is gated
 * the same way, so a logged-out tab can't deep-link past the placeholder.
 */
const SatGate: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const profile = useTypedSelector((s) => s.auth.profile);
  const allowed = canUseSatPrep(
    profile?.managementRole as string | undefined,
    profile?.email,
  );
  if (allowed) return children;
  return (
    <SatPrepLayout>
      <SatPrepComingSoonPage />
    </SatPrepLayout>
  );
};

/**
 * All mentees use the unified Community Hub shell (`CommunityHubMockPage`) with the same left column.
 * Enrollment state (mock) controls feed vs dashboard default and locked learning items.
 */
const StudentHubRoutes: React.FC = () => {
  return (
    <StudentHubErrorBoundary>
      <StudentHubLayout>
        <Routes>
          <Route
            path="/settings"
            element={<Navigate to="/student-hub?section=account&target=settings" replace />}
          />
          <Route path="/community" element={<Navigate to="/student-hub" replace />} />
          <Route path="/" element={<CommunityHubMockPage />} />
          <Route path="/dashboard" element={<Navigate to="/student-hub?section=dashboard" replace />} />
          <Route path="/rewards" element={<Navigate to="/student-hub?section=account&target=rewards" replace />} />
          <Route path="/profile" element={<Navigate to="/student-hub?section=others&target=profile" replace />} />
          <Route path="/profile/*" element={<Navigate to="/student-hub?section=others&target=profile" replace />} />

          {/* College list flows must be real routes — ApplicationsPage switches on pathname for new/edit */}
          <Route
            path="/applications/new"
            element={<Navigate to="/student-hub?section=others&target=college-lists&applicationFlow=new" replace />}
          />
          <Route path="/applications/scholarships/new" element={withSuspense(<NewScholarshipPage />)} />
          <Route path="/applications/:applicationId/edit" element={withSuspense(<EditApplicationPage />)} />
          <Route path="/applications" element={<Navigate to="/student-hub?section=others&target=college-lists" replace />} />
          <Route path="/applications/*" element={<Navigate to="/student-hub?section=others&target=college-lists" replace />} />

          <Route path="/essays" element={<Navigate to="/student-hub?section=others&target=essays" replace />} />
          <Route path="/essays/*" element={<Navigate to="/student-hub?section=others&target=essays" replace />} />
          <Route path="/gpa-calculator" element={<Navigate to="/student-hub?section=others&target=gpa-calculator" replace />} />
          <Route path="/gpa-calculator/*" element={<Navigate to="/student-hub?section=others&target=gpa-calculator" replace />} />
          <Route path="/admissions-program" element={<Navigate to="/student-hub?section=learning&tab=admissions" replace />} />
          <Route path="/admissions-program/*" element={<Navigate to="/student-hub?section=learning&tab=admissions" replace />} />
          <Route path="/documents" element={<Navigate to="/student-hub?section=others&target=documents" replace />} />
          <Route path="/documents/*" element={<Navigate to="/student-hub?section=others&target=documents" replace />} />

          {/* Preserve ?step= & ?sessionId= for start / resume / results — do not redirect to hub (strips query) */}
          <Route
            path="/psychometric-assessment"
            element={
              <PsychometricRouteShell>{withSuspense(<PsychometricAssessmentPage />)}</PsychometricRouteShell>
            }
          />
          <Route
            path="/psychometric-assessment/*"
            element={
              <PsychometricRouteShell>{withSuspense(<PsychometricAssessmentPage />)}</PsychometricRouteShell>
            }
          />

          {/* SAT Prep — full College Board question bank, wrapped in shared shell.
              Gated by SatGate (SAT_PREP_SHOW_ALL flag) so non-SuperAdmins
              currently see the "coming soon" placeholder. */}
          <Route
            path="/sat-prep"
            element={withSuspense(<SatGate><SatPrepLayout><SatDashboardPage /></SatPrepLayout></SatGate>)}
          />
          <Route
            path="/sat-prep/practice"
            element={withSuspense(<SatGate><SatPrepLayout><SatPracticeFlowPage /></SatPrepLayout></SatGate>)}
          />
          <Route
            path="/sat-prep/test-packs"
            element={withSuspense(<SatGate><SatPrepLayout><SatTestPacksPage /></SatPrepLayout></SatGate>)}
          />
          <Route
            path="/sat-prep/mock-tests"
            element={withSuspense(<SatGate><SatPrepLayout><SatMockTestsPage /></SatPrepLayout></SatGate>)}
          />
          <Route
            path="/sat-prep/library"
            element={withSuspense(<SatGate><SatPrepLayout><SatLibraryPage /></SatPrepLayout></SatGate>)}
          />
          <Route
            path="/sat-prep/runner"
            element={withSuspense(<SatGate><PsychometricRouteShell><SatTestRunnerPage /></PsychometricRouteShell></SatGate>)}
          />
          {/* Back-compat for the old /mock-test path */}
          <Route path="/sat-prep/mock-test" element={<Navigate to="/student-hub/sat-prep/runner" replace />} />

          <Route path="/opportunities" element={<Navigate to="/student-hub?section=others&target=opportunities" replace />} />
          <Route path="/opportunities/*" element={<Navigate to="/student-hub?section=others&target=opportunities" replace />} />
          <Route path="/programs" element={<Navigate to="/student-hub?section=others&target=programs" replace />} />
          <Route path="/programs/*" element={<Navigate to="/student-hub?section=others&target=programs" replace />} />
          <Route path="/full-support" element={<Navigate to="/student-hub?section=others&target=full-support" replace />} />
          <Route path="/full-support/*" element={<Navigate to="/student-hub?section=others&target=full-support" replace />} />
          <Route path="/timeline" element={<Navigate to="/student-hub/applications?tab=timeline" replace />} />
          <Route path="/timeline/*" element={<Navigate to="/student-hub/applications?tab=timeline" replace />} />
          <Route path="/university-matcher" element={<Navigate to="/student-hub/psychometric-assessment?step=results&tab=universities" replace />} />
          <Route path="/university-matcher/*" element={<Navigate to="/student-hub/psychometric-assessment?step=results&tab=universities" replace />} />
          <Route path="*" element={<Navigate to="/student-hub" replace />} />
        </Routes>
      </StudentHubLayout>
    </StudentHubErrorBoundary>
  );
};

export default StudentHubRoutes;
