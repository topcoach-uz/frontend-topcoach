/**
 * Gate for /student-hub: redirect ALL mentors (SuperAdmin or not — they work
 * from the mentor dashboard) and counselors to their own home surfaces.
 * Always allow sheraliozodov6@gmail.com.
 *
 * Hook-order fix: useCounselorStatus (useState/useEffect) + useGetMeQuery(skip) caused
 * "change in order of Hooks" on refresh. We use Redux for profile and RTK Query
 * getMyOrganizations instead; no useCounselorStatus.
 */

import { Navigate } from 'react-router-dom';
import Loader from 'src/components/loader';
import { useTypedSelector } from 'src/app/store';
import { useGetMyOrganizationsQuery } from 'src/app/services/organizations';
import { JourneyExperienceProvider } from 'src/contexts/JourneyExperienceContext';
import StudentHubRoutes from './StudentHubRoutes';

const SUPER_ADMIN_EMAIL = 'sheraliozodov6@gmail.com';

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

  // One loader for BOTH pending sources (profile + org membership). They
  // resolve in parallel and are usually cache-warm from RouterProvider's
  // bootstrap queries, so this rarely shows at all — but when it does, it's
  // a single continuous loader instead of two back-to-back ones.
  if (profileLoading || counselorLoading) {
    return (
      <Loader height="100vh" />
    );
  }

  if (email === SUPER_ADMIN_EMAIL) {
    return (
      <JourneyExperienceProvider>
        <StudentHubRoutes />
      </JourneyExperienceProvider>
    );
  }

  if (isMentor) {
    return <Navigate to="/" replace />;
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
