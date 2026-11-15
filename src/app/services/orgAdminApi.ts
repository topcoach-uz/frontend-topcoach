import { RtkApi } from './api';
import { branchParam } from './counselorConsoleApi';
import type {
  BranchSelection,
  OrgContext,
  OrgMembershipRole,
} from './counselorConsoleApi';

/**
 * Org Administration API — the owner/communication surface of the Counselor
 * Console (Staff, Settings, Announcements). Injected as a separate slice from
 * `counselorConsoleApi` to keep the core console file churn-free; a parallel
 * backend agent implements these to the shapes declared here.
 *
 * Endpoint map:
 *   GET    /org/:orgId/staff              → useGetStaffQuery(orgId)
 *   DELETE /org/:orgId/staff/:userId      → useRemoveStaffMutation()
 *   PATCH  /org/:orgId                    → useUpdateOrgMutation()
 *   GET    /org/:orgId/announcements      → useGetAnnouncementsQuery(orgId)
 *   POST   /org/:orgId/announcements      → useCreateAnnouncementMutation()
 */

// ── Staff ────────────────────────────────────────────────────────────────────

export type OrgStaffStatus = 'active' | 'invited' | 'archived';

/** One row of `GET /org/:orgId/staff`. */
export interface OrgStaffMember {
  userId: string;
  /** Null when the member's profile is missing or was removed. */
  name: string | null;
  email: string | null;
  /** Profile picture URL, or null when the member has none. */
  avatarUrl: string | null;
  role: OrgMembershipRole;
  status: OrgStaffStatus;
  joinedAt: string | null;
  /** Assigned branch ids. Owners: `[]`, meaning every branch. */
  branchIds?: string[];
}

export interface GetStaffArgs {
  orgId: string;
  branchId?: BranchSelection;
}

export interface SetStaffBranchesArgs {
  orgId: string;
  userId: string;
  branchIds: string[];
}

export interface OrgStaffResponse {
  items: OrgStaffMember[];
}

export interface RemoveStaffArgs {
  orgId: string;
  userId: string;
}

// ── Settings (org profile) ────────────────────────────────────────────────────

/**
 * The org record as returned by `GET /org/:orgId`, widened with the editable
 * profile fields the Settings form manages. `OrgContext` (from the core console
 * slice) only types the display subset; these extras are optional so the form
 * degrades gracefully if the backend omits them.
 */
export interface OrgSettings extends OrgContext {
  description?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  website?: string | null;
}

export interface UpdateOrgBody {
  name?: string;
  description?: string;
  contactEmail?: string;
  address?: string;
  website?: string;
  logoUrl?: string;
  slug?: string;
}

export interface UpdateOrgArgs extends UpdateOrgBody {
  orgId: string;
}

// ── Announcements ─────────────────────────────────────────────────────────────

/** One row of `GET /org/:orgId/announcements`. */
export interface OrgAnnouncement {
  id: string;
  title: string;
  message: string;
  recipientCount: number;
  sentBy: string | null;
  createdAt: string;
}

export interface OrgAnnouncementsResponse {
  items: OrgAnnouncement[];
}

export interface GetAnnouncementsArgs {
  orgId: string;
  branchId?: BranchSelection;
}

export interface CreateAnnouncementArgs {
  orgId: string;
  /** Audience: a single branch, or omit / 'all' for the caller's whole scope. */
  branchId?: BranchSelection;
  title: string;
  message: string;
}

export interface CreateAnnouncementResult {
  id: string;
  recipientCount: number;
}

// ── API slice ──────────────────────────────────────────────────────────────

export const orgAdminApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Staff ────────────────────────────────────────────────────────────────
    getStaff: builder.query<OrgStaffResponse, GetStaffArgs>({
      query: ({ orgId, branchId }) => ({
        url: `/org/${encodeURIComponent(orgId)}/staff`,
        method: 'GET',
        params: { ...branchParam(branchId) },
      }),
      providesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorStaff' as const, id: orgId },
      ],
    }),

    removeStaff: builder.mutation<void, RemoveStaffArgs>({
      query: ({ orgId, userId }) => ({
        url: `/org/${encodeURIComponent(orgId)}/staff/${encodeURIComponent(userId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorStaff' as const, id: orgId },
      ],
    }),

    setStaffBranches: builder.mutation<
      { userId: string; branchIds: string[] },
      SetStaffBranchesArgs
    >({
      query: ({ orgId, userId, branchIds }) => ({
        url: `/org/${encodeURIComponent(orgId)}/staff/${encodeURIComponent(userId)}/branches`,
        method: 'PUT',
        body: { branchIds },
      }),
      invalidatesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorStaff' as const, id: orgId },
        { type: 'CounselorBranches' as const, id: orgId },
        { type: 'CounselorAudit' as const, id: orgId },
      ],
    }),

    // ── Settings ───────────────────────────────────────────────────────────────
    updateOrg: builder.mutation<OrgSettings, UpdateOrgArgs>({
      query: ({ orgId, ...body }) => ({
        url: `/org/${encodeURIComponent(orgId)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorOrgContext' as const, id: orgId },
        'CounselorOrgs',
      ],
    }),

    // ── Announcements ────────────────────────────────────────────────────────
    getAnnouncements: builder.query<OrgAnnouncementsResponse, GetAnnouncementsArgs>({
      query: ({ orgId, branchId }) => ({
        url: `/org/${encodeURIComponent(orgId)}/announcements`,
        method: 'GET',
        params: { ...branchParam(branchId) },
      }),
      providesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorAnnouncements' as const, id: orgId },
      ],
    }),

    createAnnouncement: builder.mutation<
      CreateAnnouncementResult,
      CreateAnnouncementArgs
    >({
      query: ({ orgId, title, message, branchId }) => ({
        url: `/org/${encodeURIComponent(orgId)}/announcements`,
        method: 'POST',
        body: { title, message, ...branchParam(branchId) },
      }),
      invalidatesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorAnnouncements' as const, id: orgId },
      ],
    }),
  }),
});

export const {
  useGetStaffQuery,
  useRemoveStaffMutation,
  useSetStaffBranchesMutation,
  useUpdateOrgMutation,
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
} = orgAdminApi;
