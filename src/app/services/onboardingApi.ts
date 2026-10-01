import { RtkApi } from './api';

export type OnboardingPath = 'bachelor' | 'master' | 'mentor';
export type OnboardingAction = 'save' | 'continue' | 'skip';

export interface OnboardingMutationMeta {
  expectedRevision: number;
  requestId: string;
  action: OnboardingAction;
}

export interface OnboardingStudentState {
  universityCountry?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  preferredLanguage?: string | null;
  phoneNumber?: string | null;
  educationStage?: string | null;
  currentSchool?: string | null;
  bachelorsStatus?: string | null;
  graduationYear?: number | null;
  university?: string | null;
  bachelorsQualification?: string | null;
  priorFieldOfStudy?: string | null;
  intendedMajor?: string | null;
  intendedMajorUnsure?: boolean;
  targetCountries?: string[] | null;
  destinationRegions?: string[] | null;
  destinationUnsure?: boolean;
  intakeTerm?: string | null;
  intakeYear?: number | null;
  intakeUnsure?: boolean;
  supportReasons?: string[] | null;
}

export interface OnboardingMentorState {
  universityCountry?: string | null;
  fullName?: string | null;
  linkedin?: string | null;
  profileImageUrl?: string | null;
  languages?: string[] | null;
  university?: string | null;
  major?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  summary?: string | null;
  motivation?: string | null;
  mentorshipValue?: string | null;
  mentoringExperience?: string | null;
  expertise?: string[] | null;
  specializations?: string | null;
  professionalBackground?: string | null;
  applicationSubmittedAt?: string | null;
}

export interface OnboardingState {
  path: OnboardingPath | null;
  currentStep: string | null;
  revision: number;
  onboardingVersion: number;
  completedAt?: string | null;
  telegramConnected: boolean;
  hearAboutSource?: string | null;
  hearAboutOther?: string | null;
  student?: OnboardingStudentState | null;
  mentor?: OnboardingMentorState | null;
}

export type OnboardingMutationResult = OnboardingState & {
  replayed?: boolean;
};

export interface PathRequest extends OnboardingMutationMeta {
  path: OnboardingPath;
}

export interface StudentBasicsRequest extends OnboardingMutationMeta {
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  preferredLanguage?: string | null;
  phoneNumber?: string | null;
}

export interface StudentEducationRequest extends OnboardingMutationMeta {
  universityCountry?: string | null;
  educationStage?: string | null;
  currentSchool?: string | null;
  bachelorsStatus?: string | null;
  graduationYear?: number | null;
  university?: string | null;
  bachelorsQualification?: string | null;
  priorFieldOfStudy?: string | null;
}

export interface StudentDirectionRequest extends OnboardingMutationMeta {
  intendedMajor?: string | null;
  intendedMajorUnsure?: boolean;
  targetCountries?: string[];
  destinationRegions?: string[];
  destinationUnsure?: boolean;
  intakeTerm?: string | null;
  intakeYear?: number | null;
  intakeUnsure?: boolean;
}

export interface StudentSupportRequest extends OnboardingMutationMeta {
  supportReasons: string[];
}

export interface ReferralRequest extends OnboardingMutationMeta {
  hearAboutSource?: string | null;
  hearAboutOther?: string | null;
}

export interface MentorProfileRequest extends OnboardingMutationMeta {
  fullName?: string | null;
  linkedin?: string | null;
  photoMediaId?: string | null;
}

export interface MentorAcademicRequest extends OnboardingMutationMeta {
  universityCountry?: string | null;
  languages?: string[];
  university?: string | null;
  major?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface MentorStoryRequest extends OnboardingMutationMeta {
  summary?: string | null;
  motivation?: string | null;
}

export interface MentorOfferRequest extends OnboardingMutationMeta {
  mentorshipValue?: string | null;
  mentoringExperience?: string | null;
}

export interface MentorExpertiseRequest extends OnboardingMutationMeta {
  expertise?: string[];
  specializations?: string | null;
  professionalBackground?: string | null;
}

export interface ProgressRequest extends OnboardingMutationMeta {
  step: string;
  telegramSkipped?: boolean;
}

export interface CompleteRequest {
  expectedRevision: number;
  requestId: string;
}

const onboardingApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    getOnboarding: build.query<OnboardingState, void>({
      query: () => ({ url: '/onboarding/me' }),
      providesTags: ['Onboarding'],
    }),
    updateOnboardingPath: build.mutation<OnboardingMutationResult, PathRequest>({
      query: (body) => ({ url: '/onboarding/path', method: 'PATCH', body }),
      invalidatesTags: ['Onboarding', 'GetMe'],
    }),
    updateStudentBasics: build.mutation<OnboardingMutationResult, StudentBasicsRequest>({
      query: (body) => ({ url: '/onboarding/student/basics', method: 'PATCH', body }),
      invalidatesTags: ['Onboarding', 'GetMe'],
    }),
    updateStudentEducation: build.mutation<OnboardingMutationResult, StudentEducationRequest>({
      query: (body) => ({ url: '/onboarding/student/education', method: 'PATCH', body }),
      invalidatesTags: ['Onboarding'],
    }),
    updateStudentDirection: build.mutation<OnboardingMutationResult, StudentDirectionRequest>({
      query: (body) => ({ url: '/onboarding/student/direction', method: 'PATCH', body }),
      invalidatesTags: ['Onboarding'],
    }),
    updateStudentSupport: build.mutation<OnboardingMutationResult, StudentSupportRequest>({
      query: (body) => ({ url: '/onboarding/student/support', method: 'PATCH', body }),
      invalidatesTags: ['Onboarding'],
    }),
    updateReferral: build.mutation<OnboardingMutationResult, ReferralRequest>({
      query: (body) => ({ url: '/onboarding/referral', method: 'PATCH', body }),
      invalidatesTags: ['Onboarding'],
    }),
    updateMentorProfile: build.mutation<OnboardingMutationResult, MentorProfileRequest>({
      query: (body) => ({ url: '/onboarding/mentor/profile', method: 'PATCH', body }),
      invalidatesTags: ['Onboarding', 'GetMe'],
    }),
    updateMentorAcademic: build.mutation<OnboardingMutationResult, MentorAcademicRequest>({
      query: (body) => ({ url: '/onboarding/mentor/academic', method: 'PATCH', body }),
      invalidatesTags: ['Onboarding'],
    }),
    updateMentorStory: build.mutation<OnboardingMutationResult, MentorStoryRequest>({
      query: (body) => ({ url: '/onboarding/mentor/story', method: 'PATCH', body }),
      invalidatesTags: ['Onboarding'],
    }),
    updateMentorOffer: build.mutation<OnboardingMutationResult, MentorOfferRequest>({
      query: (body) => ({ url: '/onboarding/mentor/offer', method: 'PATCH', body }),
      invalidatesTags: ['Onboarding'],
    }),
    updateMentorExpertise: build.mutation<OnboardingMutationResult, MentorExpertiseRequest>({
      query: (body) => ({ url: '/onboarding/mentor/expertise', method: 'PATCH', body }),
      invalidatesTags: ['Onboarding'],
    }),
    updateOnboardingProgress: build.mutation<OnboardingMutationResult, ProgressRequest>({
      query: (body) => ({ url: '/onboarding/progress', method: 'PATCH', body }),
      invalidatesTags: ['Onboarding'],
    }),
    completeOnboarding: build.mutation<OnboardingMutationResult, CompleteRequest>({
      query: (body) => ({ url: '/onboarding/complete', method: 'POST', body }),
      invalidatesTags: ['Onboarding', 'GetMe'],
    }),
    submitMentorOnboarding: build.mutation<OnboardingMutationResult, CompleteRequest>({
      query: (body) => ({ url: '/onboarding/mentor/submit', method: 'POST', body }),
      invalidatesTags: ['Onboarding', 'GetMe'],
    }),
  }),
});

export const {
  useGetOnboardingQuery,
  useLazyGetOnboardingQuery,
  useUpdateOnboardingPathMutation,
  useUpdateStudentBasicsMutation,
  useUpdateStudentEducationMutation,
  useUpdateStudentDirectionMutation,
  useUpdateStudentSupportMutation,
  useUpdateReferralMutation,
  useUpdateMentorProfileMutation,
  useUpdateMentorAcademicMutation,
  useUpdateMentorStoryMutation,
  useUpdateMentorOfferMutation,
  useUpdateMentorExpertiseMutation,
  useUpdateOnboardingProgressMutation,
  useCompleteOnboardingMutation,
  useSubmitMentorOnboardingMutation,
} = onboardingApi;
