/* ── Counselor Console — the People family's shared vocabulary ────────────────
   Roles and statuses are named and coloured in exactly one place. Before this
   module, StaffPage and InvitationsPage each carried a byte-identical copy of
   ROLE_LABEL/ROLE_PILL and their own near-identical status maps, so a renamed
   role or a re-toned pill had to be found in three files to stay consistent.

   Colour is never the only signal: every map pairs a tone with a written label,
   and the pill always prints that label. */
import type { CcPillVariant } from '../components/CcPill';
import type {
  OrgInvitationStatus,
  OrgMembershipRole,
} from 'src/app/services/counselorConsoleApi';
import type { OrgStaffStatus } from 'src/app/services/orgAdminApi';

export const ROLE_LABEL: Record<OrgMembershipRole, string> = {
  owner: 'Owner',
  counselor: 'Counselor',
  student: 'Student',
};

export const ROLE_PILL: Record<OrgMembershipRole, CcPillVariant> = {
  owner: 'accent',
  counselor: 'info',
  student: 'neutral',
};

/** Membership status — shared by the staff roster and the student roster. */
export const MEMBER_STATUS_PILL: Record<
  OrgStaffStatus,
  { tone: CcPillVariant; label: string }
> = {
  active: { tone: 'success', label: 'Active' },
  invited: { tone: 'info', label: 'Invited' },
  archived: { tone: 'neutral', label: 'Archived' },
};

export const INVITATION_STATUS_PILL: Record<
  OrgInvitationStatus,
  { tone: CcPillVariant; label: string }
> = {
  pending: { tone: 'info', label: 'Pending' },
  accepted: { tone: 'success', label: 'Accepted' },
  expired: { tone: 'warning', label: 'Expired' },
  revoked: { tone: 'neutral', label: 'Revoked' },
};

/**
 * Only counselors and students are invitable — an owner is set deliberately,
 * never via an invite (the backend enforces this too).
 */
export const INVITABLE_ROLES: { value: OrgMembershipRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'counselor', label: 'Counselor' },
];
