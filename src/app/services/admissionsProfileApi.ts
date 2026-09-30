import { RtkApi } from './api';
export type ProfileStep = 'basic' | 'academic' | 'goals' | 'needs';

// ── DTO mirrors of `src/modules/admissions-profile/...` ────────────────────────

export type ParentInvolvement = 'active' | 'somewhat' | 'independent';
export type SatPlan =
  | 'not_taken'
  | 'retake_planned'
  | 'satisfied'
  | 'not_planning';
export type BudgetRange = 'free_only' | 'under_15' | 'under_100' | 'flexible';

export type AdmissionsProfileDto = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;

  // Step 1
  fullName: string | null;
  gradeLevel: number | null;
  country: string | null;
  currentSchool: string | null;
  parentInvolvement: ParentInvolvement | null;
  targetDegree: 'bachelor' | 'master' | null;
  educationStatus: 'studying' | 'graduated' | null;
  previousInstitution: string | null;
  previousDegree: string | null;
  previousField: string | null;
  bachelorGraduationYear: number | null;
  universityGpa: string | null;
  universityGpaScale: string | null;
  relevantExperience: string | null;
  greScore: string | null;
  gmatScore: string | null;

  // Step 2 (NO GPA)
  satScore: number | null;
  satPlan: SatPlan | null;
  extracurriculars: string | null;
  apCourses: string[];
  honorsAwards: string[];

  // Step 3
  goals: string[];
  academicInterests: string[];
  targetUniversities: string[];

  // Step 4
  challenges: string[];
  applicationTimeline: string | null;
  budgetRange: BudgetRange | null;

  // Funnel
  lastEditedStep: ProfileStep | null;
  completedAt: string | null;
  profileHash: string | null;
};

/** Partial body for autosave PATCH. Send only changed keys. */
export type PatchAdmissionsProfileBody = Partial<{
  fullName: string;
  gradeLevel: number;
  country: string;
  currentSchool: string;
  parentInvolvement: ParentInvolvement;
  targetDegree: 'bachelor' | 'master';
  educationStatus: 'studying' | 'graduated';
  previousInstitution: string;
  previousDegree: string;
  previousField: string;
  bachelorGraduationYear: number;
  universityGpa: string;
  universityGpaScale: string;
  relevantExperience: string;
  greScore: string;
  gmatScore: string;
  satScore: number;
  satPlan: SatPlan;
  extracurriculars: string;
  apCourses: string[];
  honorsAwards: string[];
  goals: string[];
  academicInterests: string[];
  targetUniversities: string[];
  challenges: string[];
  applicationTimeline: string;
  budgetRange: BudgetRange;
  lastEditedStep: ProfileStep;
}>;

export const admissionsProfileApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdmissionsProfile: builder.query<AdmissionsProfileDto | null, void>({
      query: () => 'admissions-profile/me',
      providesTags: ['AdmissionsProfile'],
    }),
    patchAdmissionsProfile: builder.mutation<
      AdmissionsProfileDto,
      PatchAdmissionsProfileBody
    >({
      query: (body) => ({
        url: 'admissions-profile/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdmissionsProfile'],
    }),
    completeAdmissionsProfile: builder.mutation<AdmissionsProfileDto, void>({
      query: () => ({
        url: 'admissions-profile/me/complete',
        method: 'POST',
      }),
      invalidatesTags: ['AdmissionsProfile'],
    }),
  }),
});

export const {
  useGetAdmissionsProfileQuery,
  usePatchAdmissionsProfileMutation,
  useCompleteAdmissionsProfileMutation,
} = admissionsProfileApi;
