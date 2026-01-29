import React from 'react';
import Dashboard from 'src/pages/student-hub/Dashboard';
import './readonly-overlay.scss';

interface StudentHubDashboardProps {
  studentId: string;
  studentName?: string;
}

const StudentHubDashboard: React.FC<StudentHubDashboardProps> = ({ studentId, studentName }) => {
  // Pass props directly to Dashboard - no context needed
  // studentId is the userId from the URL
  return (
    <div className="readonly-wrapper">
      <Dashboard 
        readOnly={true} 
        studentId={studentId} 
        studentName={studentName} 
      />
      <div className="readonly-overlay" />
    </div>
  );
};

export default StudentHubDashboard;

