import { RtkApi } from '../api';
import {
  StudentProfile,
  CreateStudentProfileRequest,
  UpdateStudentProfileRequest,
  PaginatedResponse,
  ApiResponse,
} from './types';

export const studentProfileApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get current user's student profile
    getMyStudentProfile: builder.query<StudentProfile, void>({
      query: () => ({
        url: '/student-profile/my-profile',
        method: 'GET',
      }),
      providesTags: ['StudentProfile'],
    }),

    // Get student profile by ID (accepts both profile ID and userId)
    getStudentProfile: builder.query<ApiResponse<StudentProfile>, string>({
      query: (id) => ({
        url: `/student-profile/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'StudentProfile', id }],
    }),

    // Get student profile by userId (for school counselors)
    getStudentProfileByUserId: builder.query<ApiResponse<StudentProfile>, string>({
      query: (userId) => ({
        url: `/student-profile/user/${userId}`,
        method: 'GET',
      }),
      providesTags: (result, error, userId) => [{ type: 'StudentProfile', id: userId }],
    }),

    // Get all student profiles (Admin/Mentor)
    getStudentProfiles: builder.query<
      PaginatedResponse<StudentProfile>,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 10, search }) => ({
        url: '/student-profile',
        method: 'GET',
        params: { page, limit, search },
      }),
      providesTags: ['StudentProfile'],
    }),

    // Create student profile
    createStudentProfile: builder.mutation<
      ApiResponse<StudentProfile>,
      CreateStudentProfileRequest
    >({
      query: (data) => ({
        url: '/student-profile',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['StudentProfile'],
    }),

    // Update student profile
    updateStudentProfile: builder.mutation<
      StudentProfile,
      { id: string; data: UpdateStudentProfileRequest }
    >({
      query: ({ id, data }) => ({
        url: `/student-profile/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'StudentProfile', id },
        'StudentProfile',
      ],
    }),

    // Update current user's student profile
    updateMyStudentProfile: builder.mutation<
      StudentProfile,
      UpdateStudentProfileRequest
    >({
      query: (data) => ({
        url: '/student-profile/my-profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['StudentProfile'],
    }),

    // Ensure the current user has a student_profiles row (+ child rows).
    // Best-effort bootstrap for brand-new accounts — see StepInfo.tsx.
    ensureMyProfile: builder.mutation<
      { message: string; profile: Record<string, unknown> },
      void
    >({
      query: () => ({
        url: '/student-profile/management/ensure-profile',
        method: 'POST',
      }),
      invalidatesTags: ['StudentProfile'],
    }),

    // Delete student profile
    deleteStudentProfile: builder.mutation<void, string>({
      query: (id) => ({
        url: `/student-profile/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StudentProfile'],
    }),

    // Calculate completion percentage
    calculateCompletion: builder.mutation<
      ApiResponse<StudentProfile>,
      string
    >({
      query: (id) => ({
        url: `/student-profile/${id}/calculate-completion`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'StudentProfile', id },
        'StudentProfile',
      ],
    }),

    // Get profile statistics
    getProfileStats: builder.query<
      ApiResponse<{
        completionPercentage: number;
        sectionsCompleted: number;
        totalSections: number;
        lastUpdated: string;
      }>,
      string
    >({
      query: (id) => ({
        url: `/student-profile/stats/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'StudentProfile', id }],
    }),
  }),
});

export const {
  useGetMyStudentProfileQuery,
  useLazyGetMyStudentProfileQuery,
  useGetStudentProfileQuery,
  useGetStudentProfileByUserIdQuery,
  useGetStudentProfilesQuery,
  useCreateStudentProfileMutation,
  useUpdateStudentProfileMutation,
  useUpdateMyStudentProfileMutation,
  useEnsureMyProfileMutation,
  useDeleteStudentProfileMutation,
  useCalculateCompletionMutation,
  useGetProfileStatsQuery,
} = studentProfileApi;