import { RtkApi } from '../api';

// Types for course enrollment
export interface CourseEnrollmentDto {
  id: string;
  userId: string;
  courseType: 'standard' | 'premium';
  courseName?: 'admissions' | 'sat';
  amount: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: 'click' | 'payme' | 'atmos' | 'card';
  transactionId?: string;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'completed' | 'rejected';
}

export interface CoursePreviewLesson { id: string; title: string; duration: number; isLocked: boolean; contentUrl?: string }
export interface CoursePreviewModule { id: string; title: string; description?: string; lessons: CoursePreviewLesson[]; submodules: { id: string; title: string; lessons: CoursePreviewLesson[] }[] }

export interface CreateCourseEnrollmentDto {
  courseType: 'standard' | 'premium';
  courseName?: 'admissions' | 'sat';
  amount: number;
}

export interface CourseEnrollmentStatusDto {
  isEnrolled: boolean;
  enrollment?: CourseEnrollmentDto;
  canAccessLearning: boolean;
}

export interface CoursePricingDto {
  standardPrice: number;
  premiumPrice: number;
  currency: string;
}

export interface ProgramPricingDto {
  id: string;
  standardPrice: number;
  premiumPrice: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Types for course learning
export interface CourseSubmoduleDto {
  id: string;
  title: string;
  description?: string;
  moduleId: string;
  orderIndex: number;
  isActive: boolean;
  lessons: CourseLessonDto[];
}

export interface CourseModuleDto {
  id: string;
  title: string;
  description?: string;
  mentorId: string;
  mentorName?: string;
  orderIndex: number;
  estimatedDuration: number;
  moduleType: 'standard' | 'premium';
  isActive: boolean;
  mentor: {
    id: string;
    email: string;
    avatar?: string;
  };
  lessons: CourseLessonDto[];
  submodules: CourseSubmoduleDto[];
}

export interface CourseLessonDto {
  id: string;
  title: string;
  description?: string;
  moduleId?: string;
  submoduleId?: string;
  orderIndex: number;
  lessonType: 'video' | 'pdf' | 'live_session' | 'text';
  contentUrl?: string;
  textContentHtml?: string;
  textPracticeUrl?: string;
  textReferences?: { provider: string; url: string }[];
  isDraft?: boolean;
  duration: number;
  isActive: boolean;
  isPremium: boolean;
  // VdoCipher fields for secure video hosting
  useVdoCipher?: boolean;
  vdocipherVideoId?: string;
  vdocipherOtp?: string;
  resources: CourseResourceDto[];
  tasks: CourseTaskDto[];
}

export interface CourseResourceDto {
  id: string;
  title: string;
  description?: string;
  lessonId: string;
  resourceType: 'pdf' | 'document' | 'link' | 'template';
  fileUrl?: string;
  externalUrl?: string;
  fileName?: string;
  fileSize?: number;
  isDownloadable: boolean;
  isPremium: boolean;
  orderIndex: number;
}

export interface UserProgressDto {
  totalLessons: number;
  completedLessons: number;
  totalTimeWatched: number;
  overallProgress: number;
  lastWatchedAt: string;
  progress: LessonProgressDto[];
}

export interface LessonProgressDto {
  id: string;
  userId: string;
  lessonId: string;
  isCompleted: boolean;
  completedAt?: string;
  progressPercentage: number;
  timeWatched: number;
  lastWatchedAt: string;
}

export interface UpdateProgressDto {
  isCompleted?: boolean;
  progressPercentage?: number;
  timeWatched?: number;
}

// Task types
export interface CourseTaskDto {
  id: string;
  lessonId: string;
  title: string;
  question: string;
  taskType: 'multiple_choice';
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswerIndex: number;
  points: number;
  orderIndex: number;
  explanation?: string;
  isActive: boolean;
}

export interface TaskSubmissionDto {
  taskId: string;
  selectedAnswerIndex: number;
}

export interface TaskResultDto {
  submission: {
    id: string;
    taskId: string;
    userId: string;
    selectedAnswerIndex: number;
    isCorrect: boolean;
    score: number;
    attemptNumber: number;
    submittedAt: string;
  };
  isCorrect: boolean;
  score: number;
  correctAnswerIndex: number;
  explanation?: string;
}

export const coursesApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getCoursePreview: builder.query<CoursePreviewModule[], 'admissions' | 'sat'>({
      query: courseName => ({ url: 'courses/learning/preview', params: { courseName } }),
    }),
    // Get active program pricing
    getActivePricing: builder.query<ProgramPricingDto, string | void>({
      query: (courseName) => {
        const params = courseName ? `?courseName=${courseName}` : '';
        return `program-pricing/active${params}`;
      },
      providesTags: ['ProgramPricing'],
    }),

    // Get user enrollment status
    getEnrollmentStatus: builder.query<CourseEnrollmentStatusDto, string | void>({
      query: (courseName) => {
        const params = courseName ? `?courseName=${courseName}` : '';
        return `courses/enrollment-status${params}`;
      },
      providesTags: ['CourseEnrollment'],
    }),

    // Create course enrollment
    createEnrollment: builder.mutation<CourseEnrollmentDto, CreateCourseEnrollmentDto>({
      query: (body) => ({
        url: 'courses/enroll',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CourseEnrollment'],
    }),

    // Get all user enrollments
    getUserEnrollments: builder.query<CourseEnrollmentDto[], void>({
      query: () => 'courses/enrollments',
      providesTags: ['CourseEnrollment'],
    }),

    // Get specific enrollment by ID
    getEnrollmentById: builder.query<CourseEnrollmentDto, string>({
      query: (id) => `courses/enrollments/${id}`,
      providesTags: ['CourseEnrollment'],
    }),

    // Update enrollment status (admin only)
    updateEnrollmentStatus: builder.mutation<
      CourseEnrollmentDto,
      { id: string; paymentStatus: string; paymentMethod?: string; transactionId?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `courses/enrollments/${id}/status`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CourseEnrollment'],
    }),

    // Learning endpoints
    getCourseStructure: builder.query<CourseModuleDto[], string | void>({
      query: (courseName) => {
        const params = courseName ? `?courseName=${courseName}` : '';
        return `courses/learning/structure${params}`;
      },
      providesTags: ['CourseLearning'],
    }),

    getUserProgress: builder.query<UserProgressDto, string | void>({
      query: (courseName) => {
        const params = courseName ? `?courseName=${courseName}` : '';
        return `courses/learning/progress${params}`;
      },
      providesTags: ['CourseProgress'],
    }),

    getLessonProgress: builder.query<LessonProgressDto | null, string>({
      query: (lessonId) => `courses/learning/progress/lesson/${lessonId}`,
      providesTags: ['CourseProgress'],
    }),

    updateLessonProgress: builder.mutation<
      LessonProgressDto,
      { lessonId: string; courseName?: string; data: UpdateProgressDto }
    >({
      query: ({ lessonId, data }) => ({
        url: `courses/learning/progress/lesson/${lessonId}`,
        method: 'PUT',
        body: data,
      }),
      // Optimistic update keyed by the *active* courseName so the
      // sidebar count flips to "completed" immediately, before the
      // server round-trip. Without `courseName` the patch silently
      // targets the wrong cache entry (was a no-op for years).
      async onQueryStarted(
        { lessonId, courseName, data },
        { dispatch, queryFulfilled, getState },
      ) {
        if (!courseName) {
          // Caller didn't tell us which course this lesson belongs
          // to; we'll rely on `invalidatesTags` to refetch instead.
          return;
        }

        const state = getState();
        const structureSel = coursesApi.endpoints.getCourseStructure.select(courseName);
        const structure = structureSel(state as any).data;
        const totalLessons =
          structure?.reduce((total, module) => {
            const direct = module.lessons?.length || 0;
            const sub =
              module.submodules?.reduce(
                (s: number, sm: any) => s + (sm.lessons?.length || 0),
                0,
              ) || 0;
            return total + direct + sub;
          }, 0) || 0;

        const patch = dispatch(
          coursesApi.util.updateQueryData('getUserProgress', courseName, (draft) => {
            if (!draft) return;
            const existing = draft.progress.find((p) => p.lessonId === lessonId);
            if (existing) {
              existing.isCompleted = data.isCompleted ?? existing.isCompleted;
              existing.progressPercentage =
                data.progressPercentage ?? existing.progressPercentage;
              existing.timeWatched = data.timeWatched ?? existing.timeWatched;
              existing.lastWatchedAt = new Date().toISOString();
              if (data.isCompleted) existing.completedAt = new Date().toISOString();
            } else {
              draft.progress.push({
                id: `temp-${lessonId}`,
                userId: 'current-user',
                lessonId,
                isCompleted: !!data.isCompleted,
                progressPercentage: data.progressPercentage || 0,
                timeWatched: data.timeWatched || 0,
                lastWatchedAt: new Date().toISOString(),
                completedAt: data.isCompleted ? new Date().toISOString() : undefined,
              });
            }
            const completed = draft.progress.filter((p) => p.isCompleted).length;
            draft.completedLessons = completed;
            if (totalLessons > 0) {
              draft.totalLessons = totalLessons;
              draft.overallProgress = Math.round((completed / totalLessons) * 100);
            }
            draft.lastWatchedAt = new Date().toISOString();
          }),
        );

        try {
          await queryFulfilled;
        } catch (error) {
          patch.undo();
        }
      },
      // We DO NOT invalidate `CourseProgress` here. Two reasons:
      //   1) Progress ticks fire every few seconds while a video plays;
      //      invalidating on each tick triggers a full GET refetch of
      //      `/courses/learning/progress`, which on this backend has
      //      occasional read-replica lag and can return stale data
      //      (a recently-completed lesson missing from the response),
      //      stomping our correct optimistic patch and dropping the
      //      sidebar count. This caused the "count flickers on every
      //      lesson change" bug.
      //   2) The optimistic patch above is now correctly keyed by
      //      `courseName` and recomputes `completedLessons` /
      //      `overallProgress` itself, so the local cache is already
      //      consistent with the server-confirmed mutation. The next
      //      genuine refetch (page mount / course switch) will reconcile
      //      against the server view if anything ever drifts.
    }),

    completeLesson: builder.mutation<LessonProgressDto, string>({
      query: (lessonId) => ({
        url: `courses/learning/progress/lesson/${lessonId}/complete`,
        method: 'POST',
      }),
      invalidatesTags: ['CourseProgress'],
    }),

    // Task endpoints
    getTasksByLesson: builder.query<CourseTaskDto[], string>({
      query: (lessonId) => `courses/learning/tasks/lesson/${lessonId}`,
      providesTags: ['CourseTasks'],
    }),

    submitTask: builder.mutation<TaskResultDto, TaskSubmissionDto>({
      query: ({ taskId, selectedAnswerIndex }) => {
        const body = { selectedAnswerIndex };
        console.log('Submitting task - URL:', `courses/learning/tasks/${taskId}/submit`, 'Body:', body);
        return {
          url: `courses/learning/tasks/${taskId}/submit`,
          method: 'POST',
          body: body,
        };
      },
      invalidatesTags: ['CourseTasks', 'CourseProgress'],
    }),

    getTaskResults: builder.query<TaskResultDto | null, string>({
      query: (taskId) => `courses/learning/tasks/${taskId}/results`,
      providesTags: ['CourseTasks'],
    }),

    getLessonTaskSubmissions: builder.query<any[], string>({
      query: (lessonId) => `courses/learning/tasks/lesson/${lessonId}/submissions`,
      providesTags: ['CourseTasks'],
    }),

    retakeTask: builder.mutation<{ message: string }, string>({
      query: (taskId) => ({
        url: `courses/learning/tasks/${taskId}/retake`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CourseTasks', 'CourseProgress'],
    }),
  }),
});

export const {
  useGetCoursePreviewQuery,
  useGetActivePricingQuery,
  useGetEnrollmentStatusQuery,
  useCreateEnrollmentMutation,
  useGetUserEnrollmentsQuery,
  useGetEnrollmentByIdQuery,
  useUpdateEnrollmentStatusMutation,
  useGetCourseStructureQuery,
  useGetUserProgressQuery,
  useGetLessonProgressQuery,
  useUpdateLessonProgressMutation,
  useCompleteLessonMutation,
  useGetTasksByLessonQuery,
  useSubmitTaskMutation,
  useGetTaskResultsQuery,
  useGetLessonTaskSubmissionsQuery,
  useRetakeTaskMutation,
} = coursesApi;
