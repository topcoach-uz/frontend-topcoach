import { describe, expect, it } from 'vitest';
import { hasActiveCommunityOrgMembership } from './communityOrgAccess';
import type { StudentOrgMembership } from 'src/app/services/student-hub/orgMembershipApi';

const membership = (status: string, organizationStatus = 'active'): StudentOrgMembership => ({
  role: 'student', status, joinedAt: null,
  organization: { id: 'org', name: 'School', slug: 'school', logoUrl: null, status: organizationStatus },
});

describe('organization Community access', () => {
  it('grants access for an active student in an active organization', () => {
    expect(hasActiveCommunityOrgMembership([membership('active')])).toBe(true);
  });

  it('ends access when the student is archived or the organization is suspended', () => {
    expect(hasActiveCommunityOrgMembership([membership('archived')])).toBe(false);
    expect(hasActiveCommunityOrgMembership([membership('active', 'suspended')])).toBe(false);
  });
});
