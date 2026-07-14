import { RtkApi } from './api';

/**
 * Org Audit API — the owner-only audit trail of the Counselor Console. Injected
 * as its own slice so the Administration surface stays modular; a parallel
 * backend agent implements this to the shape declared here.
 *
 * Endpoint map:
 *   GET /org/:orgId/audit?page&limit → useGetAuditQuery({ orgId, page?, limit? })
 */

/** A single audit-log entry from `GET /org/:orgId/audit`. */
export interface OrgAuditEntry {
  id: string;
  /** Dotted action key, e.g. `invitation.created`, `student.archived`. */
  action: string;
  /** Display name of the actor who performed the action. */
  actorName: string;
  /** Entity kind the action targeted, e.g. `invitation`, `student`, `org`. */
  targetType: string | null;
  /** Id of the targeted entity (may be a UUID or slug). */
  targetId: string | null;
  /** Arbitrary structured detail about the action. */
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface OrgAuditResponse {
  items: OrgAuditEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface GetAuditArgs {
  orgId: string;
  page?: number;
  limit?: number;
}

export const orgAuditApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getAudit: builder.query<OrgAuditResponse, GetAuditArgs>({
      query: ({ orgId, page, limit }) => ({
        url: `/org/${encodeURIComponent(orgId)}/audit`,
        method: 'GET',
        params: {
          ...(page != null ? { page } : {}),
          ...(limit != null ? { limit } : {}),
        },
      }),
      providesTags: (_res, _err, { orgId }) => [
        { type: 'CounselorAudit' as const, id: orgId },
      ],
    }),
  }),
});

export const { useGetAuditQuery } = orgAuditApi;
