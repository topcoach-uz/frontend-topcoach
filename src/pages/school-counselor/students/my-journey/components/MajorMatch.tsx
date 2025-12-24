import React from 'react';
import MajorMatchPage from 'src/pages/student-hub/major-match/MajorMatchPage';
import './readonly-overlay.scss';

interface StudentHubMajorMatchProps {
  studentId: string;
  studentName?: string;
}

const StudentHubMajorMatch: React.FC<StudentHubMajorMatchProps> = ({ studentId, studentName }) => {
  // Pass props directly to MajorMatchPage - no context needed
  return (
    <div className="readonly-wrapper">
      <MajorMatchPage readOnly={true} studentId={studentId} />
      <div className="readonly-overlay" />
    </div>
  );
};

export default StudentHubMajorMatch;

