import React from 'react';
import CounselorDashboard from './CounselorDashboard';

interface StudentHubDashboardProps {
  studentId: string;
  studentName?: string;
}

const StudentHubDashboard: React.FC<StudentHubDashboardProps> = ({ studentId, studentName }) => {
  return <CounselorDashboard studentId={studentId} studentName={studentName} />;
};

export default StudentHubDashboard;

