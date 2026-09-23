import { UniversitiesSchema } from 'src/app/api/Api';
import { RtkApi } from '../api';
import { normalizeUniversityList, universityListParams } from './universityQuery';
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
    getUniversities: build.query<{ data: UniversitiesSchema[]; total: number }, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 20, search }) => ({
        url: '/university',
        method: 'GET',
        params: universityListParams({ page, limit, search }),
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
  useLazyGetUniversityDetailQuery,
  usePrefetchUniversityQuery,
} = universityApi;
