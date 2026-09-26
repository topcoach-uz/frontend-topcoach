import { RtkApi } from '../api';

/**
 * The caller's own STUDENT organization memberships.
 *
 * This cannot be served by `GET /org/me`: that route deliberately filters to
 * OWNER/COUNSELOR rows only (see `src/modules/organizations/org-console.service.ts`),
 * because a student's org membership is not a staff relationship — returning
 * students there would bounce them out of their own hub into a console where
 * every request 403s.
 *
 * Returns an ARRAY, not a single membership: the unique index is
 * (organization, user), which replaced an older global unique(user_id)
 * specifically so a user can belong to more than one organization. Empty array
 * when the caller belongs to none, which is the common case.
 */

export interface StudentOrgMembershipOrganization {
  id: string;
  name: string;
  logoUrl: string | null;
  slug: string | null;
  status: string;
}

export interface StudentOrgMembership {
  organization: StudentOrgMembershipOrganization;
  role: string;
  status: string;
  joinedAt: string | null;
}

export const orgMembershipApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // Empty array when the current user has no student org membership.
    getMyOrgMembership: builder.query<StudentOrgMembership[], void>({
      query: () => ({
        url: '/org/my-membership',
        method: 'GET',
      }),
      providesTags: ['StudentOrgMembership'],
    }),
  }),
});

export const { useGetMyOrgMembershipQuery } = orgMembershipApi;
