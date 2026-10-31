import { RtkApi } from "../api";
import type { CollegeApplication } from "./types";
export type SharedApplication = Omit<CollegeApplication, 'notes' | 'whyThisSchool' | 'financialInfo' | 'activity'> & {
  mentorName?: string;
  canEditApplication: boolean;
  canEditRequirements: boolean;
};
export type EarlierMentorPlan = {
  id: string;
  program: string;
  stage: string;
  status: string;
  aid: boolean;
  deadline?: string;
};
export type ApplicationEdit = {
  universityName?: string;
  major?: string;
  degreeLevel?: "bachelor" | "master";
  intake?: string;
  status?: CollegeApplication["status"];
  deadline?: string | null;
  sharedNotes?: string;
  expectedUpdatedAt?: string;
};
export type SharedApplicationsResponse = {
  data: SharedApplication[];
  canCreate: boolean;
  legacyPlans: EarlierMentorPlan[];
};
export const sharedApplicationsApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getSharedMentorApplications: builder.query<
      SharedApplicationsResponse,
      string
    >({
      query: (student) =>
        `/application-tracking/mentor/students/${encodeURIComponent(student)}/applications`,
      providesTags: ["CollegeApplications"],
    }),
    createSharedMentorApplication: builder.mutation<
      SharedApplication,
      { student: string; data: ApplicationEdit }
    >({
      query: ({ student, data }) => ({
        url: `/application-tracking/mentor/students/${encodeURIComponent(student)}/applications`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CollegeApplications"],
    }),
    updateSharedMentorApplication: builder.mutation<
      SharedApplication,
      { student: string; id: string; data: ApplicationEdit }
    >({
      query: ({ student, id, data }) => ({
        url: `/application-tracking/mentor/students/${encodeURIComponent(student)}/applications/${encodeURIComponent(id)}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["CollegeApplications"],
    }),
    convertEarlierMentorPlan: builder.mutation<
      SharedApplication,
      {
        student: string;
        plan: string;
        data: ApplicationEdit & { applicationId?: string };
      }
    >({
      query: ({ student, plan, data }) => ({
        url: `/application-tracking/mentor/students/${encodeURIComponent(student)}/plans/${encodeURIComponent(plan)}/convert`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [
        "CollegeApplications",
        "FullSupportMentorPipeline",
        "FullSupportMenteePipeline",
      ],
    }),
  }),
});
export const {
  useGetSharedMentorApplicationsQuery,
  useCreateSharedMentorApplicationMutation,
  useUpdateSharedMentorApplicationMutation,
  useConvertEarlierMentorPlanMutation,
} = sharedApplicationsApi;
