/**
 * Gate for /student-hub: redirect mentors (except oumarovna, sheraliozodov6) and
 * counselors (except sheraliozodov6) to /. Always allow sheraliozodov6@gmail.com.
 */

import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useGetMeQuery } from 'src/app/services/users';
import { useTypedSelector } from 'src/app/store';
import { useCounselorStatus } from 'src/hooks/useCounselorStatus';
import StudentHubRoutes from './StudentHubRoutes';

const SUPER_ADMIN_EMAIL = 'sheraliozodov6@gmail.com';
const CEO_MENTOR_EMAIL = 'oumarovna@gmail.com';

export default function StudentHubGate() {
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const { data: userData, isLoading: profileLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const currentUser = userData ?? useTypedSelector((s) => s.auth.profile);
  const email = currentUser?.email;
  const isMentor = currentUser?.profile?.role === 'Mentor';

  const { isCounselor, isLoading: counselorLoading } = useCounselorStatus(
    !isAuthenticated || profileLoading
  );

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (profileLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (email === SUPER_ADMIN_EMAIL) {
    return <StudentHubRoutes />;
  }

  if (isMentor && email !== CEO_MENTOR_EMAIL) {
    return <Navigate to="/" replace />;
  }

  if (counselorLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isCounselor) {
    return <Navigate to="/" replace />;
  }

  return <StudentHubRoutes />;
}
