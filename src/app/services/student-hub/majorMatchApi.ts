import { RtkApi } from '../api';

/**
 * Major Match v2 RTK slice (MAJOR_MATCH_V2_PLAN.md Stage 4).
 *
 * Deliberately does NOT reuse or join the legacy `psychometricApi`'s bare
 * `'PsychometricAssessment'` tag — that single shared tag across 8 queries +
 * 4 mutations is the documented cause of the app-wide runaway-refetch storm
 * (see ProfilePage.tsx's 4s workaround cap). This slice uses two properly
 * SCOPED tag types instead ('MajorMatchV2Status' / 'MajorMatchV2Result'),
 * each keyed by studentProfileId / result id, so a submit for one student
 * can never invalidate another student's cached data, and reading one past
 * result never invalidates every other query on the page.
 *
 * Only `submitMajorMatch` invalidates anything, and it invalidates only the
 * STATUS query for that one studentProfileId (the plan's "only the status
 * query broadly invalidated" — broadly meaning "the whole status object for
 * this student", not "every Major Match query app-wide").
 */

export interface McAnswerItem {
  questionId: number;
  optionIndex: number;
}

export interface ShortAnswerItem {
  questionId: number;
  text: string;
}

export type MajorMatchLanguage = 'en' | 'ru' | 'uz' | 'kk';

export interface SubmitMajorMatchRequest {
  studentProfileId: string;
  mcAnswers: McAnswerItem[];
  shortAnswers?: ShortAnswerItem[];
  language?: MajorMatchLanguage;
  metadata?: Record<string, unknown>;
}

export type MajorMatchDimensionKey =
  | 'analytical'
  | 'creative'
  | 'social'
  | 'investigative'
  | 'practical'
  | 'commercial';

export type MajorMatchType = 'exact' | 'fallback';

export interface MajorMatchTieBreak {
  applied: boolean;
  margin: number;
  careerVisionScores: { dimensionIndex: number; score: number }[] | null;
  resolvedBy: 'no-tie' | 'career-vision' | 'priority-order';
}

export interface MajorMatchResult {
  id: string;
  studentProfileId: string;
  engineVersion: string;
  catalogVersion: string;
  dimensionScores: Record<MajorMatchDimensionKey, number>;
  totalPoints: number;
  topDimensions: [number, number];
  tieBreak: MajorMatchTieBreak | null;
  matchType: MajorMatchType;
  primaryMajorSlug: string;
  altMajorSlugs: [string, string, string];
  mcAnswers: McAnswerItem[];
  shortAnswers: ShortAnswerItem[];
  language: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MajorMatchAccessStatus {
  canStart: boolean;
  requiresCommunityEnrollment: boolean;
  isCommunityEnrolled: boolean;
  freeSuccessfulAttemptsLimit: number;
  successfulAttemptsUsed: number;
  freeAttemptsRemaining: number;
  promptTitle: string;
  promptMessage: string;
}

export interface MajorMatchStatusResponse {
  hasCompletedV2: boolean;
  hasCompletedLegacy: boolean;
  /** Present on newer servers. The latest-report query remains the safe
   * fallback while older deployments/cached responses omit it. */
  hasCompletedMm3?: boolean;
  latest: MajorMatchResult | null;
  access: MajorMatchAccessStatus;
}

// ── Major Match 3 (MM3) — Gemini-generated report, grounded on our own
// university catalogue. See backend `src/modules/major-match/mm3/
// mm3-analysis.service.ts` for the source of truth these types mirror.

/** Four-signal fit breakdown behind a major's headline `fitScore` — the
 *  server now computes `fitScore` as the average of these. Optional because
 *  the endpoint may still return the pre-breakdown shape (in-flight/cached
 *  reports) — always guard before rendering. */
export interface Mm3FitBreakdown {
  interests: number;
  skills: number;
  workStyle: number;
  goals: number;
}

/** A single glossary entry — a term used on this major's detail panel,
 *  plain-language defined. Optional; concurrent backend work populates it. */
export interface Mm3GlossaryTerm {
  term: string;
  definition: string;
}

export interface Mm3Major {
  name: string;
  fitScore: number;
  why: string;
  careers: string[];
  breakdown?: Mm3FitBreakdown;
  /** Optional plain-language "What is <major>?" blurb. Render only when present. */
  about?: string;
  /** Optional glossary entries specific to this major. Render only when non-empty. */
  terms?: Mm3GlossaryTerm[];
}

export interface Mm3Requirement {
  label: string;
  value: string;
}

export interface Mm3Scholarship {
  text: string;
  /** Null unless an amount appeared verbatim in our own records. */
  amount: string | null;
}

export interface Mm3RoadmapPhase {
  when: string;
  actions: string[];
}

export interface Mm3Professor {
  name: string;
  title: string;
  researchArea: string;
  profileUrl: string | null;
}

export interface Mm3Employer {
  companyName: string;
  industry: string | null;
  note: string | null;
}

export interface Mm3University {
  id: string;
  name: string;
  country: string | null;
  matchedMajor: string;
  /** 0-based index into `Mm3Report.majors` — the grouping key for which
   *  major tab this university belongs to. `matchedMajor` is a free-text
   *  programme name and can differ from `majors[i].name`, so never group on
   *  it. Optional so an older cached report (generated before this field
   *  existed) doesn't crash the page — see MM3Results.tsx's fallback. */
  majorIndex?: number;
  tier: 'Reach' | 'Match' | 'Safety';
  catalogueOnly?: boolean;
  /** Always null today — we hold no acceptance-rate data. Kept so the field
   *  populates with zero schema/UI change if that data ever lands. */
  admissionOdds: string | null;
  whyFit: string;
  requirements: Mm3Requirement[];
  scholarships: Mm3Scholarship[];
  tuition: string | null;
  /** True when we hold a fee but it failed the plausibility floor — the UI
   *  shows "see official page" rather than an implausible number. */
  tuitionUnreliable: boolean;
  roadmap: Mm3RoadmapPhase[];
  /** Optional — most universities have none seeded yet. Only render the
   *  "Professors & labs" section when this is a non-empty array. */
  professors?: Mm3Professor[];
  /** Optional — most universities have none seeded yet. Only render the
   *  "Where graduates get hired" section when this is a non-empty array. */
  employers?: Mm3Employer[];
}

export interface Mm3Report {
  /** Optional persona-style headline for the hero (e.g. "The Analytical
   *  Builder"). Falls back to the generic static title when absent. */
  personaTitle?: string;
  /** Exactly-3 (defensively: at most 3) short badges for the hero row — a
   *  paraphrase of `strengths`, not a copy. Render the hero chip row ONLY
   *  when this is present; do NOT fall back to the long `strengths`
   *  sentences here, they belong in the "YOUR STRENGTHS" panel instead. */
  strengthChips?: string[];
  profileSummary: string;
  strengths: string[];
  gaps: string[];
  majors: Mm3Major[];
  universities: Mm3University[];
  /** Truncated to the first phase server-side when the student is not
   *  subscribed — see `masterRoadmapLocked`/`masterRoadmapTotalPhases`.
   *  Never trust the length of this array as "how many phases exist";
   *  read `masterRoadmapTotalPhases` for that. */
  masterRoadmap: Mm3RoadmapPhase[];
  /** True when `masterRoadmap` above was truncated to 1 phase because the
   *  report owner isn't entitled (same TRIALING/ACTIVE check the standalone
   *  roadmap gates its own action items on). Optional so an older cached
   *  report (generated before this field existed) still type-checks — treat
   *  `undefined` the same as `false` (unlocked), matching what the backend
   *  actually sent for reports from before this gate existed. */
  masterRoadmapLocked?: boolean;
  /** The REAL phase count, independent of truncation — e.g. "showing 1 of
   *  4". Optional for the same reason as `masterRoadmapLocked`. */
  masterRoadmapTotalPhases?: number;
  meta: {
    targetDegree?: 'bachelor' | 'master';
    source: 'ai' | 'partial';
    /** How many universities the model had to choose from. */
    groundedCandidates: number;
    /** Size of the matchable catalogue, for the "How these were chosen" note.
     *  Optional/nullable: absent on reports generated before this field
     *  existed, and null when the backend lookup failed. The UI must drop the
     *  number in both cases rather than fall back to a hardcoded one. */
    catalogueSize?: number | null;
    generatedAt: string;
  };
}

export interface AnalyseMm3Request {
  answers: Record<string, unknown>; // keyed by question SLUG
  countryHints?: string[];
  targetDegree?: 'bachelor' | 'master';
}

// ── Public, unauthenticated Major Match (lead magnet) ──────────────────────
// Stage-1-only: majors + fit reasoning, no grounded universities and no
// roadmap — those are the reasons to create an account. See
// `src/pages/major-match-public/MajorMatchPublicPage.tsx`.

export interface AnalysePublicMm3Request {
  answers: Record<string, unknown>; // keyed by question SLUG
}

export interface Mm3PublicReport {
  /** Optional persona-style headline for the hero. Falls back to a generic
   *  static title when absent — same convention as the authenticated report. */
  personaTitle?: string;
  /** Short badges for the hero row. Render only when present. */
  strengthChips?: string[];
  profileSummary: string;
  strengths: string[];
  gaps: string[];
  majors: Mm3Major[];
  meta: {
    source: 'ai' | 'partial';
    generatedAt: string;
  };
}

export const majorMatchApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    submitMajorMatch: builder.mutation<MajorMatchResult, SubmitMajorMatchRequest>({
      query: (body) => ({
        url: '/major-match/submit',
        method: 'POST',
        body,
      }),
      // Scoped to this one student's status — never a bare/app-wide tag.
      invalidatesTags: (_result, _error, arg) => [
        { type: 'MajorMatchV2Status', id: arg.studentProfileId },
      ],
    }),

    getMajorMatchStatus: builder.query<MajorMatchStatusResponse, string>({
      query: (studentProfileId) => `/major-match/status/${studentProfileId}`,
      providesTags: (_result, _error, studentProfileId) => [
        { type: 'MajorMatchV2Status', id: studentProfileId },
      ],
    }),

    getMajorMatchResult: builder.query<MajorMatchResult, string>({
      query: (id) => `/major-match/result/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'MajorMatchV2Result', id }],
    }),

    getAllMajorMatchResults: builder.query<MajorMatchResult[], string>({
      query: (studentProfileId) => `/major-match/all/${studentProfileId}`,
      providesTags: (_result, _error, studentProfileId) => [
        { type: 'MajorMatchV2Result', id: `LIST-${studentProfileId}` },
      ],
    }),

    // MM3 now best-effort persists server-side (see mm3-analysis.service.ts
    // `analyse()`), keyed by the caller's OWN student profile — this mutation
    // has no studentProfileId argument to tag against, so it relies on the
    // page re-seeding local `report` state directly from the mutation result
    // rather than an invalidated refetch.
    analyseMm3: builder.mutation<Mm3Report, AnalyseMm3Request>({
      query: (body) => ({
        url: '/major-match/mm3/analyse',
        method: 'POST',
        body,
      }),
      // The endpoint identifies the current student from auth, so there is no
      // profile id in the mutation arg. Invalidate the small MM3/status
      // families: mounted consumers immediately reconcile completion and the
      // intro's persisted report after a successful analysis.
      invalidatesTags: ['MajorMatchMm3Latest', 'MajorMatchV2Status'],
    }),

    // Latest persisted MM3 report for a student, or null if none exists yet.
    // Used to restore "View full results" after a refresh/re-navigation, and
    // for the counselor read-only view.
    getLatestMm3Report: builder.query<Mm3Report | null, string>({
      query: (studentProfileId) => `/major-match/mm3/latest/${studentProfileId}`,
      providesTags: (_result, _error, studentProfileId) => [
        { type: 'MajorMatchMm3Latest', id: studentProfileId },
      ],
    }),

    // Public, unauthenticated, rate-limited per IP on the backend — nothing
    // cached, nothing to invalidate.
    analysePublicMm3: builder.mutation<Mm3PublicReport, AnalysePublicMm3Request>({
      query: (body) => ({
        url: '/public/major-match/analyse',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useSubmitMajorMatchMutation,
  useGetMajorMatchStatusQuery,
  useGetMajorMatchResultQuery,
  useGetAllMajorMatchResultsQuery,
  useAnalyseMm3Mutation,
  useGetLatestMm3ReportQuery,
  useAnalysePublicMm3Mutation,
} = majorMatchApi;
