import { RtkApi } from './api';

export type FullSupportEnrollmentMe = { enrolled: boolean; mentorName?: string; mentorId?: string };

export type AdminStudentRow = {
  id: string;
  name: string;
  mentorId: string | null;
  mentorName: string | null;
  sessions: string;
  tasks: string;
  status: string;
};

export type AdminMentorRow = {
  id: string;
  name: string;
  specialization: string;
  studentCount: number;
  students: string[];
};

export type MentorRosterStudent = {
  id: string;
  name: string;
  initials: string;
  used: number;
  allocated: number;
  scheduledHours?: number;
  sessionsCount: number;
  /** Assigned through the older Full Support flow (no program / role). */
  hasLegacyFullSupport?: boolean;
  /** Programs this mentor is assigned to for the student, with their roles. */
  programs?: MentorRosterProgram[];
};

export type MentorRosterProgram = {
  enrollmentId: string;
  program: string;
  roles: string[];
  usedMinutes?: number | null;
  allocatedMinutes?: number | null;
  remainingMinutes?: number | null;
};

export type StudentGoalDto = {
  careerGoals: string[];
  intendedMajors: { major: string; rank: number }[];
  studyAbroadGoals?: {
    interest: boolean;
    targetCountries?: string[];
    targetRegions?: string[];
    durationPreference?: 'semester' | 'year' | 'full-degree' | 'summer' | 'flexible';
    priorityLevel?: 'high' | 'medium' | 'low';
  };
};

export type SessionLogDto = {
  academicEnrollmentId?: string | null;
  program?: string | null;
  recurrence?: { seriesId: string; position: number; timezone: string; repeat: "none" | "weekly" | "biweekly" } | null;
  id: string;
  mentorUserId?: string;
  studentUserId?: string;
  studentName?: string;
  mentorName?: string;
  dateTime: string;
  duration: string;
  description: string;
  done: boolean;
  meetingLink?: string | null;
  outcome: 'scheduled' | 'held' | 'cancelled' | 'student_no_show' | 'mentor_no_show' | 'rescheduled';
  attendance: 'unknown' | 'present' | 'late' | 'absent' | 'excused';
  actualDurationMinutes: number | null;
  sharedNotes: string;
  recordedAt?: string | null;
  homework: Array<{ id: string; title: string; status: string; deadline: string }>;
  changeHistory?: Array<{ at: string; by: string; reason: string; before: Record<string, unknown>; after: Record<string, unknown> }>;
};

export type TaskDto = {
  id: string;
  lessonId?: string | null;
  task: string;
  student?: string;
  studentUserId: string;
  mentorName?: string;
  description?: string;
  status: 'assigned' | 'submitted' | 'revision_requested' | 'approved';
  submittedAt?: string;
  reviewedAt?: string;
  reviewHistory: Array<{ decision: 'approved' | 'revision_requested'; feedback: string; at: string; submissionText?: string; submissionFileUrls?: { fileName: string; url: string }[]; feedbackFileUrls?: { fileName: string; url: string }[]; revisionFileUrls?: string[]; submittedAt?: string }>;
  deadline: string;
  hasFeedback: boolean;
  feedback?: string;
  submissionText?: string;
  submissionFileUrls?: { fileName: string; url: string }[];
  feedbackFileUrls?: { fileName: string; url: string }[];
  /** Submitted file URLs the reviewer asked to redo (empty = whole submission). */
  revisionFileUrls?: string[];
  extensionRequests?: TaskExtensionRequest[];
  /** Student may still change this submission (submitted, unreviewed, deadline not passed). */
  canEditSubmission?: boolean;
};

/** A mentor assigned to the current student (student-facing, no contact details). */
export type StudentMentor = {
  id: string;
  name: string;
  photoUrl: string | null;
  title: string | null;
  university: string | null;
  major: string | null;
  summary: string | null;
  languages: string[];
  assignments: { program: string; roles: string[]; legacy?: boolean }[];
  nextLesson: { id: string; dateTime: string; duration: string; description: string; meetingLink: string | null } | null;
  lastLessonAt: string | null;
  lessonsHeld: number;
  openTasks: number;
};

export type TaskExtensionRequest = {
  id: string;
  previousDeadline: string;
  requestedDeadline: string;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
  requestedAt: string;
  decidedAt?: string;
  grantedDeadline?: string;
  response?: string;
};

export type MilestoneDto = {
  id: string;
  label: string;
  date: string | null;
  done: boolean;
};

/** A milestone annotated with its student — for the cross-student deadlines view. */
export type MentorMilestoneRow = MilestoneDto & {
  studentUserId: string;
  studentName: string;
};

export type PipelineDto = {
  id: string;
  studentUserId: string;
  student?: string;
  program: string;
  stage: string;
  status: string;
  aid: boolean;
  deadline: string | null;
};

export type CurriculumWatchlistItemDto = {
  key: string;
  label: string;
  percent: number;
  target: string | null;
};

export type SatProgressSummaryDto = {
  totalLessons: number;
  completedLessons: number;
  overallProgress: number;
  byCourse: Array<{
    courseId: string;
    courseName: string;
    totalLessons: number;
    completedLessons: number;
    percent: number;
  }>;
};

export type WeeklyReportData = {
  studentName: string;
  sessions: SessionLogDto[];
  usedHours: number;
  allocatedHours: number;
  curriculumWatchlist: CurriculumWatchlistItemDto[];
  tasks: TaskDto[];
  milestones: MilestoneDto[];
  pipeline: PipelineDto[];
};

export type AdminInteractionDto = {
  id: string;
  type: 'Session' | 'Task Assigned' | 'Task Review' | 'Milestone' | 'Milestone Added';
  student: string;
  mentor: string;
  description: string;
  date: string;
};

export const fullSupportApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnrollmentMe: builder.query<{ data: FullSupportEnrollmentMe }, void>({
      query: () => ({
        url: '/full-support/enrollment/me',
        method: 'GET',
      }),
      transformResponse: (response: unknown): { data: FullSupportEnrollmentMe } => {
        const raw = response && typeof response === 'object' && 'data' in (response as object)
          ? (response as { data: unknown }).data
          : response;
        const data = raw && typeof raw === 'object' && raw !== null && 'enrolled' in (raw as object)
          ? (raw as FullSupportEnrollmentMe)
          : { enrolled: false };
        return { data };
      },
      providesTags: ['FullSupportEnrollment'],
    }),
    enroll: builder.mutation<{ data: unknown; success: boolean }, void>({
      query: () => ({
        url: '/full-support/enrollment',
        method: 'POST',
      }),
      invalidatesTags: ['FullSupportEnrollment'],
    }),
    adminEnroll: builder.mutation<{ data: unknown; success: boolean }, { userId: string }>({
      query: (body) => ({
        url: '/full-support/admin/enroll',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FullSupportAdmin'],
    }),
    getAdminStats: builder.query<
      { data: { totalStudents: number; sessionsConducted: number; tasksCompleted: number; applicationsSubmitted: number } },
      void
    >({
      query: () => ({ url: '/full-support/admin/stats', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        const data =
          raw && typeof raw === 'object' && raw !== null
            ? {
                totalStudents: Number((raw as { totalStudents?: number }).totalStudents) || 0,
                sessionsConducted: Number((raw as { sessionsConducted?: number }).sessionsConducted) || 0,
                tasksCompleted: Number((raw as { tasksCompleted?: number }).tasksCompleted) || 0,
                applicationsSubmitted: Number((raw as { applicationsSubmitted?: number }).applicationsSubmitted) || 0,
              }
            : { totalStudents: 0, sessionsConducted: 0, tasksCompleted: 0, applicationsSubmitted: 0 };
        return { data };
      },
      providesTags: ['FullSupportAdmin'],
    }),
    getAdminStudents: builder.query<{ data: AdminStudentRow[] }, void>({
      query: () => ({ url: '/full-support/admin/students', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportAdmin'],
    }),
    getAdminMentorAssignments: builder.query<
      { data: Record<string, { studentCount: number; students: string[] }> },
      void
    >({
      query: () => ({ url: '/full-support/admin/mentor-assignments', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: raw && typeof raw === 'object' && raw !== null ? (raw as Record<string, { studentCount: number; students: string[] }>) : {} };
      },
      providesTags: ['FullSupportAdmin'],
    }),
    getAdminMentors: builder.query<{ data: AdminMentorRow[] }, void>({
      query: () => ({ url: '/full-support/admin/mentors', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportAdmin'],
    }),
    assignMentor: builder.mutation<
      { data: unknown; success: boolean },
      { studentUserId: string; mentorUserId: string }
    >({
      query: (body) => ({
        url: '/full-support/admin/assign',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FullSupportAdmin'],
    }),
    unassignMentor: builder.mutation<{ success: boolean }, string>({
      query: (studentUserId) => ({
        url: `/full-support/admin/assign/${studentUserId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FullSupportAdmin'],
    }),
    adminUnenroll: builder.mutation<{ success: boolean }, string>({
      query: (userId) => ({
        url: '/full-support/admin/unenroll',
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: ['FullSupportAdmin'],
    }),
    getMentorRoster: builder.query<{ data: MentorRosterStudent[] }, void>({
      query: () => ({ url: '/full-support/mentor/students', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportMentorRoster'],
    }),
    getStudentGoal: builder.query<{ data: StudentGoalDto }, string>({
      query: (studentUserId) => ({
        url: `/full-support/mentor/students/${encodeURIComponent(studentUserId)}/profile`,
        method: 'GET',
      }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        const data = raw && typeof raw === 'object' ? (raw as Partial<StudentGoalDto>) : {};
        return {
          data: {
            careerGoals: Array.isArray(data.careerGoals) ? data.careerGoals : [],
            intendedMajors: Array.isArray(data.intendedMajors) ? data.intendedMajors : [],
            studyAbroadGoals: data.studyAbroadGoals,
          },
        };
      },
      providesTags: (_res, _err, studentUserId) => [{ type: 'FullSupportMentorRoster' as const, id: studentUserId }],
    }),
    getMentorSessions: builder.query<{ data: SessionLogDto[] }, string | null>({
      query: (studentUserId) => ({
        url: studentUserId ? `/full-support/mentor/sessions?studentUserId=${encodeURIComponent(studentUserId)}` : '/full-support/mentor/sessions',
        method: 'GET',
      }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: (_res, _err, studentUserId) =>
        studentUserId ? [{ type: 'FullSupportMentorSessions' as const, id: studentUserId }] : ['FullSupportMentorSessions'],
    }),
    createMentorSession: builder.mutation<
      { data: unknown; success: boolean },
      { studentUserId: string; dateTime: string; duration?: string; description?: string; meetingLink?: string }
    >({
      query: (body) => ({
        url: '/full-support/mentor/sessions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FullSupportMentorRoster', 'FullSupportMentorSessions', 'FullSupportAdmin'],
    }),
    updateMentorSession: builder.mutation<
      { data: unknown; success: boolean },
      { id: string; done: boolean }
    >({
      query: ({ id, done }) => ({
        url: `/full-support/mentor/sessions/${id}`,
        method: 'PATCH',
        body: { done },
      }),
      invalidatesTags: ['FullSupportMentorRoster', 'FullSupportMentorSessions', 'FullSupportAdmin'],
    }),
    updateMentorLessonLog: builder.mutation<{ data: SessionLogDto; success: boolean }, { id: string; sharedNotes: string; description?: string }>({
      query: ({ id, ...body }) => ({ url: `/full-support/mentor/sessions/${id}/log`, method: 'PATCH', body }),
      invalidatesTags: ['FullSupportMentorRoster', 'FullSupportMentorSessions', 'FullSupportAdmin'],
    }),
    recordMentorLesson: builder.mutation<
      { data: SessionLogDto; success: boolean },
      { id: string; outcome: 'held' | 'cancelled' | 'student_no_show' | 'mentor_no_show'; attendance?: 'present' | 'late'; actualDurationMinutes?: number; sharedNotes?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/full-support/mentor/sessions/${id}/record`, method: 'POST', body }),
      invalidatesTags: ['FullSupportMentorRoster', 'FullSupportMentorSessions', 'FullSupportAdmin'],
    }),
    rescheduleMentorLesson: builder.mutation<{ data: SessionLogDto; success: boolean }, { id: string; dateTime: string; duration: string; meetingLink?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/full-support/mentor/sessions/${id}/reschedule`, method: 'POST', body }),
      invalidatesTags: ['FullSupportMentorRoster', 'FullSupportMentorSessions', 'FullSupportAdmin'],
    }),
    deleteMentorSession: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/full-support/mentor/sessions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FullSupportMentorRoster', 'FullSupportMentorSessions', 'FullSupportAdmin'],
    }),
    getMentorTasks: builder.query<{ data: TaskDto[] }, void>({
      query: () => ({ url: '/full-support/mentor/tasks', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportMentorTasks'],
    }),
    createMentorTask: builder.mutation<
      { data: unknown; success: boolean },
      { studentUserId: string; task: string; deadline: string; description?: string; lessonId?: string }
    >({
      query: (body) => ({
        url: '/full-support/mentor/tasks',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FullSupportMentorTasks', 'FullSupportMenteeTasks', 'FullSupportMentorSessions', 'FullSupportAdmin'],
    }),
    updateMentorTaskFeedback: builder.mutation<
      { data: unknown; success: boolean },
      { id: string; feedback: string; decision?: 'approved' | 'revision_requested'; feedbackFileUrls?: { fileName: string; url: string }[]; revisionFileUrls?: string[] }
    >({
      query: ({ id, feedback, decision, feedbackFileUrls, revisionFileUrls }) => ({
        url: `/full-support/mentor/tasks/${id}`,
        method: 'PATCH',
        body: { feedback, decision, feedbackFileUrls, revisionFileUrls },
      }),
      invalidatesTags: ['FullSupportMentorTasks', 'FullSupportMenteeTasks', 'FullSupportMentorSessions', 'FullSupportAdmin'],
    }),
    decideTaskExtension: builder.mutation<
      { data: unknown; success: boolean },
      { id: string; decision: 'approved' | 'declined'; response?: string; deadline?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/full-support/mentor/tasks/${id}/extension`, method: 'PATCH', body }),
      invalidatesTags: ['FullSupportMentorTasks', 'FullSupportMenteeTasks', 'FullSupportAdmin'],
    }),
    requestTaskExtension: builder.mutation<
      { data: unknown; success: boolean },
      { id: string; requestedDeadline: string; reason: string }
    >({
      query: ({ id, ...body }) => ({ url: `/full-support/mentee/tasks/${id}/extension`, method: 'POST', body }),
      invalidatesTags: ['FullSupportMenteeTasks', 'FullSupportMentorTasks', 'FullSupportAdmin'],
    }),
    linkMentorTaskToLesson: builder.mutation<{ data: TaskDto; success: boolean }, { id: string; lessonId: string | null }>({
      query: ({ id, lessonId }) => ({ url: `/full-support/mentor/tasks/${id}/lesson`, method: 'PATCH', body: { lessonId } }),
      invalidatesTags: ['FullSupportMentorTasks', 'FullSupportMenteeTasks', 'FullSupportMentorSessions', 'FullSupportAdmin'],
    }),
    deleteMentorTask: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/full-support/mentor/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FullSupportMentorTasks', 'FullSupportMenteeTasks', 'FullSupportMentorSessions', 'FullSupportAdmin'],
    }),
    getMenteeMentors: builder.query<{ data: StudentMentor[] }, void>({
      query: () => ({ url: '/full-support/mentee/mentors', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportMenteeTasks', 'FullSupportMentorSessions'],
    }),
    getMenteeTasks: builder.query<{ data: TaskDto[] }, void>({
      query: () => ({ url: '/full-support/mentee/tasks', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportMenteeTasks'],
    }),
    getMenteeSessions: builder.query<
      { data: { sessions: SessionLogDto[]; usedHours: number; allocatedHours: number } },
      void
    >({
      query: () => ({ url: '/full-support/mentee/sessions', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        const obj = raw && typeof raw === 'object' ? (raw as { sessions?: unknown; usedHours?: number; allocatedHours?: number }) : {};
        return {
          data: {
            sessions: Array.isArray(obj.sessions) ? (obj.sessions as SessionLogDto[]) : [],
            usedHours: typeof obj.usedHours === 'number' ? obj.usedHours : 0,
            allocatedHours: typeof obj.allocatedHours === 'number' ? obj.allocatedHours : 6,
          },
        };
      },
      providesTags: ['FullSupportMentorSessions'],
    }),
    uploadTaskSubmissionFile: builder.mutation<
      { data: { fileName: string; url: string }; success: boolean },
      { taskId: string; file: File }
    >({
      query: ({ taskId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/full-support/mentee/tasks/${taskId}/submission-files`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['FullSupportMenteeTasks', 'FullSupportMentorTasks', 'FullSupportMentorSessions', 'FullSupportAdmin'],
    }),
    submitMenteeTask: builder.mutation<
      { data: unknown; success: boolean },
      { id: string; submissionText: string; submissionFileUrls?: { fileName: string; url: string }[] }
    >({
      query: ({ id, submissionText, submissionFileUrls }) => ({
        url: `/full-support/mentee/tasks/${id}`,
        method: 'PATCH',
        body: { submissionText, submissionFileUrls },
      }),
      invalidatesTags: ['FullSupportMenteeTasks', 'FullSupportMentorTasks', 'FullSupportMentorSessions', 'FullSupportAdmin'],
    }),
    uploadMentorFeedbackFile: builder.mutation<
      { data: { fileName: string; url: string } },
      { taskId: string; file: File }
    >({
      query: ({ taskId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/full-support/mentor/tasks/${taskId}/feedback-file`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['FullSupportMentorTasks'],
    }),
    getMentorMilestones: builder.query<{ data: MilestoneDto[] }, string>({
      query: (studentUserId) => ({
        url: `/full-support/mentor/milestones?studentUserId=${encodeURIComponent(studentUserId)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: (_res, _err, studentUserId) => [{ type: 'FullSupportMentorMilestones' as const, id: studentUserId }],
    }),
    // Cross-student roll-up: every milestone across the mentor's roster.
    getAllMentorMilestones: builder.query<{ data: MentorMilestoneRow[] }, void>({
      query: () => ({ url: '/full-support/mentor/milestones', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? (raw as MentorMilestoneRow[]) : [] };
      },
      providesTags: [{ type: 'FullSupportMentorMilestones' as const, id: 'LIST' }],
    }),
    createMentorMilestone: builder.mutation<
      { data: unknown; success: boolean },
      { studentUserId: string; label: string; date?: string | null }
    >({
      query: (body) => ({
        url: '/full-support/mentor/milestones',
        method: 'POST',
        body: { ...body, date: body.date ?? null },
      }),
      invalidatesTags: ['FullSupportMentorMilestones', 'FullSupportMenteeMilestones'],
    }),
    updateMentorMilestone: builder.mutation<
      { data: unknown; success: boolean },
      { id: string; done: boolean }
    >({
      query: ({ id, done }) => ({
        url: `/full-support/mentor/milestones/${id}`,
        method: 'PATCH',
        body: { done },
      }),
      invalidatesTags: ['FullSupportMentorMilestones', 'FullSupportMenteeMilestones'],
    }),
    deleteMentorMilestone: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/full-support/mentor/milestones/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FullSupportMentorMilestones', 'FullSupportMenteeMilestones'],
    }),
    getMenteeMilestones: builder.query<{ data: MilestoneDto[] }, void>({
      query: () => ({ url: '/full-support/mentee/milestones', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportMenteeMilestones'],
    }),
    getMentorPipeline: builder.query<{ data: PipelineDto[] }, void>({
      query: () => ({ url: '/full-support/mentor/pipeline', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportMentorPipeline'],
    }),
    createMentorPipelineRow: builder.mutation<
      { data: unknown; success: boolean },
      { studentUserId: string; program: string; stage?: string; status?: string; aid?: boolean; deadline?: string | null }
    >({
      query: (body) => ({
        url: '/full-support/mentor/pipeline',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FullSupportMentorPipeline', 'FullSupportMenteePipeline'],
    }),
    updateMentorPipelineRow: builder.mutation<
      { data: unknown; success: boolean },
      { id: string; program?: string; stage?: string; status?: string; aid?: boolean; deadline?: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/full-support/mentor/pipeline/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['FullSupportMentorPipeline', 'FullSupportMenteePipeline'],
    }),
    deleteMentorPipelineRow: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/full-support/mentor/pipeline/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FullSupportMentorPipeline', 'FullSupportMenteePipeline'],
    }),
    getMenteePipeline: builder.query<{ data: PipelineDto[] }, void>({
      query: () => ({ url: '/full-support/mentee/pipeline', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportMenteePipeline'],
    }),
    getMenteeCurriculumProgress: builder.query<{ data: CurriculumWatchlistItemDto[] }, void>({
      query: () => ({ url: '/full-support/mentee/curriculum-progress', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportCurriculumProgress'],
    }),
    getMenteeSatProgress: builder.query<{ data: SatProgressSummaryDto | null }, void>({
      query: () => ({
        url: '/full-support/mentee/sat-progress',
        method: 'GET',
        // Prevent ETag/304 responses from keeping stale progress values in RTK Query/browser cache.
        params: { cb: Date.now() },
      }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : null;
        const obj = raw && typeof raw === 'object'
          ? (raw as {
              totalLessons?: number;
              completedLessons?: number;
              overallProgress?: number;
              byCourse?: Array<{
                courseId?: string;
                courseName?: string;
                totalLessons?: number;
                completedLessons?: number;
                percent?: number;
              }>;
            })
          : {};
        return {
          data: obj && typeof obj === 'object'
            ? {
                totalLessons: typeof obj.totalLessons === 'number' ? obj.totalLessons : 0,
                completedLessons: typeof obj.completedLessons === 'number' ? obj.completedLessons : 0,
                overallProgress: typeof obj.overallProgress === 'number' ? obj.overallProgress : 0,
                byCourse: Array.isArray(obj.byCourse)
                  ? obj.byCourse.map((c) => ({
                      courseId: String(c.courseId ?? ''),
                      courseName: String(c.courseName ?? ''),
                      totalLessons: typeof c.totalLessons === 'number' ? c.totalLessons : 0,
                      completedLessons: typeof c.completedLessons === 'number' ? c.completedLessons : 0,
                      percent: typeof c.percent === 'number' ? c.percent : 0,
                    }))
                  : [],
              }
            : null,
        };
      },
      providesTags: ['FullSupportCurriculumProgress'],
    }),
    getMentorCurriculumProgress: builder.query<{ data: CurriculumWatchlistItemDto[] }, string>({
      query: (studentUserId) => ({
        url: '/full-support/mentor/curriculum-progress',
        method: 'GET',
        params: { studentUserId },
      }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: (_res, _err, studentUserId) => [{ type: 'FullSupportCurriculumProgress' as const, id: studentUserId }],
    }),
    setMentorCurriculumItem: builder.mutation<
      { data: unknown },
      { studentUserId: string; key: string; percent: number; target?: string | null }
    >({
      query: (body) => ({
        url: '/full-support/mentor/curriculum-item',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, body) => [
        { type: 'FullSupportCurriculumProgress' as const, id: body.studentUserId },
        'FullSupportCurriculumProgress',
      ],
    }),
    getAdminCurriculumProgress: builder.query<{ data: CurriculumWatchlistItemDto[] }, string>({
      query: (studentUserId) => ({ url: '/full-support/admin/curriculum-progress', method: 'GET', params: { studentUserId } }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportCurriculumProgress'],
    }),
    getAdminStudentSessions: builder.query<
      { data: { sessions: SessionLogDto[]; usedHours: number; allocatedHours: number } },
      string
    >({
      query: (studentUserId) => ({ url: '/full-support/admin/student/sessions', method: 'GET', params: { studentUserId } }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        const obj = raw && typeof raw === 'object' ? (raw as { sessions?: unknown; usedHours?: number; allocatedHours?: number }) : {};
        return {
          data: {
            sessions: Array.isArray(obj.sessions) ? (obj.sessions as SessionLogDto[]) : [],
            usedHours: typeof obj.usedHours === 'number' ? obj.usedHours : 0,
            allocatedHours: typeof obj.allocatedHours === 'number' ? obj.allocatedHours : 6,
          },
        };
      },
      providesTags: ['FullSupportMentorSessions'],
    }),
    getAdminLessons: builder.query<{ data: SessionLogDto[] }, void>({
      query: () => ({ url: '/full-support/admin/lessons', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw as SessionLogDto[] : [] };
      },
      providesTags: ['FullSupportAdmin'],
    }),
    correctAdminLesson: builder.mutation<{ data: SessionLogDto; success: boolean }, { id: string; reason: string; outcome: 'scheduled' | 'held' | 'cancelled' | 'student_no_show' | 'mentor_no_show'; attendance?: 'present' | 'late'; actualDurationMinutes?: number; sharedNotes?: string }>({
      query: ({ id, ...body }) => ({ url: `/full-support/admin/lessons/${id}/correct`, method: 'PATCH', body }),
      invalidatesTags: ['FullSupportAdmin', 'FullSupportMentorSessions', 'FullSupportMentorRoster'],
    }),
    getAdminStudentTasks: builder.query<{ data: TaskDto[] }, string>({
      query: (studentUserId) => ({ url: '/full-support/admin/student/tasks', method: 'GET', params: { studentUserId } }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportMenteeTasks'],
    }),
    getAdminStudentMilestones: builder.query<{ data: MilestoneDto[] }, string>({
      query: (studentUserId) => ({ url: '/full-support/admin/student/milestones', method: 'GET', params: { studentUserId } }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportMentorMilestones'],
    }),
    getAdminStudentPipeline: builder.query<{ data: PipelineDto[] }, string>({
      query: (studentUserId) => ({ url: '/full-support/admin/student/pipeline', method: 'GET', params: { studentUserId } }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportMenteePipeline'],
    }),
    getAdminRecentInteractions: builder.query<{ data: AdminInteractionDto[] }, number | void>({
      query: (limit) => ({
        url: '/full-support/admin/recent-interactions',
        method: 'GET',
        ...(limit != null && limit > 0 ? { params: { limit } } : {}),
      }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        return { data: Array.isArray(raw) ? raw : [] };
      },
      providesTags: ['FullSupportMentorSessions', 'FullSupportMentorTasks', 'FullSupportMentorMilestones'],
    }),
    getWeeklyReport: builder.query<{ data: WeeklyReportData }, string | void>({
      query: (menteeId) => ({
        url: '/full-support/weekly-report',
        method: 'GET',
        ...(menteeId ? { params: { menteeId } } : {}),
      }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : res;
        const d = raw && typeof raw === 'object' && raw !== null ? (raw as WeeklyReportData) : null;
        if (!d) return { data: null as unknown as WeeklyReportData };
        return {
          data: {
            studentName: d.studentName ?? 'Student',
            sessions: Array.isArray(d.sessions) ? d.sessions : [],
            usedHours: typeof d.usedHours === 'number' ? d.usedHours : 0,
            allocatedHours: typeof d.allocatedHours === 'number' ? d.allocatedHours : 0,
            curriculumWatchlist: Array.isArray(d.curriculumWatchlist) ? d.curriculumWatchlist : [],
            tasks: Array.isArray(d.tasks) ? d.tasks : [],
            milestones: Array.isArray(d.milestones) ? d.milestones : [],
            pipeline: Array.isArray(d.pipeline) ? d.pipeline : [],
          },
        };
      },
    }),
    getScholarhubSsoLink: builder.query<{ data: { redirectUrl?: string; token?: string; frontendUrl?: string } }, void>({
      query: () => ({ url: '/full-support/scholarhub/sso-link', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : {};
        return { data: (raw && typeof raw === 'object' && raw !== null ? raw : {}) as { redirectUrl?: string; token?: string; frontendUrl?: string } };
      },
    }),
    getScholarhubLessonProgress: builder.query<{ data: unknown }, { studentUserId: string; courseId: string }>({
      query: ({ studentUserId, courseId }) => ({
        url: '/full-support/scholarhub/progress/lesson',
        method: 'GET',
        params: { studentUserId, courseId },
      }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : {};
        return { data: raw ?? {} };
      },
    }),
    getScholarhubLessonProgressAdmin: builder.query<{ data: unknown }, { scholarhubUserId: string; courseId: string }>({
      query: ({ scholarhubUserId, courseId }) => ({
        url: '/full-support/scholarhub/progress/lesson-admin',
        method: 'GET',
        params: { scholarhubUserId, courseId },
      }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : {};
        return { data: raw ?? {} };
      },
    }),
    getScholarhubCourseProgress: builder.query<{ data: unknown }, { page?: number; perPage?: number } | void>({
      query: (params) => ({
        url: '/full-support/scholarhub/progress/course',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (res: unknown) => {
        const raw = res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: unknown }).data : {};
        return { data: raw ?? {} };
      },
    }),
  }),
});

export const {
  useGetEnrollmentMeQuery,
  useEnrollMutation,
  useAdminEnrollMutation,
  useGetAdminStatsQuery,
  useGetAdminMentorAssignmentsQuery,
  useGetAdminStudentsQuery,
  useGetAdminMentorsQuery,
  useAssignMentorMutation,
  useUnassignMentorMutation,
  useAdminUnenrollMutation,
  useGetMentorRosterQuery,
  useGetStudentGoalQuery,
  useGetMentorSessionsQuery,
  useCreateMentorSessionMutation,
  useUpdateMentorSessionMutation,
  useRecordMentorLessonMutation,
  useUpdateMentorLessonLogMutation,
  useRescheduleMentorLessonMutation,
  useDeleteMentorSessionMutation,
  useGetMentorTasksQuery,
  useCreateMentorTaskMutation,
  useUpdateMentorTaskFeedbackMutation,
  useDecideTaskExtensionMutation,
  useRequestTaskExtensionMutation,
  useLinkMentorTaskToLessonMutation,
  useDeleteMentorTaskMutation,
  useGetMenteeTasksQuery,
  useUploadTaskSubmissionFileMutation,
  useSubmitMenteeTaskMutation,
  useGetMenteeMentorsQuery,
  useUploadMentorFeedbackFileMutation,
  useGetMenteeSessionsQuery,
  useGetMentorMilestonesQuery,
  useGetAllMentorMilestonesQuery,
  useCreateMentorMilestoneMutation,
  useUpdateMentorMilestoneMutation,
  useDeleteMentorMilestoneMutation,
  useGetMenteeMilestonesQuery,
  useGetMentorPipelineQuery,
  useCreateMentorPipelineRowMutation,
  useUpdateMentorPipelineRowMutation,
  useDeleteMentorPipelineRowMutation,
  useGetMenteePipelineQuery,
  useGetMenteeCurriculumProgressQuery,
  useGetMentorCurriculumProgressQuery,
  useSetMentorCurriculumItemMutation,
  useGetMenteeSatProgressQuery,
  useGetAdminCurriculumProgressQuery,
  useGetAdminStudentSessionsQuery,
  useGetAdminLessonsQuery,
  useCorrectAdminLessonMutation,
  useGetAdminStudentTasksQuery,
  useGetAdminStudentMilestonesQuery,
  useGetAdminStudentPipelineQuery,
  useGetAdminRecentInteractionsQuery,
  useGetWeeklyReportQuery,
  useLazyGetWeeklyReportQuery,
  useLazyGetScholarhubSsoLinkQuery,
  useGetScholarhubLessonProgressQuery,
  useGetScholarhubLessonProgressAdminQuery,
  useLazyGetScholarhubLessonProgressAdminQuery,
  useGetScholarhubCourseProgressQuery,
} = fullSupportApi;
