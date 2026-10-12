/** Actual owner/counselor assignments take priority over the account profile,
 * including for platform administrators. Preview access alone is not staff. */
import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetMyOrgsQuery } from 'src/app/services/counselorConsoleApi';
import { resolveOrgStaffStatus } from 'src/lib/orgStaff';

export interface OrgStaffStatus {
  /** Holds an active school staff assignment — the routing signal. */
  isOrgStaff: boolean;
  /** Platform-level SuperAdmin/Owner; explicit school assignments still win. */
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

  const {
    data: orgs,
    isLoading,
    isFetching,
  } = useGetMyOrgsQuery(undefined, { skip: !isAuthenticated });

  return {
    ...resolveOrgStaffStatus(managementRole, orgs),
    isLoading: isAuthenticated && (isLoading || (isFetching && !orgs)),
  };
}
