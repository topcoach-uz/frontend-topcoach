import React from 'react';
import Dashboard from 'src/pages/student-hub/Dashboard';
import { StudentContext } from '../context/StudentContext';
import './readonly-overlay.scss';

interface StudentHubDashboardProps {
  studentId: string;
}

const StudentHubDashboard: React.FC<StudentHubDashboardProps> = ({ studentId }) => {
  return (
    <StudentContext.Provider value={{ studentId, readOnly: true }}>
      <div className="readonly-wrapper">
        <Dashboard />
        <div className="readonly-overlay" />
      </div>
    </StudentContext.Provider>
  );
};

export default StudentHubDashboard;

