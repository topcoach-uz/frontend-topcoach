/**
 * Single source of truth for "does this user run an organization?".
 *
 * Backed by `GET /org/me` (`useGetMyOrgsQuery`), which returns OWNER +
 * COUNSELOR memberships with `status = ACTIVE`. It deliberately excludes
 * STUDENT memberships — org students keep the ordinary student experience.
 *
 * ⚠️ `/org/me` also returns EVERY organization when the caller is platform
 * staff (SuperAdmin/Owner `managementRole`). So a non-empty response is NOT
 * on its own proof of org staff: without the `isPlatformStaff` subtraction
 * below, every SuperAdmin would be force-redirected into the counselor
 * console and lose the admin experience. Platform staff can still ENTER any
 * console (CounselorConsoleGate lets them in, and the console has a "Back to
 * admin" link) — they are simply never auto-routed there.
 */

import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetMyOrgsQuery } from 'src/app/services/counselorConsoleApi';

export interface OrgStaffStatus {
  /** Runs an org AND is not acting as platform staff — the routing signal. */
  isOrgStaff: boolean;
  /** Platform-level SuperAdmin/Owner. Never auto-redirected to the console. */
  isPlatformStaff: boolean;
  /** Raw `/org/me` non-empty. For platform staff this means "all orgs". */
  hasOrgMembership: boolean;
  /** True while the membership (or profile) is still resolving. */
  isLoading: boolean;
}

export default function useOrgStaff(): OrgStaffStatus {
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const authProfile = useTypedSelector((state) => state.auth.profile);

  const { data: userData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const currentUser = userData ?? authProfile;
  const managementRole = (currentUser as { managementRole?: string } | null | undefined)
    ?.managementRole;
  const isPlatformStaff = managementRole === 'SuperAdmin' || managementRole === 'Owner';

  const {
    data: orgs,
    isLoading,
    isFetching,
  } = useGetMyOrgsQuery(undefined, { skip: !isAuthenticated });

  const hasOrgMembership = Array.isArray(orgs) && orgs.length > 0;

  return {
    isOrgStaff: hasOrgMembership && !isPlatformStaff,
    isPlatformStaff,
    hasOrgMembership,
    isLoading: isAuthenticated && (isLoading || (isFetching && !orgs)),
  };
}
