import React from 'react';
import PsychometricAssessmentPage from 'src/pages/student-hub/psychometric-assessment/PsychometricAssessmentPage';
import './readonly-overlay.scss';

interface StudentHubPsychometricAssessmentProps {
  studentId: string;
  studentName?: string;
}

const StudentHubPsychometricAssessment: React.FC<StudentHubPsychometricAssessmentProps> = ({ studentId, studentName }) => {
  // Pass props directly to PsychometricAssessmentPage - no context needed
  // studentId is the userId from the URL
  return (
    <div className="readonly-wrapper">
      <PsychometricAssessmentPage 
        readOnly={true} 
        studentId={studentId} 
      />
      <div className="readonly-overlay" />
    </div>
  );
};

export default StudentHubPsychometricAssessment;

