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
  }),
});

export const {
  useGetActivePricingQuery,
  useGetEnrollmentStatusQuery,
  useCreateEnrollmentMutation,
  useGetUserEnrollmentsQuery,
  useGetEnrollmentByIdQuery,
  useUpdateEnrollmentStatusMutation,
} = coursesApi; 