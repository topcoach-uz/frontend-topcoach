import type { OrgMembership } from 'src/app/services/counselorConsoleApi';

export function resolveOrgStaffStatus(managementRole?: string, orgs?: OrgMembership[]) {
  const isPlatformStaff = managementRole === 'SuperAdmin' || managementRole === 'Owner';
  const hasOrgMembership = Array.isArray(orgs) && orgs.length > 0;
  const isOrgStaff = (orgs ?? []).some((m) =>
    m.status === 'active' && m.organization.status === 'active' &&
    (m.role === 'owner' || m.role === 'counselor') &&
    (!isPlatformStaff || m.isAssignedMember === true),
  );
  return { isOrgStaff, isPlatformStaff, hasOrgMembership };
}
