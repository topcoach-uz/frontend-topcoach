import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loader from 'src/components/loader';
import StudentHubLayout from '../../components/student-hub/StudentHubLayout';
import StudentHubErrorBoundary from '../../components/student-hub/StudentHubErrorBoundary';
import CommunityHubMockPage from './community/CommunityHubMockPage';
import { useTypedSelector } from 'src/app/store';
import { canUseSatPrep } from 'src/lib/satPrepAccess';
import { useJourneyExperience } from 'src/contexts/JourneyExperienceContext';

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
const ResearchPrepLockedPreview = lazy(() => import('./research/ResearchPrepLockedPreview'));
const CommunityLockedPage = lazy(() => import('./community/CommunityLockedPage'));

const RouteFallback = () => <Loader height="60vh" />;

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
  const { isCommunityEnrolled } = useJourneyExperience();
  // SAT Prep is unlocked by: (a) admin/tester via canUseSatPrep, OR
  // (b) Community enrollment. Non-community users see the blurred-
  // preview + sat-course lock modal until they enroll.
  const allowed =
    canUseSatPrep(profile?.managementRole as string | undefined, profile?.email) ||
    isCommunityEnrolled;
  if (allowed) return children;
  return (
    <SatPrepLayout>
      <SatPrepComingSoonPage />
    </SatPrepLayout>
  );
};

/**
 * Standalone Research Prep surface. Community-enrolled users get the
 * real ResearchPrepPage. Everyone else lands on the locked-preview
 * silhouette overlaid with the research-program community-lock modal.
 * No in-app hub sidebar — StudentHubLayout's `hideSidebar` covers
 * `/student-hub/research-prep` so the preview spans the full width
 * (matches the SAT Prep treatment).
 */
const ResearchPrepLockedSurface: React.FC = () => {
  const { isCommunityEnrolled } = useJourneyExperience();
  if (isCommunityEnrolled) {
    // Defer to a redirect into the in-hub research section, which has
    // the real ResearchPrepPage wired up with mentor/Full-Support context.
    return <Navigate to="/student-hub?section=research-program" replace />;
  }
  return (
    <>
      <div
        aria-hidden
        // @ts-expect-error — `inert` is valid HTML; React types lag.
        inert=""
        style={{
          filter: 'blur(6px)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <ResearchPrepLockedPreview />
      </div>
      {/* Portaled to body — overlays the blurred surface with the
          research-program unlock modal (transparent backdrop so the
          preview reads through). */}
      <CommunityLockedPage variant="research-program" />
    </>
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

          {/* Research Prep — own self-contained surface, same treatment
              as SAT Prep. Non-community users see a blurred preview +
              community-lock modal; community users get the real page.
              StudentHubLayout hides its Ant sidebar on this path so the
              preview renders edge-to-edge (no in-app hub sidebar). */}
          <Route
            path="/research-prep"
            element={withSuspense(<ResearchPrepLockedSurface />)}
          />

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
