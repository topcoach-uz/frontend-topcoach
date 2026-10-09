import { describe, expect, it } from "vitest";
import { findInvitedMembership } from "./invitationMembership";
const seat = {
  organization: { id: "school-a", status: "active" },
  role: "student",
  status: "active",
};
describe("Invitation membership recognition", () => {
  it("recognizes an accepted student seat independently of staff memberships", () => {
    expect(findInvitedMembership("school-a", [seat])).toEqual(seat);
  });
  it("does not confuse two schools or an unavailable invitation with an existing seat", () => {
    expect(findInvitedMembership("school-b", [seat])).toBeNull();
    expect(findInvitedMembership(undefined, [seat])).toBeNull();
  });
  it("does not offer access for archived seats or suspended organizations", () => {
    expect(
      findInvitedMembership("school-a", [{ ...seat, status: "archived" }]),
    ).toBeNull();
    expect(
      findInvitedMembership("school-a", [
        {
          ...seat,
          organization: { ...seat.organization, status: "suspended" },
        },
      ]),
    ).toBeNull();
  });
});
