import { RtkApi } from './api';
import type { OrgMembershipRole } from './counselorConsoleApi';

/**
 * Public invitation (join) flow — the unauthenticated-friendly endpoints that
 * back the `/join/:token` landing page. Kept in a SEPARATE slice from the
 * org-scoped counselor console API because these are token-addressed (not
 * org-scoped) and are hit by prospective members who may not yet be signed in.
 *
 * Endpoint map:
 *   GET  /invitations/:token          → useGetInvitationByTokenQuery(token)
 *   POST /invitations/:token/accept   → useAcceptInvitationMutation()
 */

export type PublicInvitationStatus =
  | 'pending'
  | 'accepted'
  | 'expired'
  | 'revoked';

export interface PublicInvitationOrg {
  name: string;
  logoUrl: string | null;
  /** Nullable server-side (PublicInvitationOrgDto) — never assume it's set. */
  slug: string | null;
}

/** `GET /invitations/:token` — the invitation as seen by the invitee. */
export interface PublicInvitation {
  organization: PublicInvitationOrg;
  email: string;
  role: OrgMembershipRole;
  inviteeName: string | null;
  status: PublicInvitationStatus;
  expiresAt: string | null;
  /** Server-computed: true when the invite can still be accepted. */
  valid: boolean;
}

/** `POST /invitations/:token/accept` result. */
export interface AcceptInvitationResult {
  organizationId: string;
  role: OrgMembershipRole;
}

export const publicInvitationsApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvitationByToken: builder.query<PublicInvitation, string>({
      query: (token) => ({
        url: `/invitations/${encodeURIComponent(token)}`,
        method: 'GET',
      }),
      providesTags: (_res, _err, token) => [
        { type: 'PublicInvitation' as const, id: token },
      ],
    }),

    acceptInvitation: builder.mutation<AcceptInvitationResult, string>({
      query: (token) => ({
        url: `/invitations/${encodeURIComponent(token)}/accept`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, token) => [
        { type: 'PublicInvitation' as const, id: token },
        'CounselorOrgs',
      ],
    }),
  }),
});

export const {
  useGetInvitationByTokenQuery,
  useAcceptInvitationMutation,
} = publicInvitationsApi;
