import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentHubLayout from '../../components/student-hub/StudentHubLayout';
import StudentHubErrorBoundary from '../../components/student-hub/StudentHubErrorBoundary';
import Dashboard from './Dashboard';
import ProfilePage from './profile/ProfilePage';
import ApplicationsPage from './applications/ApplicationsPage';
import EssaysPage from './essays/EssaysPage';
import GpaCalculatorPage from './gpa-calculator/GpaCalculatorPage';
import DocumentsPage from './documents/DocumentsPage';
import PsychometricAssessmentPage from './psychometric-assessment/PsychometricAssessmentPage';
import AdmissionsProgramPage from './admissions-program/AdmissionsProgramPage';
import OpportunitiesPage from './opportunities/OpportunitiesPage';
import ProgramsPage from './programs/ProgramsPage';
import SettingsPage from './settings/SettingsPage';
import TimelinePage from './timeline/TimelinePage';
import UniversityMatcherPage from './university-matcher/UniversityMatcherPage';
import FullSupportStudentPage from './full-support/FullSupportStudentPage';
// TODO: Implement notifications page later
// import NotificationsPage from './notifications/NotificationsPage';

const StudentHubRoutes: React.FC = () => {
  return (
    <StudentHubErrorBoundary>
      <StudentHubLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/*" element={<ProfilePage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/*" element={<ApplicationsPage />} />
          <Route path="/essays" element={<EssaysPage />} />
          <Route path="/essays/*" element={<EssaysPage />} />
          <Route path="/gpa-calculator" element={<GpaCalculatorPage />} />
          <Route path="/gpa-calculator/*" element={<GpaCalculatorPage />} />
          <Route path="/admissions-program" element={<AdmissionsProgramPage />} />
          <Route path="/admissions-program/*" element={<AdmissionsProgramPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/*" element={<DocumentsPage />} />
          <Route path="/psychometric-assessment" element={<PsychometricAssessmentPage />} />
          <Route path="/psychometric-assessment/*" element={<PsychometricAssessmentPage />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/opportunities/*" element={<OpportunitiesPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/programs/*" element={<ProgramsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/*" element={<SettingsPage />} />
          <Route path="/full-support" element={<FullSupportStudentPage />} />
          <Route path="/full-support/*" element={<FullSupportStudentPage />} />
          {/* Redirects for merged pages */}
          <Route path="/timeline" element={<Navigate to="/student-hub/applications?tab=timeline" replace />} />
          <Route path="/timeline/*" element={<Navigate to="/student-hub/applications?tab=timeline" replace />} />
          <Route path="/university-matcher" element={<Navigate to="/student-hub/psychometric-assessment?step=results&tab=universities" replace />} />
          <Route path="/university-matcher/*" element={<Navigate to="/student-hub/psychometric-assessment?step=results&tab=universities" replace />} />
          <Route path="/settings" element={<Navigate to="/student-hub/profile?tab=settings" replace />} />
          <Route path="/settings/*" element={<Navigate to="/student-hub/profile?tab=settings" replace />} />
          <Route path="/programs" element={<Navigate to="/student-hub/opportunities?tab=programs" replace />} />
          <Route path="/programs/*" element={<Navigate to="/student-hub/opportunities?tab=programs" replace />} />
          {/* TODO: Implement notifications page later */}
          {/* <Route path="/notifications" element={<NotificationsPage />} /> */}
          {/* <Route path="/notifications/*" element={<NotificationsPage />} /> */}
        </Routes>
      </StudentHubLayout>
    </StudentHubErrorBoundary>
  );
};

export default StudentHubRoutes;