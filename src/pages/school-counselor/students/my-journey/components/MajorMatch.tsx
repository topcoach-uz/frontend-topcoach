import React from 'react';
import MajorMatchPage from 'src/pages/student-hub/major-match/MajorMatchPage';
import { StudentContext } from '../context/StudentContext';
import './readonly-overlay.scss';

interface StudentHubMajorMatchProps {
  studentId: string;
}

const StudentHubMajorMatch: React.FC<StudentHubMajorMatchProps> = ({ studentId }) => {
  return (
    <StudentContext.Provider value={{ studentId, readOnly: true }}>
      <div className="readonly-wrapper">
        <MajorMatchPage />
        <div className="readonly-overlay" />
      </div>
    </StudentContext.Provider>
  );
};

export default StudentHubMajorMatch;

