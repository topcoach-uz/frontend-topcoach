import { Navigate, Outlet } from 'react-router-dom';
import Loader from 'src/components/loader';
import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetMyOrgsQuery } from 'src/app/services/counselorConsoleApi';
import { CounselorConsoleProvider } from './CounselorConsoleContext';

/**
 * Gate for `/counselor-console`. Entry is allowed when the signed-in user is a
 * SuperAdmin/Owner (platform staff previewing) OR is a member of at least one
 * organization. Everyone else is bounced to the student hub. The existing
 * `/school-counselor` surface is untouched — this runs in parallel until the
 * cutover.
 */
export default function CounselorConsoleGate() {
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const userProfile = useTypedSelector((state) => state.auth.profile);

  const { data: userData, isLoading: profileLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const currentUser = userData || userProfile;
  const managementRole = (currentUser as { managementRole?: string } | undefined)
    ?.managementRole;
  const isSuperAdmin = managementRole === 'SuperAdmin' || managementRole === 'Owner';

  const {
    data: orgs,
    isLoading: orgsLoading,
    isFetching: orgsFetching,
  } = useGetMyOrgsQuery(undefined, { skip: !isAuthenticated });

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Wait for both the profile (for SuperAdmin detection) and the org
  // membership before deciding — otherwise a legitimate counselor could be
  // bounced to /student-hub on the first frame before orgs resolve.
  if ((profileLoading && !currentUser) || orgsLoading || (orgsFetching && !orgs)) {
    return <Loader height="60vh" />;
  }

  const memberships = orgs ?? [];
  const canEnter = isSuperAdmin || memberships.length > 0;

  if (!canEnter) {
    return <Navigate to="/student-hub" replace />;
  }

  return (
    <CounselorConsoleProvider orgs={memberships}>
      <Outlet />
    </CounselorConsoleProvider>
  );
}
