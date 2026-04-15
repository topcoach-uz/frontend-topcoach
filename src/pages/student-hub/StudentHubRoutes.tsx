import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import StudentHubLayout from '../../components/student-hub/StudentHubLayout';
import StudentHubErrorBoundary from '../../components/student-hub/StudentHubErrorBoundary';
import CommunityHubMockPage from './community/CommunityHubMockPage';

const NewScholarshipPage = lazy(() => import('./applications/NewScholarshipPage'));
const EditApplicationPage = lazy(() => import('./applications/EditApplicationPage'));
const PsychometricAssessmentPage = lazy(() => import('./psychometric-assessment/PsychometricAssessmentPage'));

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
