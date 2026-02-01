import { RtkApi } from '../api';

export interface ScholarshipOwlScholarship {
  id: string;
  title: string;
  description: string;
  amount: number;
  awards: number;
  start: string;
  deadline: string;
  timezone: string;
  expiredAt: string | null;
  meta?: { next?: string | null };
}

export interface ScholarshipOwlField {
  id: string;
  name: string;
  type: string;
  options?: Record<string, string | { name: string; abbreviation?: string }>;
}

export interface ScholarshipOwlRequirement {
  id: string;
  title: string;
  description: string;
  optional: boolean;
  type: string;
}

export interface ScholarshipOwlScholarshipDetail extends ScholarshipOwlScholarship {
  fields: Array<{
    scholarshipFieldId: string;
    fieldId: string;
    field: ScholarshipOwlField;
  }>;
  requirements: Array<{
    scholarshipRequirementId: string;
    requirementId: string;
    requirement: ScholarshipOwlRequirement;
  }>;
}

export const scholarshipOwlApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getScholarships: builder.query<
      { data: ScholarshipOwlScholarship[]; next: string | null },
      { page?: number; size?: number }
    >({
      query: ({ page = 1, size = 20 }) => ({
        url: '/scholarship-owl/scholarships',
        method: 'GET',
        params: { page, size },
      }),
      providesTags: ['ScholarshipOwl'],
    }),

    getScholarshipById: builder.query<
      { data: ScholarshipOwlScholarshipDetail | null; success: boolean },
      string
    >({
      query: (id) => ({
        url: `/scholarship-owl/scholarships/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) =>
        result?.data ? [{ type: 'ScholarshipOwl', id }] : [],
    }),
  }),
});

export const {
  useGetScholarshipsQuery,
  useGetScholarshipByIdQuery,
} = scholarshipOwlApi;
