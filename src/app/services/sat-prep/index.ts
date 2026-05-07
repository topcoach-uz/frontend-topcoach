/**
 * RTK Query slice for the SAT bank backend (`/api/sat-questions`).
 * Endpoints match `src/modules/sat-prep/sat-prep.controller.ts` 1:1.
 */

import { RtkApi } from '../api';
import type {
  AggregateCount,
  ComposeMockTestBody,
  FilteredSatQuestions,
  FilterSatQuestionsQuery,
  SatQuestion,
  SkillCount,
} from './types';

const BASE = '/sat-questions';

export const satPrepApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    filterSatQuestions: builder.query<FilteredSatQuestions, FilterSatQuestionsQuery>({
      query: (params) => ({ url: `${BASE}/filter`, params: params as Record<string, any> }),
      providesTags: ['SatBank'],
    }),

    aggregateSatCounts: builder.query<AggregateCount[], void>({
      query: () => `${BASE}/aggregate-counts`,
      providesTags: ['SatBank'],
    }),

    satSkillCounts: builder.query<SkillCount[], void>({
      query: () => `${BASE}/skill-counts`,
      providesTags: ['SatBank'],
    }),

    getSatQuestionByQuestionId: builder.query<SatQuestion, string>({
      query: (questionId) => `${BASE}/by-question-id/${encodeURIComponent(questionId)}`,
      providesTags: ['SatBank'],
    }),

    getSatQuestionById: builder.query<SatQuestion, string>({
      query: (id) => `${BASE}/${encodeURIComponent(id)}`,
      providesTags: ['SatBank'],
    }),

    composeMockTest: builder.mutation<SatQuestion[], ComposeMockTestBody>({
      query: (body) => ({ url: `${BASE}/mock-test`, method: 'POST', body }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useFilterSatQuestionsQuery,
  useLazyFilterSatQuestionsQuery,
  useAggregateSatCountsQuery,
  useSatSkillCountsQuery,
  useGetSatQuestionByQuestionIdQuery,
  useGetSatQuestionByIdQuery,
  useComposeMockTestMutation,
} = satPrepApi;
