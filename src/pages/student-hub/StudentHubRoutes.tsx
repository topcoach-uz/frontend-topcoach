import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
          {/* TODO: Implement notifications page later */}
          {/* <Route path="/notifications" element={<NotificationsPage />} /> */}
          {/* <Route path="/notifications/*" element={<NotificationsPage />} /> */}
        </Routes>
      </StudentHubLayout>
    </StudentHubErrorBoundary>
  );
};

export default StudentHubRoutes;