import React from 'react';
import ApplicationsPage from 'src/pages/student-hub/applications/ApplicationsPage';
import './readonly-overlay.scss';

interface StudentHubApplicationsProps {
  studentId: string;
  studentName?: string;
}

const StudentHubApplications: React.FC<StudentHubApplicationsProps> = ({ studentId, studentName }) => {
  // Pass props directly to ApplicationsPage - no context needed
  return (
    <div className="readonly-wrapper">
      <ApplicationsPage readOnly={true} studentId={studentId} />
      <div className="readonly-overlay" />
    </div>
  );
};

export default StudentHubApplications;

