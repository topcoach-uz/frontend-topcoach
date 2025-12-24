import React from 'react';
import EssaysPage from 'src/pages/student-hub/essays/EssaysPage';
import { StudentContext } from '../context/StudentContext';
import './readonly-overlay.scss';

interface StudentHubEssaysProps {
  studentId: string;
}

const StudentHubEssays: React.FC<StudentHubEssaysProps> = ({ studentId }) => {
  return (
    <StudentContext.Provider value={{ studentId, readOnly: true }}>
      <div className="readonly-wrapper">
        <EssaysPage />
        <div className="readonly-overlay" />
      </div>
    </StudentContext.Provider>
  );
};

export default StudentHubEssays;

