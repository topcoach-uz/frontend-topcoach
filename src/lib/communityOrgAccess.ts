import type { StudentOrgMembership } from 'src/app/services/student-hub/orgMembershipApi';

/** An accepted student invitation grants Community while the organization stays active. */
export function hasActiveCommunityOrgMembership(memberships: StudentOrgMembership[] | undefined): boolean {
  return Boolean(memberships?.some(member =>
    member.role === 'student' && member.status === 'active' && member.organization?.status === 'active',
  ));
}
