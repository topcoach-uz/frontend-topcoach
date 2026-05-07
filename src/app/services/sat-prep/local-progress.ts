/**
 * SAT progress — backend-backed.
 *
 * Was localStorage-only; now talks to the real `sat_attempts` / `sat_sessions`
 * tables via the JWT-protected /api/sat-questions/{sessions,progress} routes.
 * The function names and shapes are kept stable for callers — internal
 * implementation just hits the API instead of localStorage.
 */

import { satPrepApi } from './index';
import type { SatQuestion, SatSection } from './types';

export interface SessionRecord {
  id: string;
  mode: 'mock' | 'pack' | 'practice';
  section: SatSection;
  mockId?: string | null;
  title: string;
  totalQ: number;
  correctQ: number;
  durationSec: number;
  completedAt: string;
  estimatedScore?: number | null;
}

export interface SkillMastery {
  skill: string;
  domain: string;
  section: SatSection;
  attempts: number;
  correct: number;
  pct: number;
}

export interface ProgressSummary {
  personalBest: { score: number; title: string; completedAt: string } | null;
  lastSession: SessionRecord | null;
  streak: { count: number; lastPracticeDate: string | null };
  focusArea: SkillMastery | null;
  masteryRows: SkillMastery[];
  recentSessions: SessionRecord[];
  mockSessions: SessionRecord[];
  packSessions: SessionRecord[];
}

interface AttemptInput {
  questionId: string;
  isCorrect: boolean;
  userAnswer?: string;
}

interface RecordSessionInput {
  mode: 'mock' | 'pack' | 'practice';
  section: SatSection;
  mockId?: string;
  title: string;
  durationSec: number;
  attempts: AttemptInput[];
}

// ─── Endpoint registration ────────────────────────────────────────────
// Extends the existing satPrepApi RTK slice so caching invalidation
// works alongside other SAT queries.

const progressApi = satPrepApi.injectEndpoints({
  endpoints: (builder) => ({
    getSatProgress: builder.query<ProgressSummary, void>({
      query: () => '/sat-questions/progress/me',
      providesTags: ['SatBank'],
    }),
    recordSatSession: builder.mutation<SessionRecord, RecordSessionInput>({
      query: (body) => ({
        url: '/sat-questions/sessions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SatBank'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetSatProgressQuery, useRecordSatSessionMutation } = progressApi;

// ─── Imperative helpers (used by the runner outside React) ────────────
// We need these because the runner's submit happens inside a Modal
// confirm callback — easier to just dispatch the mutation than to wire a
// hook through Antd. Same pattern as how the rest of the app uses RTK.

import { store } from 'src/app/store';

export async function recordSession(input: {
  questions: SatQuestion[];
  perQuestionCorrect: Record<string, boolean>;
  perQuestionAnswer?: Record<string, string>;
  mode: 'mock' | 'pack' | 'practice';
  section: SatSection;
  title: string;
  durationSec: number;
  mockId?: string;
}): Promise<SessionRecord | null> {
  const attempts: AttemptInput[] = input.questions.map((q) => ({
    questionId: q.questionId,
    isCorrect: !!input.perQuestionCorrect[q.id],
    userAnswer: input.perQuestionAnswer?.[q.id],
  }));
  try {
    const result = await store
      .dispatch(progressApi.endpoints.recordSatSession.initiate({
        mode: input.mode,
        section: input.section,
        mockId: input.mockId,
        title: input.title.slice(0, 200),
        durationSec: input.durationSec,
        attempts,
      }))
      .unwrap();
    return result;
  } catch {
    return null;
  }
}
