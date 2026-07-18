/**
 * Gate for /student-hub: redirect ALL mentors (platform staff or not — they
 * work from the mentor dashboard) and org staff to their own home surfaces.
 *
 * Platform staff (SuperAdmin/Owner `managementRole`) keep the hub: `/org/me`
 * returns every org for them, so they must not be treated as org staff here.
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

  // Platform staff (SuperAdmin/Owner) keep the hub — unless they are mentors,
  // who fall through to the mentor check below like any other mentor.
  if (isPlatformStaff && !isMentor) {
    return (
      <JourneyExperienceProvider>
        <StudentHubRoutes />
      </JourneyExperienceProvider>
    );
  }

  // Org staff FIRST — before the mentor check.
  //
  // `/org/me` returns only owner/counselor memberships, so this means "this
  // user helps run an organization", which outranks their personal profile
  // role. The counselor invite flow routes new staff through the ordinary
  // signup, where they must pick Student or Mentor — so an owner/counselor very
  // often also carries `profile.role === 'Mentor'`. With the mentor check
  // first, those accounts were sent to the mentor home and could never reach
  // their console.
  if (isOrgStaff) {
    return <Navigate to="/counselor-console" replace />;
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
