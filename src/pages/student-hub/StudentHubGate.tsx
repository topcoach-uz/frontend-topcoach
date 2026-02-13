/**
 * Gate for /student-hub: redirect mentors (except oumarovna, sheraliozodov6, sheraliozodov03) and
 * counselors (except sheraliozodov6) to /. Always allow sheraliozodov6@gmail.com.
 *
 * Hook-order fix: useCounselorStatus (useState/useEffect) + useGetMeQuery(skip) caused
 * "change in order of Hooks" on refresh. We use Redux for profile and RTK Query
 * getMyOrganizations instead; no useCounselorStatus.
 */

import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useTypedSelector } from 'src/app/store';
import { useGetMyOrganizationsQuery } from 'src/app/services/organizations';
import StudentHubRoutes from './StudentHubRoutes';

const SUPER_ADMIN_EMAIL = 'sheraliozodov6@gmail.com';
const MENTOR_EXCEPTION_EMAILS = ['oumarovna@gmail.com', 'sheraliozodov03@gmail.com'];

export default function StudentHubGate() {
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const profile = useTypedSelector((s) => s.auth.profile);
  const email = profile?.email;
  const isMentor = profile?.profile?.role === 'Mentor';

  const { data: orgsData, isLoading: counselorLoading } = useGetMyOrganizationsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const isCounselor = Array.isArray(orgsData) && orgsData.length > 0;

  const profileLoading = isAuthenticated && !profile?.id;

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

  if (isMentor && !MENTOR_EXCEPTION_EMAILS.includes(email || '')) {
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
    return <Navigate to="/school-counselor" replace />;
  }

  return <StudentHubRoutes />;
}
