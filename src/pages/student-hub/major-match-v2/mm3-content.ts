/**
 * Major Match — "TopCoach Match" question set (30 questions, 3 parts).
 *
 * Content transcribed 1:1 from the product prototype. STRUCTURE ONLY — every
 * user-facing string lives in `public/locales/{en,ru,kk,uz}.json` under the
 * `majorMatch3.*` namespace, exactly as `content.ts` (MM2) does. That keeps
 * 4-locale parity structural rather than a thing someone has to remember.
 *
 * ⚠️ STYLING: we took CONTENT from the prototype and nothing visual. These
 * questions render inside the platform's existing editorial chrome (cream
 * #faf8f3 / maroon #7b1f2f / Iowan serif). Do NOT introduce the prototype's
 * crimson palette, Fraunces/Public Sans webfonts, shield progress SVG, or its
 * class names.
 */

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export type MM3QuestionType = 'single' | 'multi' | 'scale' | 'fields';

/** Sub-field kinds inside a `fields` question. */
export type MM3FieldKind = 'select' | 'text';

export interface MM3Field {
  /** Stable key — also the answer key and the i18n sub-namespace. */
  key: string;
  kind: MM3FieldKind;
  /** `select` only: number of options (labels come from i18n). */
  optionCount?: number;
  /** `text` only: whether a placeholder key exists in i18n. */
  hasPlaceholder?: boolean;
  /** Sub-fields are optional unless listed in the question's `requiredFields`. */
}

interface MM3QuestionBase {
  id: number;
  /** 1 = Academic Profile, 2 = Interests & Personality, 3 = University Preferences. */
  part: 1 | 2 | 3;
  /** Stable slug — the answer key and the i18n namespace (`majorMatch3.q<slug>`). */
  slug: string;
  type: MM3QuestionType;
  /** True when the question shows a sub-line under the title. */
  hasSub: boolean;
}

export interface MM3SingleQuestion extends MM3QuestionBase {
  type: 'single';
  optionCount: number;
  /** 0-based indexes of options that carry a secondary hint line. */
  optionHints: readonly number[];
}

export interface MM3MultiQuestion extends MM3QuestionBase {
  type: 'multi';
  optionCount: number;
  /** Hard cap on selections. */
  max: number;
  optionHints: readonly number[];
}

export interface MM3ScaleQuestion extends MM3QuestionBase {
  type: 'scale';
  /** Always 1..5 in this set; kept explicit so the renderer never assumes. */
  min: 1;
  max: 5;
}

export interface MM3FieldsQuestion extends MM3QuestionBase {
  type: 'fields';
  fields: readonly MM3Field[];
  /** Field keys that must be answered before Continue enables. */
  requiredFields: readonly string[];
}

export type MM3Question =
  | MM3SingleQuestion
  | MM3MultiQuestion
  | MM3ScaleQuestion
  | MM3FieldsQuestion;

// ─────────────────────────────────────────────────────────────────────────
// Parts
// ─────────────────────────────────────────────────────────────────────────

export interface MM3Part {
  index: 1 | 2 | 3;
  /** Display numeral — copy lives in i18n, this is for ordering/keys only. */
  roman: 'I' | 'II' | 'III';
  slug: string;
  questionIds: readonly number[];
  /**
   * Rough minutes for this part, shown on the intro card and summed to
   * tell a returning student how much is left. Deliberately an estimate,
   * not a measurement — it is per-part so the "how much is left" figure
   * shrinks as parts are completed instead of being a fixed number.
   */
  estMinutes: number;
}

export const MM3_PARTS: readonly MM3Part[] = [
  { index: 1, roman: 'I', slug: 'academic', questionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], estMinutes: 3 },
  { index: 2, roman: 'II', slug: 'interests', questionIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], estMinutes: 3 },
  { index: 3, roman: 'III', slug: 'preferences', questionIds: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30], estMinutes: 4 },
] as const;

// ─────────────────────────────────────────────────────────────────────────
// Questions
// ─────────────────────────────────────────────────────────────────────────

export const MM3_QUESTIONS: readonly MM3Question[] = [
  // ── Part I — Academic Profile ──────────────────────────────────────────
  { id: 1, part: 1, slug: 'grade', type: 'single', hasSub: true, optionCount: 6, optionHints: [] },
  { id: 2, part: 1, slug: 'curriculum', type: 'single', hasSub: true, optionCount: 6, optionHints: [0] },
  {
    id: 3, part: 1, slug: 'gpa', type: 'fields', hasSub: true,
    fields: [
      { key: 'gpaScale', kind: 'select', optionCount: 5 },
      { key: 'gpaValue', kind: 'text', hasPlaceholder: true },
      { key: 'gpaTrend', kind: 'select', optionCount: 5 },
    ],
    // Mirrors the prototype: selects gate Continue, free-text does not.
    requiredFields: ['gpaScale', 'gpaTrend'],
  },
  {
    id: 4, part: 1, slug: 'sat', type: 'fields', hasSub: true,
    fields: [
      { key: 'satStatus', kind: 'select', optionCount: 5 },
      { key: 'satScore', kind: 'text', hasPlaceholder: true },
      { key: 'satBreak', kind: 'select', optionCount: 4 },
    ],
    requiredFields: ['satStatus', 'satBreak'],
  },
  {
    id: 5, part: 1, slug: 'english', type: 'fields', hasSub: true,
    fields: [
      { key: 'engStatus', kind: 'select', optionCount: 5 },
      { key: 'engScore', kind: 'text', hasPlaceholder: true },
      { key: 'engSelf', kind: 'select', optionCount: 4 },
    ],
    requiredFields: ['engStatus', 'engSelf'],
  },
  { id: 6, part: 1, slug: 'advanced', type: 'multi', hasSub: true, optionCount: 7, max: 6, optionHints: [4] },
  { id: 7, part: 1, slug: 'strengths', type: 'multi', hasSub: true, optionCount: 10, max: 3, optionHints: [] },
  { id: 8, part: 1, slug: 'olympiad', type: 'single', hasSub: true, optionCount: 6, optionHints: [0] },
  { id: 9, part: 1, slug: 'extracurricular', type: 'multi', hasSub: true, optionCount: 10, max: 8, optionHints: [1] },
  { id: 10, part: 1, slug: 'research', type: 'single', hasSub: true, optionCount: 6, optionHints: [0, 3] },

  // ── Part II — Interests & Personality ──────────────────────────────────
  // Q11 is the only question carrying explicit RIASEC labels (as option hints).
  // The rest of Part II is RIASEC-framed but not RIASEC-scored.
  { id: 11, part: 2, slug: 'flow', type: 'multi', hasSub: true, optionCount: 6, max: 3, optionHints: [0, 1, 2, 3, 4, 5] },
  { id: 12, part: 2, slug: 'problem', type: 'single', hasSub: true, optionCount: 6, optionHints: [] },
  { id: 13, part: 2, slug: 'environment', type: 'single', hasSub: true, optionCount: 8, optionHints: [] },
  { id: 14, part: 2, slug: 'math', type: 'scale', hasSub: true, min: 1, max: 5 },
  { id: 15, part: 2, slug: 'writing', type: 'scale', hasSub: true, min: 1, max: 5 },
  { id: 16, part: 2, slug: 'people', type: 'scale', hasSub: true, min: 1, max: 5 },
  { id: 17, part: 2, slug: 'motivator', type: 'multi', hasSub: true, optionCount: 7, max: 2, optionHints: [] },
  { id: 18, part: 2, slug: 'vision', type: 'single', hasSub: true, optionCount: 7, optionHints: [] },
  { id: 19, part: 2, slug: 'ambiguity', type: 'single', hasSub: true, optionCount: 5, optionHints: [] },
  { id: 20, part: 2, slug: 'never', type: 'single', hasSub: true, optionCount: 7, optionHints: [] },

  // ── Part III — University Preferences ──────────────────────────────────
  { id: 21, part: 3, slug: 'countries', type: 'multi', hasSub: true, optionCount: 9, max: 3, optionHints: [3, 6] },
  { id: 22, part: 3, slug: 'budget', type: 'single', hasSub: true, optionCount: 5, optionHints: [] },
  { id: 23, part: 3, slug: 'size', type: 'single', hasSub: true, optionCount: 5, optionHints: [0, 3] },
  { id: 24, part: 3, slug: 'setting', type: 'single', hasSub: false, optionCount: 4, optionHints: [0, 2] },
  { id: 25, part: 3, slug: 'selectivity', type: 'single', hasSub: true, optionCount: 4, optionHints: [] },
  { id: 26, part: 3, slug: 'language', type: 'single', hasSub: false, optionCount: 4, optionHints: [1] },
  { id: 27, part: 3, slug: 'distance', type: 'scale', hasSub: true, min: 1, max: 5 },
  { id: 28, part: 3, slug: 'culture', type: 'multi', hasSub: true, optionCount: 8, max: 3, optionHints: [] },
  { id: 29, part: 3, slug: 'style', type: 'single', hasSub: false, optionCount: 5, optionHints: [0, 3] },
  {
    id: 30, part: 3, slug: 'timeline', type: 'fields', hasSub: true,
    fields: [
      { key: 'intake', kind: 'select', optionCount: 6 },
      { key: 'degree', kind: 'select', optionCount: 4 },
      { key: 'extra', kind: 'text', hasPlaceholder: true },
    ],
    requiredFields: ['intake', 'degree'],
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────
// Derived
// ─────────────────────────────────────────────────────────────────────────

export const MM3_TOTAL_QUESTIONS = MM3_QUESTIONS.length; // 30
export const MM3_TOTAL_PARTS = MM3_PARTS.length; // 3

export const MM3_QUESTION_ORDER: readonly number[] = MM3_PARTS.flatMap(
  (p) => p.questionIds,
);

export const MM3_QUESTIONS_BY_ID: ReadonlyMap<number, MM3Question> = new Map(
  MM3_QUESTIONS.map((q) => [q.id, q]),
);

export const MM3_QUESTIONS_BY_SLUG: ReadonlyMap<string, MM3Question> = new Map(
  MM3_QUESTIONS.map((q) => [q.slug, q]),
);

/** i18n key root for a question's copy: `majorMatch3.q.<slug>.*` */
export const mm3QuestionKey = (slug: string) => `majorMatch3.q.${slug}`;

/** i18n key root for a sub-field's copy: `majorMatch3.q.<slug>.f.<fieldKey>.*` */
export const mm3FieldKey = (slug: string, fieldKey: string) =>
  `${mm3QuestionKey(slug)}.f.${fieldKey}`;

// ─────────────────────────────────────────────────────────────────────────
// Prefill — do NOT re-ask for data we already hold
// ─────────────────────────────────────────────────────────────────────────

/**
 * Six of this set's inputs duplicate fields already captured during onboarding
 * and in the profile hub. Hydrate them from `GET /student-profile/my-profile`
 * and let the student confirm/edit rather than typing their GPA a third time.
 *
 * Dot-paths are relative to the student-profile response. `null` target =
 * genuinely new, no column exists yet (gpaTrend, satBreak, engSelf).
 */
export const MM3_PREFILL_MAP: Readonly<Record<string, string | null>> = {
  // Q1 / Q2 — academic_profiles
  'grade': 'academicProfile.gradeLevel',
  'curriculum': 'academicProfile.curriculum',
  // Q3 — academic_profiles.gpa
  'gpa.gpaValue': 'academicProfile.gpa.unweighted',
  'gpa.gpaScale': 'academicProfile.gpa.scale',
  'gpa.gpaTrend': null,
  // Q4 — academic_profiles.testScores.sat / .act
  'sat.satScore': 'academicProfile.testScores.sat.total',
  'sat.satStatus': null, // derivable from presence of sat/act, not stored
  'sat.satBreak': null,
  // Q5 — academic_profiles.testScores.ielts / .toefl
  'english.engScore': 'academicProfile.testScores.ielts.overall',
  'english.engStatus': null, // derivable from which test object is populated
  'english.engSelf': null,
  // Q9 — activities_profiles
  'extracurricular': 'activitiesProfile.extracurricularActivities',
} as const;

/** Question slugs that have at least one prefillable input. */
export const MM3_PREFILLABLE_SLUGS: readonly string[] = Array.from(
  new Set(
    Object.entries(MM3_PREFILL_MAP)
      .filter(([, target]) => target !== null)
      .map(([key]) => key.split('.')[0]),
  ),
);
