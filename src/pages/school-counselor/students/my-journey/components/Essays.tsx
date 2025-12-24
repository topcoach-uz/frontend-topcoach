import React from 'react';
import EssaysPage from 'src/pages/student-hub/essays/EssaysPage';
import './readonly-overlay.scss';

interface StudentHubEssaysProps {
  studentId: string;
  studentName?: string;
}

const StudentHubEssays: React.FC<StudentHubEssaysProps> = ({ studentId, studentName }) => {
  // Pass props directly to EssaysPage - no context needed
  return (
    <div className="readonly-wrapper">
      <EssaysPage readOnly={true} studentId={studentId} />
      <div className="readonly-overlay" />
    </div>
  );
};

export default StudentHubEssays;

