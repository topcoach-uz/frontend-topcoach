import React from 'react';
import ProfilePage from 'src/pages/student-hub/profile/ProfilePage';
import { StudentContext } from '../context/StudentContext';
import './readonly-overlay.scss';

interface StudentHubProfileProps {
  studentId: string;
}

const StudentHubProfile: React.FC<StudentHubProfileProps> = ({ studentId }) => {
  return (
    <StudentContext.Provider value={{ studentId, readOnly: true }}>
      <div className="readonly-wrapper">
        <ProfilePage />
        <div className="readonly-overlay" />
      </div>
    </StudentContext.Provider>
  );
};

export default StudentHubProfile;

