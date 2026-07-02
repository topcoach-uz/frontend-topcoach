/**
 * Gate for /student-hub: redirect mentors (except oumarovna, sheraliozodov6, sheraliozodov03) and
 * counselors (except sheraliozodov6) to /. Always allow sheraliozodov6@gmail.com.
 *
 * Hook-order fix: useCounselorStatus (useState/useEffect) + useGetMeQuery(skip) caused
 * "change in order of Hooks" on refresh. We use Redux for profile and RTK Query
 * getMyOrganizations instead; no useCounselorStatus.
 */

import { Navigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { useGetMyOrganizationsQuery } from 'src/app/services/organizations';
import { JourneyExperienceProvider } from 'src/contexts/JourneyExperienceContext';
import { PageLoader } from 'src/components/loading';
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
    // Same full-screen PageLoader as HomeRouter and StudentHubLayout so the
    // login → hub transition looks like one continuous loader, not several
    // different spinners flashing in sequence.
    return <PageLoader text="Loading..." />;
  }

  if (email === SUPER_ADMIN_EMAIL) {
    return (
      <JourneyExperienceProvider>
        <StudentHubRoutes />
      </JourneyExperienceProvider>
    );
  }

  if (isMentor && !MENTOR_EXCEPTION_EMAILS.includes(email || '')) {
    return <Navigate to="/" replace />;
  }

  if (counselorLoading) {
    return <PageLoader text="Loading..." />;
  }

  if (isCounselor) {
    return <Navigate to="/school-counselor" replace />;
  }

  return (
    <JourneyExperienceProvider>
      <StudentHubRoutes />
    </JourneyExperienceProvider>
  );
}
