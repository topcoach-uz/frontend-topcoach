import { UniversitiesSchema } from 'src/app/api/Api';
import type { MajorsSchema } from 'src/app/api/Api';
import { RtkApi } from '../api';
import { normalizeUniversityList, universityListParams } from './universityQuery';
import reviewedUniversityIds from './reviewedUniversityIds.json';

const reviewedIds = new Set(reviewedUniversityIds);
export { normalizeUniversityList, universityListParams } from './universityQuery';

export const universityApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    // Get university detail by ID
    getUniversityDetail: build.query<UniversitiesSchema, string>({
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
      transformResponse: (response: UniversitiesSchema) => {
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
        let page = 1;
        let fetched = 0;
        let total = 0;
        do {
          const result = await baseQuery({ url: '/university', method: 'GET', params: universityListParams({ ...filters, page, limit: 400 }) });
          if (result.error) return { error: result.error };
          const batch = normalizeUniversityList(result.data as UniversitiesSchema[] | { data: UniversitiesSchema[]; total: number });
          total = batch.total;
          if (!batch.data.length && fetched < total) return { error: { status: 'CUSTOM_ERROR', error: 'The university catalogue could not be loaded completely.' } };
          for (const university of batch.data) if (reviewedIds.has(university.id)) rows.set(university.id, university);
          fetched += batch.data.length;
          page += 1;
        } while (fetched < total);
        const data = Array.from(rows.values());
        return { data: { data, total: data.length } };
      },
      providesTags: ['Universities'],
      keepUnusedDataFor: 600,
    }),

    getUniversityFilters: build.query<{ majors: Pick<MajorsSchema, 'id' | 'name' | 'type'>[]; countries: string[] }, void>({
      query: () => ({ url: '/university/filters', method: 'GET' }),
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
