import React from 'react';
import ApplicationsPage from 'src/pages/student-hub/applications/ApplicationsPage';
import { StudentContext } from '../context/StudentContext';
import './readonly-overlay.scss';

interface StudentHubApplicationsProps {
  studentId: string;
}

const StudentHubApplications: React.FC<StudentHubApplicationsProps> = ({ studentId }) => {
  return (
    <StudentContext.Provider value={{ studentId, readOnly: true }}>
      <div className="readonly-wrapper">
        <ApplicationsPage />
        <div className="readonly-overlay" />
      </div>
    </StudentContext.Provider>
  );
};

export default StudentHubApplications;

