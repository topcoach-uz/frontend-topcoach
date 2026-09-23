import { RtkApi } from '../api';

export type ApplicantDegree = 'bachelor' | 'master' | null;
export type OverviewSection<T> =
  | { state: 'ready'; data: T }
  | { state: 'error'; data: null };
export interface ApplicantProfile {
  id: string;
  name: string | null;
  targetDegree: ApplicantDegree;
  completionPercentage: number;
  currentSchool: string | null;
  previousInstitution: string | null;
  previousDegree: string | null;
  previousField: string | null;
  intendedField: string | null;
  fieldUndecided: boolean;
  destinations: string[];
  destinationUndecided: boolean;
  intakeTerm: string | null;
  intakeYear: number | null;
}
export interface OverviewApplication {
  id: string;
  universityName: string | null;
  major: string | null;
  degreeLevel: ApplicantDegree;
  status: string;
  deadline: string | null;
}
export interface ApplicantOverview {
  profile: ApplicantProfile | null;
  applications: OverviewSection<{
    total: number;
    active: { total: number; items: OverviewApplication[] };
    shortlist: { total: number; items: OverviewApplication[] };
    nextDeadline: OverviewApplication | null;
  }>;
  tasks: OverviewSection<{
    total: number;
    open: number;
    items: Array<{
      id: string;
      title: string;
      dueDate: string | null;
      status: string;
      applicationId: string | null;
    }>;
  }>;
  documents: OverviewSection<{ total: number }>;
  sessions: OverviewSection<{
    total: number;
    next: {
      id: string;
      date: string;
      durationMinutes: number;
      mentorName: string | null;
      mentorId: string | null;
      meetingLink: string | null;
    } | null;
  }>;
}

export const applicantOverviewApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getApplicantOverview: builder.query<ApplicantOverview, string>({
      // The argument scopes the client cache to the signed-in account. The
      // server derives identity from the JWT and accepts no target user ID.
      query: () => '/student-hub/overview',
      providesTags: [
        'StudentProfile',
        'CollegeApplications',
        'ApplicationTasks',
        'StudentDocuments',
        'MySessions',
      ],
    }),
  }),
});

export const { useGetApplicantOverviewQuery } = applicantOverviewApi;
