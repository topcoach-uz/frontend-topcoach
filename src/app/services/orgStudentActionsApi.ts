import { RtkApi } from './api';

/**
 * Counselor Console — org-scoped *write* actions on a single student.
 *
 * Companion to `counselorConsoleApi.ts` (which is read-only): these are the P4
 * counselor actions surfaced on the Student Profile page — private notes and
 * task assignment. A parallel backend agent implements these to the shapes
 * declared below.
 *
 * Endpoint map:
 *   GET    /org/:orgId/students/:userId/notes           → useGetStudentNotesQuery
 *   POST   /org/:orgId/students/:userId/notes           → useAddStudentNoteMutation
 *   DELETE /org/:orgId/students/:userId/notes/:noteId   → useDeleteStudentNoteMutation
 *   POST   /org/:orgId/students/:userId/tasks           → useAssignStudentTaskMutation
 */

// ── Notes ────────────────────────────────────────────────────────────────────

export interface StudentNote {
  id: string;
  body: string;
  authorUserId: string;
  authorName: string | null;
  createdAt: string;
}

export interface StudentNotesResponse {
  items: StudentNote[];
}

export interface GetStudentNotesArgs {
  orgId: string;
  userId: string;
}

export interface AddStudentNoteArgs {
  orgId: string;
  userId: string;
  body: string;
}

export interface DeleteStudentNoteArgs {
  orgId: string;
  userId: string;
  noteId: string;
}

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
    getStudentNotes: builder.query<StudentNotesResponse, GetStudentNotesArgs>({
      query: ({ orgId, userId }) => ({
        url: `/org/${encodeURIComponent(orgId)}/students/${encodeURIComponent(
          userId,
        )}/notes`,
        method: 'GET',
      }),
      providesTags: (_res, _err, { userId }) => [
        { type: 'CounselorStudentNotes' as const, id: userId },
      ],
    }),

    addStudentNote: builder.mutation<StudentNote, AddStudentNoteArgs>({
      query: ({ orgId, userId, body }) => ({
        url: `/org/${encodeURIComponent(orgId)}/students/${encodeURIComponent(
          userId,
        )}/notes`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: (_res, _err, { userId }) => [
        { type: 'CounselorStudentNotes' as const, id: userId },
      ],
    }),

    deleteStudentNote: builder.mutation<void, DeleteStudentNoteArgs>({
      query: ({ orgId, userId, noteId }) => ({
        url: `/org/${encodeURIComponent(orgId)}/students/${encodeURIComponent(
          userId,
        )}/notes/${encodeURIComponent(noteId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { userId }) => [
        { type: 'CounselorStudentNotes' as const, id: userId },
      ],
    }),

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

export const {
  useGetStudentNotesQuery,
  useAddStudentNoteMutation,
  useDeleteStudentNoteMutation,
  useAssignStudentTaskMutation,
} = orgStudentActionsApi;
