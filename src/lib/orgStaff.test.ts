import { describe, expect, it } from 'vitest';
import { resolveOrgStaffStatus } from './orgStaff';
const seat = { organization: { id: 'school', name: 'School', slug: 'school', logoUrl: null, status: 'active' as const },
  role: 'counselor' as const, status: 'active' as const, joinedAt: '', isAssignedMember: true };
describe('Counselor landing policy', () => {
  it.each(['SuperAdmin', 'Owner', 'User', undefined])('honors a real staff assignment for %s', (role) => {
    expect(resolveOrgStaffStatus(role, [seat]).isOrgStaff).toBe(true);
  });
  it.each(['SuperAdmin', 'Owner'])('does not redirect %s for preview access or legacy unmarked admin rows', (role) => {
    expect(resolveOrgStaffStatus(role, [{ ...seat, isAssignedMember: false }]).isOrgStaff).toBe(false);
    expect(resolveOrgStaffStatus(role, [{ ...seat, isAssignedMember: undefined }]).isOrgStaff).toBe(false);
  });
  it('does not confuse a student, an archived membership, or a suspended school with staff', () => {
    expect(resolveOrgStaffStatus('User', [{ ...seat, role: 'student' }]).isOrgStaff).toBe(false);
    expect(resolveOrgStaffStatus('SuperAdmin', [{ ...seat, status: 'archived' }]).isOrgStaff).toBe(false);
    expect(resolveOrgStaffStatus('SuperAdmin', [{ ...seat, organization: { ...seat.organization, status: 'suspended' } }]).isOrgStaff).toBe(false);
  });
  it('keeps older non-admin staff responses compatible', () => {
    expect(resolveOrgStaffStatus('User', [{ ...seat, isAssignedMember: undefined }]).isOrgStaff).toBe(true);
  });
});
