import { RtkApi } from "./api";
import type { AcademicProgram } from "./fullSupportApi";

export type MentorProgramEnrollment = {
  id: string;
  assignmentId: string;
  program: AcademicProgram;
  role: string;
  studentUserId: string;
  studentName: string;
  startsAt: string;
  assignedAt: string;
  accessEndsAt: string | null;
  allocatedMinutes: number | null;
  usedMinutes: number;
  remainingMinutes: number | null;
};

export type ProgramWorkInput = {
  mentorUserId: string;
  date: string;
  actualDurationMinutes: number;
  description: string;
  reason: string;
  requestId: string;
};

export const mentorProgramsApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    getMentorProgramEnrollments: build.query<
      { data: MentorProgramEnrollment[] },
      void
    >({
      query: () => "/academic-programs/mentor/enrollments",
      providesTags: ["MentorProgramEnrollments"],
    }),
    recordMentorProgramWork: build.mutation<
      { data: { id: string } },
      { id: string; body: ProgramWorkInput }
    >({
      query: ({ id, body }) => ({
        url: `/academic-programs/mentor/enrollments/${id}/work-logs`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "MentorProgramEnrollments",
        "FullSupportMentorRoster",
        "FullSupportMentorSessions",
      ],
    }),
  }),
});

export const {
  useGetMentorProgramEnrollmentsQuery,
  useRecordMentorProgramWorkMutation,
} = mentorProgramsApi;
