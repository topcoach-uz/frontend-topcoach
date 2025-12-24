import React from 'react';
import GpaCalculatorPage from 'src/pages/student-hub/gpa-calculator/GpaCalculatorPage';
import { StudentContext } from '../context/StudentContext';
import './readonly-overlay.scss';

interface StudentHubGPACalculatorProps {
  studentId: string;
}

const StudentHubGPACalculator: React.FC<StudentHubGPACalculatorProps> = ({ studentId }) => {
  return (
    <StudentContext.Provider value={{ studentId, readOnly: true }}>
      <div className="readonly-wrapper">
        <GpaCalculatorPage />
        <div className="readonly-overlay" />
      </div>
    </StudentContext.Provider>
  );
};

export default StudentHubGPACalculator;

