/**
 * Major Match v2 — frontend structural content (MAJOR_MATCH_V2_PLAN.md
 * "Content architecture" decision). Backend deals only in stable IDs
 * (question ids 1-30, option letters A-F, dimension keys, major slugs); this
 * file holds the STRUCTURE those ids live in (section grouping, which ids
 * are short-answer, option-letter list) but NO human-readable copy — every
 * piece of display text is resolved at render time via i18n key
 * `majorMatch.*` (see scripts/generate-major-match-i18n.py + Stage 3 keys).
 *
 * Mirrors backend-topcoach/src/modules/major-match/engine/constants.ts —
 * kept in sync by hand since one is TS-in-a-NestJS-module and the other is
 * TS-in-a-Vite-app with no shared build step between the two repos.
 */

export interface MajorMatchSection {
  index: number;
  /** All question ids in this section, in display order (includes the SA id). */
  questionIds: number[];
}

export const MM2_TOTAL_QUESTIONS = 30;
export const MM2_TOTAL_SECTIONS = 6;

export const MM2_SECTIONS: MajorMatchSection[] = [
  { index: 0, questionIds: [1, 2, 3, 4, 5] },
  { index: 1, questionIds: [6, 7, 8, 9] },
  { index: 2, questionIds: [10, 11, 12, 13] },
  { index: 3, questionIds: [14, 15, 16, 17, 18] },
  { index: 4, questionIds: [19, 20, 21, 22, 23] },
  { index: 5, questionIds: [24, 25, 26, 27, 28, 29, 30] },
];

/** Flat id order across all 6 sections — the order the runner steps through. */
export const MM2_QUESTION_ORDER: number[] = MM2_SECTIONS.flatMap((s) => s.questionIds);

/** Q4, Q9, Q13, Q17, Q23, Q29 — short-answer, unscored, optional. */
export const MM2_SHORT_ANSWER_IDS: readonly number[] = [4, 9, 13, 17, 23, 29];

export const MM2_SCORED_MC_IDS: readonly number[] = MM2_QUESTION_ORDER.filter(
  (id) => !MM2_SHORT_ANSWER_IDS.includes(id),
);

export const MM2_OPTION_LETTERS: readonly string[] = ['A', 'B', 'C', 'D', 'E', 'F'];

export function isShortAnswer(questionId: number): boolean {
  return MM2_SHORT_ANSWER_IDS.includes(questionId);
}

export function sectionIndexForQuestion(questionId: number): number {
  const section = MM2_SECTIONS.find((s) => s.questionIds.includes(questionId));
  return section ? section.index : 0;
}

/** Canonical dimension key order — mirrors backend DIMENSION_KEYS exactly. */
export const MM2_DIMENSION_KEYS = [
  'analytical',
  'creative',
  'social',
  'investigative',
  'practical',
  'commercial',
] as const;

export type MM2DimensionKey = (typeof MM2_DIMENSION_KEYS)[number];

/**
 * All 13 primary major slugs reachable via the backend engine post-D1 fix
 * (mirrors MAJOR_COMBO_CATALOG's primaryMajorSlug list). Not consumed for
 * scoring on this side — only used where the frontend needs to enumerate
 * "how many majors are we matching against" (e.g. the analyzing copy).
 */
export const MM2_PRIMARY_MAJOR_SLUGS: readonly string[] = [
  'computer-science',
  'mathematics-statistics',
  'engineering',
  'architecture-industrial-design',
  'film-media-communications',
  'psychology',
  'sociology-political-science',
  'business-administration',
  'biology-pre-medicine',
  'law-public-policy',
  'finance-economics',
  'management-information-systems',
  'marketing-advertising',
];

export const MM2_PRIMARY_MAJOR_COUNT = MM2_PRIMARY_MAJOR_SLUGS.length;
