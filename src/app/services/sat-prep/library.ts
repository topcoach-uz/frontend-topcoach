/**
 * RTK Query endpoints for the SAT "library" — vocabulary + marked
 * questions. Backed by Postgres tables sat_vocabulary and
 * sat_marked_questions, both keyed per user.
 */

import { satPrepApi } from './index';
import type { SatQuestion } from './types';

export interface VocabularyWord {
  id: string;
  word: string;
  normalizedWord: string;
  questionId: string | null;
  contextHtml: string | null;
  createdAt: string;
}

export interface MarkedQuestion {
  id: string;
  questionId: string;
  note: string | null;
  createdAt: string;
  question: SatQuestion | null;
}

const BASE = '/sat-questions/library';

const libraryApi = satPrepApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Vocabulary ──────────────────────────────────────────────────
    getVocabulary: builder.query<VocabularyWord[], void>({
      query: () => `${BASE}/vocabulary`,
      providesTags: ['SatVocabulary'],
    }),
    addVocabulary: builder.mutation<VocabularyWord, { word: string; questionId?: string; contextHtml?: string }>({
      query: (body) => ({ url: `${BASE}/vocabulary`, method: 'POST', body }),
      invalidatesTags: ['SatVocabulary'],
    }),
    removeVocabulary: builder.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/vocabulary/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: ['SatVocabulary'],
    }),
    clearVocabulary: builder.mutation<{ removed: number }, void>({
      query: () => ({ url: `${BASE}/vocabulary/all`, method: 'DELETE' }),
      invalidatesTags: ['SatVocabulary'],
    }),

    // ─── Marked questions ───────────────────────────────────────────
    getMarkedQuestions: builder.query<MarkedQuestion[], void>({
      query: () => `${BASE}/marked`,
      providesTags: ['SatMarked'],
    }),
    getMarkedQuestionIds: builder.query<string[], void>({
      query: () => `${BASE}/marked/ids`,
      providesTags: ['SatMarked'],
    }),
    markQuestion: builder.mutation<{ id: string; questionId: string }, { questionId: string; note?: string }>({
      query: (body) => ({ url: `${BASE}/marked`, method: 'POST', body }),
      invalidatesTags: ['SatMarked'],
    }),
    unmarkQuestion: builder.mutation<{ ok: true }, string>({
      query: (questionId) => ({
        url: `${BASE}/marked/${encodeURIComponent(questionId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SatMarked'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVocabularyQuery,
  useAddVocabularyMutation,
  useRemoveVocabularyMutation,
  useClearVocabularyMutation,
  useGetMarkedQuestionsQuery,
  useGetMarkedQuestionIdsQuery,
  useMarkQuestionMutation,
  useUnmarkQuestionMutation,
} = libraryApi;
