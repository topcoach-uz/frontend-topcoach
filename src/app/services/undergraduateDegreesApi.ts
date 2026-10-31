import { RtkApi } from './api';

export interface QualificationRequirement {label:string;value:string;note?:string|null;scope:string;sourceTitle:string;sourceUrl:string;verifiedAt:string;}

export interface UndergraduateDegree {
  qualificationRequirements?: QualificationRequirement[];
  id: string;
  universityId: string;
  slug: string;
  name: string;
  degreeType: string;
  durationYears: number | null;
  studyMode: string | null;
  courseCode: string | null;
  description: string | null;
  curriculumSummary: string | null;
  firstYearSubjects: string | null;
  entrySummary: string | null;
  qualificationLabel: string | null;
  qualificationValue: string | null;
  qualificationNote: string | null;
  admissionsTest: string | null;
  admissionsTestNote: string | null;
  feesSummary: string | null;
  fundingSummary: string | null;
  fundingPolicyNote: string | null;
  applicationSummary: string | null;
  deadlineAt: string | null;
  deadlineNote: string | null;
  officialDegreeUrl: string;
  curriculumUrl: string | null;
  requirementsUrl: string | null;
  feesUrl: string | null;
  fundingPolicyUrl: string | null;
  applicationUrl: string | null;
  sourceTitle: string;
  sourceUrl: string;
  verifiedAt: string;
  fieldAliases: string[];
}

export function degreeMatchesField(degree: UndergraduateDegree, selectedField: string): boolean {
  const normalized = selectedField.trim().normalize('NFKC').replace(/\s+/g, ' ').toLocaleLowerCase('en');
  return Boolean(normalized && degree.fieldAliases.some((alias) => alias.trim().normalize('NFKC').replace(/\s+/g, ' ').toLocaleLowerCase('en') === normalized));
}

export const undergraduateDegreesApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getUndergraduateDegrees: builder.query<UndergraduateDegree[], string>({
      query: (universityId) => ({ url: `/university/${universityId}/undergraduate-degrees`, method: 'GET' }),
    }),
    getUndergraduateDegree: builder.query<UndergraduateDegree, { universityId: string; slug: string }>({
      query: ({ universityId, slug }) => ({ url: `/university/${universityId}/undergraduate-degrees/${encodeURIComponent(slug)}`, method: 'GET' }),
    }),
  }),
});

export const { useGetUndergraduateDegreesQuery, useGetUndergraduateDegreeQuery } = undergraduateDegreesApi;
