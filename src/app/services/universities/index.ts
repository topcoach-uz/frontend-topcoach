import { UniversitiesSchema } from 'src/app/api/Api';
import type { MajorsSchema } from 'src/app/api/Api';
import { RtkApi } from '../api';
import { normalizeUniversityList, slimUniversityRow, universityListParams } from './universityQuery';
import reviewedUniversityIds from './reviewedUniversityIds.json';
import type { VerifiedUniversityFinance } from 'src/pages/student-hub/applicant/verifiedUniversityFinance';
import type { VerifiedStudyAreaContent } from 'src/pages/student-hub/applicant/verifiedStudyAreaContent';

const reviewedIds = new Set(reviewedUniversityIds);
export { filterUniversityRows, normalizeUniversityList, universityListParams } from './universityQuery';

export interface VerifiedProgramLink { majorId: string; degreeLevel: string; url: string; programmeName: string }
export type UniversityDetail = UniversitiesSchema & { verifiedProgramLinks?: VerifiedProgramLink[]; verifiedStudyAreaContent?: VerifiedStudyAreaContent[]; undergraduateFinanceContent?: VerifiedUniversityFinance | null };

export const universityApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    // Get university detail by ID
    getUniversityDetail: build.query<UniversityDetail, string>({
      query: (id) => ({
        url: `/university/${id}`,
        method: 'GET',
        // Add cache headers for better performance
        headers: {
          'Cache-Control': 'max-age=600', // 10 minutes
        },
      }),
      providesTags: (result, error, id) => [{ type: 'UniversityDetail', id }],
      // Keep data in cache for 20 minutes for faster subsequent loads
      keepUnusedDataFor: 1200,
      // Transform response to optimize data structure
      transformResponse: (response: UniversityDetail) => {
        // Pre-process university data to reduce client-side computation
        return {
          ...response,
          // Pre-calculate commonly used values
          mainImage: response.media?.[0]?.url || null,
          displayRanking: response.rankings?.[0]?.rank || null,
        };
      },
    }),

    // Get all universities (for listing page)
    getUniversities: build.query<{ data: UniversitiesSchema[]; total: number }, { page?: number; limit?: number; search?: string; major?: string; majorName?: string; country?: string; majorType?: "undergraduate" | "graduate" }>({
      query: ({ page = 1, limit = 20, search, major, majorName, country, majorType }) => ({
        url: '/university',
        method: 'GET',
        params: universityListParams({ page, limit, search, major, majorName, country, majorType }),
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes
        },
      }),
      providesTags: ['Universities'],
      keepUnusedDataFor: 600,
      transformResponse: (response: UniversitiesSchema[] | { data: UniversitiesSchema[]; total: number }) => {
        const normalized = normalizeUniversityList(response);
        const rows = normalized.data;
        return { data: rows.map(university => ({
          ...university,
          mainImage: university.media?.[0]?.url || null,
          displayRanking: university.rankings?.[0]?.rank || null,
        })), total: normalized.total };
      },
    }),

    // Fetch complete results before filtering the reviewed catalogue. Filtering
    // after server pagination would leave gaps and incorrect page totals.
    getReviewedUniversities: build.query<{ data: UniversitiesSchema[]; total: number }, { search?: string; majorName?: string; country?: string; majorType?: "undergraduate" | "graduate" }>({
      async queryFn(filters, _api, _extraOptions, baseQuery) {
        const rows = new Map<string, UniversitiesSchema>();
        const first = await baseQuery({ url: '/university', method: 'GET', params: universityListParams({ ...filters, page: 1, limit: 400, view: 'card' }) });
        if (first.error) return { error: first.error };
        const firstBatch = normalizeUniversityList(first.data as UniversitiesSchema[] | { data: UniversitiesSchema[]; total: number });
        const total = firstBatch.total;
        const batches = [firstBatch.data];
        let fetched = firstBatch.data.length;
        if (!firstBatch.data.length && fetched < total) return { error: { status: 'CUSTOM_ERROR', error: 'The university catalogue could not be loaded completely.' } };
        // Remaining pages are independent, so fetch them concurrently instead of one after another.
        const remaining = Math.max(0, Math.ceil(total / 400) - 1);
        const rest = await Promise.all(Array.from({ length: remaining }, (_, index) => baseQuery({ url: '/university', method: 'GET', params: universityListParams({ ...filters, page: index + 2, limit: 400, view: 'card' }) })));
        for (const result of rest) {
          if (result.error) return { error: result.error };
          const batch = normalizeUniversityList(result.data as UniversitiesSchema[] | { data: UniversitiesSchema[]; total: number });
          fetched += batch.data.length;
          batches.push(batch.data);
        }
        if (fetched < total) return { error: { status: 'CUSTOM_ERROR', error: 'The university catalogue could not be loaded completely.' } };
        for (const batch of batches) for (const university of batch) if (reviewedIds.has(university.id)) rows.set(university.id, slimUniversityRow(university) as unknown as UniversitiesSchema);
        const data = Array.from(rows.values());
        return { data: { data, total: data.length } };
      },
      providesTags: ['Universities'],
      keepUnusedDataFor: 1800,
    }),

    getUniversityFilters: build.query<{ majors: Pick<MajorsSchema, 'id' | 'name' | 'type'>[]; countries: string[] }, 'undergraduate' | 'graduate' | void>({
      query: (degree) => ({ url: '/university/filters', method: 'GET', params: { scope: degree ?? 'undergraduate' } }),
      // The response carries ~9k majors (~1 MB) plus lists this page never reads; keep what it renders.
      transformResponse: (response: { majors?: Pick<MajorsSchema, 'id' | 'name' | 'type'>[]; countries?: string[] }, _meta, degree) => ({
        majors: (response.majors ?? []).filter((major) => major.type === (degree ?? 'undergraduate')),
        countries: response.countries ?? [],
      }),
      // Filter values barely change; keep them for an hour so revisits are instant.
      keepUnusedDataFor: 3600,
    }),

    // Prefetch university data (for background loading)
    prefetchUniversity: build.query<UniversitiesSchema, string>({
      query: (id) => ({
        url: `/university/${id}`,
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=600',
        },
      }),
      providesTags: (result, error, id) => [{ type: 'UniversityDetail', id }],
      keepUnusedDataFor: 1200,
    }),
  }),
});

export const {
  useGetUniversityDetailQuery,
  useGetUniversitiesQuery,
  useGetReviewedUniversitiesQuery,
  useGetUniversityFiltersQuery,
  useLazyGetUniversityDetailQuery,
  usePrefetchUniversityQuery,
} = universityApi;
