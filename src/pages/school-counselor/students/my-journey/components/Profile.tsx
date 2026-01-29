import React from 'react';
import ProfilePage from 'src/pages/student-hub/profile/ProfilePage';
import './readonly-overlay.scss';

interface StudentHubProfileProps {
  studentId: string;
  studentName?: string;
}

const StudentHubProfile: React.FC<StudentHubProfileProps> = ({ studentId, studentName }) => {
  // Pass props directly to ProfilePage - no context needed  
  // Note: ProfilePage uses useStudentProfile hook which accepts studentId parameter
  return (
    <div className="readonly-wrapper">
      <ProfilePage readOnly={true} studentId={studentId} />
      <div className="readonly-overlay" />
    </div>
  );
};

export default StudentHubProfile;

