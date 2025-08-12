import { RtkApi } from '../api';

// Types for course enrollment
export interface CourseEnrollmentDto {
  id: string;
  userId: string;
  courseType: 'standard' | 'premium';
  amount: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: 'click' | 'payme' | 'atmos' | 'card';
  transactionId?: string;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseEnrollmentDto {
  courseType: 'standard' | 'premium';
  amount: number;
}

export interface CourseEnrollmentStatusDto {
  isEnrolled: boolean;
  enrollment?: CourseEnrollmentDto;
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
}

export interface CourseLessonDto {
  id: string;
  title: string;
  description?: string;
  moduleId: string;
  orderIndex: number;
  lessonType: 'video' | 'pdf' | 'live_session';
  contentUrl?: string;
  duration: number;
  isActive: boolean;
  isPremium: boolean;
  // VdoCipher fields for secure video hosting
  useVdoCipher?: boolean;
  vdocipherVideoId?: string;
  vdocipherOtp?: string;
  resources: CourseResourceDto[];
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

export const coursesApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get active program pricing
    getActivePricing: builder.query<ProgramPricingDto, void>({
      query: () => 'program-pricing/active',
      providesTags: ['ProgramPricing'],
    }),

    // Get user enrollment status
    getEnrollmentStatus: builder.query<CourseEnrollmentStatusDto, void>({
      query: () => 'courses/enrollment-status',
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
    getCourseStructure: builder.query<CourseModuleDto[], void>({
      query: () => 'courses/learning/structure',
      providesTags: ['CourseLearning'],
    }),

    getUserProgress: builder.query<UserProgressDto, void>({
      query: () => 'courses/learning/progress',
      providesTags: ['CourseProgress'],
    }),

    getLessonProgress: builder.query<LessonProgressDto | null, string>({
      query: (lessonId) => `courses/learning/progress/lesson/${lessonId}`,
      providesTags: ['CourseProgress'],
    }),

    updateLessonProgress: builder.mutation<LessonProgressDto, { lessonId: string; data: UpdateProgressDto }>({
      query: ({ lessonId, data }) => {
        console.log('RTK Query sending request:', { lessonId, data });
        return {
          url: `courses/learning/progress/lesson/${lessonId}`,
          method: 'PUT',
          body: data,
        };
      },
      async onQueryStarted({ lessonId, data }, { dispatch, queryFulfilled, getState }) {
        console.log('Optimistic update started:', { lessonId, data });
        
        // Get current state to calculate total lessons
        const currentState = getState();
        const courseStructure = coursesApi.endpoints.getCourseStructure.select()(currentState as any);
        const totalLessons = courseStructure.data?.reduce((total, module) => 
          total + (module.lessons?.length || 0), 0
        ) || 0;

        // Optimistic update: immediately update the cache
        const patchResult = dispatch(
          coursesApi.util.updateQueryData('getUserProgress', undefined, (draft) => {
            if (draft) {
              console.log('Updating cache for lesson:', lessonId);
              
              const progressItem = draft.progress.find(p => p.lessonId === lessonId);
              if (progressItem) {
                // Update existing progress item
                progressItem.isCompleted = data.isCompleted || progressItem.isCompleted;
                progressItem.progressPercentage = data.progressPercentage || progressItem.progressPercentage;
                progressItem.timeWatched = data.timeWatched || progressItem.timeWatched;
                progressItem.lastWatchedAt = new Date().toISOString();
                if (data.isCompleted) {
                  progressItem.completedAt = new Date().toISOString();
                }
                console.log('Updated existing progress item:', progressItem);
              } else {
                // Add new progress item if it doesn't exist
                const newProgressItem = {
                  id: `temp-${lessonId}`,
                  userId: 'current-user',
                  lessonId,
                  isCompleted: data.isCompleted || false,
                  progressPercentage: data.progressPercentage || 0,
                  timeWatched: data.timeWatched || 0,
                  lastWatchedAt: new Date().toISOString(),
                  completedAt: data.isCompleted ? new Date().toISOString() : undefined,
                };
                draft.progress.push(newProgressItem);
                console.log('Added new progress item:', newProgressItem);
              }
              
              // Recalculate overall progress using the actual total lessons
              const completedLessons = draft.progress.filter(p => p.isCompleted).length;
              draft.completedLessons = completedLessons;
              draft.totalLessons = totalLessons;
              draft.overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
              
              // Update last watched timestamp
              draft.lastWatchedAt = new Date().toISOString();
              
              console.log('Updated overall progress:', {
                completedLessons,
                totalLessons,
                overallProgress: draft.overallProgress
              });
            }
          })
        );

        try {
          const result = await queryFulfilled;
          console.log('Query fulfilled successfully, updating cache with server response:', result.data);
          console.log('Server response details:', {
            id: result.data.id,
            lessonId: result.data.lessonId,
            isCompleted: result.data.isCompleted,
            progressPercentage: result.data.progressPercentage,
            timeWatched: result.data.timeWatched,
            completedAt: result.data.completedAt
          });
          
          // Update cache with the actual server response data
          dispatch(
            coursesApi.util.updateQueryData('getUserProgress', undefined, (draft) => {
              if (draft) {
                const progressItem = draft.progress.find(p => p.lessonId === lessonId);
                if (progressItem) {
                  // Update with server response data
                  progressItem.id = result.data.id;
                  progressItem.userId = result.data.userId;
                  progressItem.isCompleted = result.data.isCompleted;
                  progressItem.progressPercentage = result.data.progressPercentage;
                  progressItem.timeWatched = result.data.timeWatched;
                  progressItem.lastWatchedAt = result.data.lastWatchedAt;
                  progressItem.completedAt = result.data.completedAt;
                  
                  console.log('Updated cache with server response:', progressItem);
                  console.log('Cache update details:', {
                    lessonId: progressItem.lessonId,
                    isCompleted: progressItem.isCompleted,
                    completedAt: progressItem.completedAt
                  });
                }
              }
            })
          );
        } catch (error) {
          console.error('Query failed, reverting optimistic update:', error);
          // If the mutation fails, revert the optimistic update
          patchResult.undo();
        }
      },
    }),

    completeLesson: builder.mutation<LessonProgressDto, string>({
      query: (lessonId) => ({
        url: `courses/learning/progress/lesson/${lessonId}/complete`,
        method: 'POST',
      }),
      invalidatesTags: ['CourseProgress'],
    }),
  }),
});

export const {
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
} = coursesApi; 