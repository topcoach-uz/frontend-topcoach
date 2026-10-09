export interface InvitationMembership {
  organization: { id: string; status: string };
  role: string;
  status: string;
}

export function findInvitedMembership(
  orgId: string | undefined,
  memberships: InvitationMembership[],
) {
  return (
    memberships.find(
      (m) =>
        m.organization.id === orgId &&
        m.status === "active" &&
        m.organization.status === "active",
    ) ?? null
  );
}
