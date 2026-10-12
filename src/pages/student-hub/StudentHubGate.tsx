/**
 * Gate for /student-hub: redirect ALL mentors (platform staff or not — they
 * work from the mentor dashboard) and org staff to their own home surfaces.
 *
 * Platform staff retain hub preview access unless they have an actual active
 * school staff assignment. Global organization preview access is not a seat.
 *
 * Hook-order fix: useCounselorStatus (useState/useEffect) + useGetMeQuery(skip) caused
 * "change in order of Hooks" on refresh. We use Redux for profile and the
 * RTK Query `/org/me` membership instead; no useCounselorStatus.
 */

import { Navigate } from 'react-router-dom';
import Loader from 'src/components/loader';
import { useTypedSelector } from 'src/app/store';
import useOrgStaff from 'src/hooks/useOrgStaff';
import { JourneyExperienceProvider } from 'src/contexts/JourneyExperienceContext';
import StudentHubRoutes from './StudentHubRoutes';

export default function StudentHubGate() {
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const profile = useTypedSelector((s) => s.auth.profile);
  const isMentor = profile?.profile?.role === 'Mentor';

  const {
    isOrgStaff,
    isPlatformStaff,
    isLoading: counselorLoading,
  } = useOrgStaff();

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

  // An actual school assignment wins even when the account is an admin or
  // still has a Student/Mentor profile. Admin preview access alone stays here.
  if (isOrgStaff) {
    return <Navigate to="/counselor-console" replace />;
  }

  if (isPlatformStaff && !isMentor) {
    return (
      <JourneyExperienceProvider>
        <StudentHubRoutes />
      </JourneyExperienceProvider>
    );
  }

  if (isMentor) {
    return <Navigate to="/" replace />;
  }

  return (
    <JourneyExperienceProvider>
      <StudentHubRoutes />
    </JourneyExperienceProvider>
  );
}
