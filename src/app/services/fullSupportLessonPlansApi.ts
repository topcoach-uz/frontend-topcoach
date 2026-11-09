import { RtkApi } from './api';

export type LessonPlanInput = {
  requestId: string;
  studentUserId: string;
  timezone: string;
  startsOn: string;
  time: string;
  repeat: 'none' | 'weekly' | 'biweekly';
  weekdays: number[];
  endMode: 'count' | 'date';
  count?: number;
  until?: string;
  excludedDates?: string[];
  durationMinutes: number;
  topic: string;
  meetingLink?: string;
};
export type LessonChangeInput = {
  requestId: string;
  action: 'reschedule' | 'cancel';
  scope: 'one' | 'following';
  expectedDateTime: string;
  timezone: string;
  startsOn?: string;
  time?: string;
  durationMinutes?: number;
  meetingLink?: string | null;
  reason?: string;
};
export type LessonPlanPreview = {
  sessions: Array<{
    id?: string;
    dateTime: string;
    endTime: string;
    localDate?: string;
    previousDateTime?: string;
    excluded?: boolean;
  }>;
  timezone: string;
  totalMinutes?: number;
  conflicts: Array<{
    dateTime: string;
    kind: string;
    startsAt: string;
    endsAt: string;
  }>;
};
export const lessonPlansApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    getFullSupportSchedulingStudents: build.query<
      { data: Array<{ id: string; name: string }> },
      void
    >({
      query: () => '/full-support/mentor/lesson-plans/students',
      providesTags: ['FullSupportMentorRoster'],
    }),
    previewFullSupportPlan: build.mutation<
      { data: LessonPlanPreview },
      LessonPlanInput
    >({
      query: (body) => ({
        url: '/full-support/mentor/lesson-plans/preview',
        method: 'POST',
        body,
      }),
    }),
    createFullSupportPlan: build.mutation<
      { data: LessonPlanPreview },
      LessonPlanInput
    >({
      query: (body) => ({
        url: '/full-support/mentor/lesson-plans',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'FullSupportMentorRoster',
        'FullSupportMentorSessions',
        'FullSupportAdmin',
      ],
    }),
    previewFullSupportChange: build.mutation<
      { data: LessonPlanPreview },
      { id: string; body: LessonChangeInput }
    >({
      query: ({ id, body }) => ({
        url: `/full-support/mentor/sessions/${id}/change-preview`,
        method: 'POST',
        body,
      }),
    }),
    changeFullSupportPlan: build.mutation<
      { data: LessonPlanPreview },
      { id: string; body: LessonChangeInput }
    >({
      query: ({ id, body }) => ({
        url: `/full-support/mentor/sessions/${id}/change`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'FullSupportMentorRoster',
        'FullSupportMentorSessions',
        'FullSupportAdmin',
      ],
    }),
  }),
});
export const {
  useGetFullSupportSchedulingStudentsQuery,
  usePreviewFullSupportPlanMutation,
  useCreateFullSupportPlanMutation,
  usePreviewFullSupportChangeMutation,
  useChangeFullSupportPlanMutation,
} = lessonPlansApi;
