import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import Loader from 'src/components/loader';
import StudentHubLayout from '../../components/student-hub/StudentHubLayout';
import StudentHubErrorBoundary from '../../components/student-hub/StudentHubErrorBoundary';
import CommunityHubMockPage from './community/CommunityHubMockPage';
import { useTypedSelector } from 'src/app/store';
import { canUseSatPrep } from 'src/lib/satPrepAccess';
import { useJourneyExperience } from 'src/contexts/JourneyExperienceContext';
import { APPLICANT_WORKSPACE_ENABLED, isOverviewLocation } from 'src/lib/applicantWorkspace';
import CoursePreview from '../learning/CoursePreview';
import ResearchIntroPreview from './research/ResearchIntroPreview';

const MyProgramsStudentPage = lazy(() => import('./my-programs/MyProgramsStudentPage'));
const ApplicantOverviewPage = lazy(() => import('./applicant/ApplicantOverviewPage'));
const LocalChangesWalkthrough = lazy(() => import('./LocalChangesWalkthrough'));
const ApplicantApplicationsPage = lazy(() => import('./applicant/ApplicantApplicationsPage'));
const ApplicantApplicationPage = lazy(() => import('./applicant/ApplicantApplicationsPage').then(module => ({ default: module.ApplicantApplicationPage })));
const ApplicantApplicationFormPage = lazy(() => import('./applicant/ApplicantApplicationFormPage'));
const ApplicantTasksPage = lazy(() => import('./applicant/ApplicantTasksPage'));
const ApplicantDocumentsPage = lazy(() => import('./applicant/ApplicantDocumentsPage'));
const ApplicantDocumentReviewPage = lazy(() => import('./applicant/ApplicantDocumentReviewPage'));
const ApplicantEssaysPage = lazy(() => import('./applicant/ApplicantEssaysPage'));
const ApplicantEssayEditorPage = lazy(() => import('./applicant/ApplicantEssaysPage').then(module => ({ default: module.ApplicantEssayEditorPage })));
const ApplicantUniversitiesPage = lazy(() => import('./applicant/ApplicantUniversitiesPage'));
const ApplicantUniversityDetailPage = lazy(() => import('./applicant/ApplicantUniversitiesPage').then(module => ({ default: module.ApplicantUniversityDetailPage })));
const ApplicantDegreeDetailPage = lazy(() => import('./applicant/ApplicantDegreeDetailPage'));
const ApplicantStudyDirectionPage = lazy(() => import('./applicant/ApplicantStudyDirectionPage'));

const NewScholarshipPage = lazy(() => import('./applications/NewScholarshipPage'));
const EditApplicationPage = lazy(() => import('./applications/EditApplicationPage'));
// Legacy engine (MAJOR_MATCH_V2_PLAN.md §0/§7) — the module stays compiled
// (src/pages/student-hub/psychometric-assessment/, backend module, DB
// tables) but as of the Stage 5 cutover it is no longer imported from this
// file. Retirement (unmount + delete) is a separate, explicitly deferred
// stage — this comment is the pointer for whoever does that later.
// Major Match v2 (MAJOR_MATCH_V2_PLAN.md Stage 5 cutover) — now the live
// engine at all four production mounts (this route included).
const MajorMatchV2Page = lazy(() => import('./major-match-v2/MajorMatchV2Page'));
const IeltsPrepPage = lazy(() => import('./ielts-prep/IeltsPrepPage'));
const SatPrepLayout = lazy(() => import('src/components/sat-prep/SatPrepLayout'));
const SatDashboardPage = lazy(() => import('./sat-prep/SatDashboardPage'));
const SatPracticeFlowPage = lazy(() => import('./sat-prep/SatPracticeFlowPage'));
const SatTestPacksPage = lazy(() => import('./sat-prep/SatTestPacksPage'));
const SatMockTestsPage = lazy(() => import('./sat-prep/SatMockTestsPage'));
const SatTestRunnerPage = lazy(() => import('./sat-prep/SatMockTestPage'));
const SatReviewPage = lazy(() => import('./sat-prep/SatReviewPage'));
const SatLibraryPage = lazy(() => import('./sat-prep/SatLibraryPage'));

const RouteFallback = () => <Loader height="60vh" />;

const withSuspense = (node: React.ReactNode) => <Suspense fallback={<RouteFallback />}>{node}</Suspense>;

const HubEntry = () => {
  const location = useLocation();
  if (APPLICANT_WORKSPACE_ENABLED && isOverviewLocation(location.pathname, location.search)) {
    return withSuspense(<ApplicantOverviewPage />);
  }
  return <CommunityHubMockPage embedded={APPLICANT_WORKSPACE_ENABLED} />;
};

/** Full-width shell for standalone psychometric route — matches hub vertical rhythm (hubDashEmbed ≈ 20px) */
/** Redirect /student-hub/profile → hub shell, preserving extra params like ?tab= */
const ProfileRedirect = () => {
  const [params] = useSearchParams();
  const next = new URLSearchParams(params);
  next.set('section', 'others');
  next.set('target', 'profile');
  return <Navigate to={`/student-hub?${next.toString()}`} replace />;
};

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
  return <CoursePreview course="sat" />;
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
  return <ResearchIntroPreview />;
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
          {import.meta.env.DEV && <Route path="/local-walkthrough" element={withSuspense(<LocalChangesWalkthrough />)} />}
          <Route
            path="/settings"
            element={<Navigate to="/student-hub?section=account&target=settings" replace />}
          />
          <Route path="/community" element={<Navigate to="/student-hub" replace />} />
          <Route path="/" element={<HubEntry />} />
          <Route path="/attendance" element={<Navigate to="/student-hub?section=others&target=full-support" replace />} />
          <Route path="/sessions" element={<Navigate to="/student-hub/overview" replace />} />
          <Route path="/overview" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantOverviewPage />) : <Navigate to="/student-hub?section=dashboard" replace />} />
          <Route path="/dashboard" element={<Navigate to="/student-hub?section=dashboard" replace />} />
          <Route path="/rewards" element={<Navigate to="/student-hub?section=account&target=rewards" replace />} />
          <Route path="/profile" element={<ProfileRedirect />} />
          <Route path="/profile/*" element={<ProfileRedirect />} />

          {/* College list flows must be real routes — ApplicationsPage switches on pathname for new/edit.
              College List now lives as a tab inside the Profile hub (target=profile&tab=college-lists). */}
          <Route
            path="/applications/new"
            element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantApplicationFormPage />) : <Navigate to="/student-hub?section=others&target=profile&tab=college-lists&applicationFlow=new" replace />}
          />
          <Route path="/applications/scholarships/new" element={withSuspense(<NewScholarshipPage />)} />
          <Route path="/applications/:applicationId/edit" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantApplicationFormPage />) : withSuspense(<EditApplicationPage />)} />
          <Route path="/applications/:applicationId" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantApplicationPage />) : <Navigate to="/student-hub?section=others&target=profile&tab=college-lists" replace />} />
          <Route path="/applications" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantApplicationsPage />) : <Navigate to="/student-hub?section=others&target=profile&tab=college-lists" replace />} />
          <Route path="/tasks" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantTasksPage />) : <Navigate to="/student-hub/applications?tab=tasks" replace />} />

          <Route path="/essays/new" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantEssaysPage />) : <Navigate to="/student-hub?section=others&target=essays" replace />} />
          <Route path="/essays/:essayId" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantEssayEditorPage />) : <Navigate to="/student-hub?section=others&target=essays" replace />} />
          <Route path="/essays" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantEssaysPage />) : <Navigate to="/student-hub?section=others&target=essays" replace />} />
          <Route path="/gpa-calculator" element={<Navigate to="/student-hub?section=others&target=gpa-calculator" replace />} />
          <Route path="/gpa-calculator/*" element={<Navigate to="/student-hub?section=others&target=gpa-calculator" replace />} />
          <Route path="/admissions-program" element={<Navigate to="/student-hub?section=learning&tab=admissions" replace />} />
          <Route path="/admissions-program/*" element={<Navigate to="/student-hub?section=learning&tab=admissions" replace />} />
          {/* Documents now lives as a tab inside the Profile hub (target=profile&tab=documents). */}
          <Route path="/documents" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantDocumentsPage />) : <Navigate to="/student-hub?section=others&target=profile&tab=documents" replace />} />
          <Route path="/documents/:documentId" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantDocumentReviewPage />) : <Navigate to="/student-hub/documents" replace />} />
          <Route path="/universities/:universityId/degrees/:degreeSlug" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantDegreeDetailPage />) : <Navigate to="/universities" replace />} />
          <Route path="/universities/:universityId" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantUniversityDetailPage />) : <Navigate to="/universities" replace />} />
          <Route path="/universities" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantUniversitiesPage />) : <Navigate to="/universities" replace />} />
          <Route path="/study-direction" element={APPLICANT_WORKSPACE_ENABLED ? withSuspense(<ApplicantStudyDirectionPage />) : <Navigate to="/student-hub?section=others&target=profile&tab=academic" replace />} />

          {/* Major Match v2 (MAJOR_MATCH_V2_PLAN.md Stage 5 cutover).
              Old URL kept per plan §6 Q10 — deep links in the wild — but now
              renders the v2 experience. Preserve ?step= & ?sessionId= (legacy
              query params some links may still carry) by not redirecting. */}
          <Route
            path="/psychometric-assessment"
            element={
              <PsychometricRouteShell>{withSuspense(<MajorMatchV2Page />)}</PsychometricRouteShell>
            }
          />
          <Route
            path="/psychometric-assessment/*"
            element={
              <PsychometricRouteShell>{withSuspense(<MajorMatchV2Page />)}</PsychometricRouteShell>
            }
          />

          <Route path="/ielts-prep/*" element={withSuspense(<IeltsPrepPage />)} />

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
            path="/sat-prep/review"
            element={withSuspense(<SatGate><SatPrepLayout><SatReviewPage /></SatPrepLayout></SatGate>)}
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
          <Route path="/my-programs" element={withSuspense(<MyProgramsStudentPage />)} />
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
