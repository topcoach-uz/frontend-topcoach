import React from 'react';
import GpaCalculatorPage from 'src/pages/student-hub/gpa-calculator/GpaCalculatorPage';
import './readonly-overlay.scss';

interface StudentHubGPACalculatorProps {
  studentId: string;
  studentName?: string;
}

const StudentHubGPACalculator: React.FC<StudentHubGPACalculatorProps> = ({ studentId, studentName }) => {
  // GPA Calculator is a local calculation tool, so read-only mode just disables input
  return (
    <div className="readonly-wrapper">
      <GpaCalculatorPage />
      <div className="readonly-overlay" />
    </div>
  );
};

export default StudentHubGPACalculator;

