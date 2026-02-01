import React from 'react';
import OpportunitiesPage from 'src/pages/student-hub/opportunities/OpportunitiesPage';
import './readonly-overlay.scss';

interface StudentHubOpportunitiesProps {
  studentId: string;
  studentName?: string;
}

const StudentHubOpportunities: React.FC<StudentHubOpportunitiesProps> = ({ studentId, studentName }) => {
  return (
    <div className="readonly-wrapper">
      <OpportunitiesPage />
      <div className="readonly-overlay" />
    </div>
  );
};

export default StudentHubOpportunities;
