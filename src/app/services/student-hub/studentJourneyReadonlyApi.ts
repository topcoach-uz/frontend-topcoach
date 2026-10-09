/**
 * API service for counselors/admins to view student "My Journey" data in read-only mode
 */
import { RtkApi } from '../api';
import { 
  StudentProfile,
  StudentEssay,
  StudentDocument,
  PaginatedResponse,
  ApiResponse,
} from './types';

// Types for the read-only API responses
interface CollegeApplication {
  id: string;
  universityId?: string;
  universityName?: string;
  deadline?: string;
  status: string;
  applicationType?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ScholarshipApplication {
  id: string;
  scholarshipName: string;
  applicationDeadline?: string;
  status: string;
  amount?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FullSupportSessionLog {
  id: string;
  dateTime: string;
  duration: string;
  description: string;
  done: boolean;
  meetingLink: string | null;
  mentorName: string | null;
  mentorAvatarUrl: string | null;
}

interface DashboardStats {
  totalApplications: number;
  submittedApplications: number;
  totalEssays: number;
  inProgressEssays: number;
  totalDocuments: number;
  totalScholarships: number;
}

interface StudentDashboard {
  profile: StudentProfile | null;
  stats: DashboardStats;
}

// Mirrors TaskDto in backend full-support.service.ts / StudentJourneyReadonlyController#getStudentTasks
export interface StudentJourneyTask {
  id: string;
  task: string;
  studentUserId: string;
  mentorUserId: string;
  status: 'assigned' | 'submitted' | 'approved' | 'revision_requested';
  description?: string;
  deadline: string;
  hasFeedback: boolean;
  feedback?: string;
  submissionText?: string;
  submissionFileUrls?: { fileName: string; url: string }[];
  feedbackFileUrls?: { fileName: string; url: string }[];
}

export const studentJourneyReadonlyApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get student profile (for counselors)
    getStudentJourneyProfile: builder.query<ApiResponse<StudentProfile>, string>({
      query: (userId) => ({
        url: `/student-journey/${userId}/profile`,
        method: 'GET',
      }),
      providesTags: (result, error, userId) => [{ type: 'StudentProfile', id: userId }],
    }),

    // Get student college applications (for counselors)
    getStudentJourneyCollegeApplications: builder.query<PaginatedResponse<CollegeApplication>, string>({
      query: (userId) => ({
        url: `/student-journey/${userId}/college-applications`,
        method: 'GET',
      }),
    }),

    // Get student scholarship applications (for counselors)
    getStudentJourneyScholarshipApplications: builder.query<PaginatedResponse<ScholarshipApplication>, string>({
      query: (userId) => ({
        url: `/student-journey/${userId}/scholarship-applications`,
        method: 'GET',
      }),
    }),

    // Get student essays (for counselors)
    getStudentJourneyEssays: builder.query<{ data: { essays: StudentEssay[] }; total: number }, string>({
      query: (userId) => ({
        url: `/student-journey/${userId}/essays`,
        method: 'GET',
      }),
    }),

    // Get specific essay (for counselors)
    getStudentJourneyEssay: builder.query<ApiResponse<StudentEssay>, { userId: string; essayId: string }>({
      query: ({ userId, essayId }) => ({
        url: `/student-journey/${userId}/essays/${essayId}`,
        method: 'GET',
      }),
    }),

    // Get student documents (for counselors)
    getStudentJourneyDocuments: builder.query<PaginatedResponse<StudentDocument>, string>({
      query: (userId) => ({
        url: `/student-journey/${userId}/documents`,
        method: 'GET',
      }),
    }),

    // Get specific document (for counselors)
    getStudentJourneyDocument: builder.query<ApiResponse<StudentDocument>, { userId: string; documentId: string }>({
      query: ({ userId, documentId }) => ({
        url: `/student-journey/${userId}/documents/${documentId}`,
        method: 'GET',
      }),
    }),

    // Get My Journey summary (for counselors)
    getStudentJourneyDashboard: builder.query<ApiResponse<StudentDashboard>, string>({
      query: (userId) => ({
        url: `/student-journey/${userId}/dashboard`,
        method: 'GET',
      }),
    }),

    // Get student mentor bookings (joined sessions)
    getStudentJourneyMentorBookings: builder.query<{ data: any[] }, string>({
      query: (userId) => ({
        url: `/student-journey/${userId}/mentor-bookings`,
        method: 'GET',
      }),
    }),

    // Get student Full Support 1:1 mentoring session logs (counselor read-only)
    getStudentJourneyFullSupportSessions: builder.query<
      { data: FullSupportSessionLog[] },
      string
    >({
      query: (userId) => ({
        url: `/student-journey/${userId}/full-support-sessions`,
        method: 'GET',
      }),
    }),

    // Get student event applications
    getStudentJourneyEvents: builder.query<{ data: any[] }, string>({
      query: (userId) => ({
        url: `/student-journey/${userId}/events`,
        method: 'GET',
      }),
    }),

    // Get student mentor-assigned tasks (for counselors)
    getStudentJourneyTasks: builder.query<PaginatedResponse<StudentJourneyTask>, string>({
      query: (userId) => ({
        url: `/student-journey/${userId}/tasks`,
        method: 'GET',
      }),
      providesTags: (_result, _error, userId) => [{ type: 'StudentJourneyTasks', id: userId }],
    }),
  }),
});

export const {
  useGetStudentJourneyProfileQuery,
  useGetStudentJourneyCollegeApplicationsQuery,
  useGetStudentJourneyScholarshipApplicationsQuery,
  useGetStudentJourneyEssaysQuery,
  useGetStudentJourneyEssayQuery,
  useGetStudentJourneyDocumentsQuery,
  useGetStudentJourneyDocumentQuery,
  useGetStudentJourneyDashboardQuery,
  useGetStudentJourneyMentorBookingsQuery,
  useGetStudentJourneyFullSupportSessionsQuery,
  useGetStudentJourneyEventsQuery,
  useGetStudentJourneyTasksQuery,
} = studentJourneyReadonlyApi;

