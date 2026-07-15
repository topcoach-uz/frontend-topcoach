import { RtkApi } from './api';

/**
 * Counselor Console — org-scoped *write* actions on a single student.
 *
 * Companion to `counselorConsoleApi.ts` (which is read-only): these are the P4
 * counselor actions surfaced on the Student Profile page — task assignment.
 *
 * Endpoint map:
 *   POST   /org/:orgId/students/:userId/tasks           → useAssignStudentTaskMutation
 */

// ── Task assignment ──────────────────────────────────────────────────────────

export interface AssignStudentTaskArgs {
  orgId: string;
  userId: string;
  title: string;
  description?: string;
  /** ISO-8601 date-time. */
  dueDate?: string;
}

export interface AssignedStudentTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status?: string;
  createdAt: string;
}

// ── API slice ────────────────────────────────────────────────────────────────

export const orgStudentActionsApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    assignStudentTask: builder.mutation<
      AssignedStudentTask,
      AssignStudentTaskArgs
    >({
      query: ({ orgId, userId, ...body }) => ({
        url: `/org/${encodeURIComponent(orgId)}/students/${encodeURIComponent(
          userId,
        )}/tasks`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useAssignStudentTaskMutation } = orgStudentActionsApi;
