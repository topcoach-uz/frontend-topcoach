/**
 * Frontend safety-net for roadmaps generated before the prompt learned
 * about 11-year school systems. For students from countries whose
 * school ends at grade 11 (Uzbekistan, Russia, etc.) and who are
 * already in grade 11, swap any "grade 12" wording the LLM might still
 * emit with "final year" so the displayed copy matches their reality.
 *
 * Long-term the prompt handles this directly — this helper exists so
 * existing stored roadmaps don't need to be regenerated to look right.
 */

const ELEVEN_YEAR_SCHOOL_COUNTRIES = new Set([
  'uzbekistan',
  'russia',
  'kazakhstan',
  'kyrgyzstan',
  'tajikistan',
  'turkmenistan',
  'belarus',
  'azerbaijan',
  'armenia',
]);

export function isElevenYearSystem(
  country: string | null | undefined,
  gradeLevel: number | null | undefined,
): boolean {
  if (gradeLevel !== 11) return false;
  return ELEVEN_YEAR_SCHOOL_COUNTRIES.has(
    (country ?? '').toLowerCase().trim(),
  );
}

/**
 * Rewrite a single label/string. Case-preserving for the common
 * UPPER and Title variants we see in roadmap copy. Leaves anything
 * we don't recognize untouched — better to under-translate than to
 * mangle.
 */
export function localizeGradeText(input: string): string {
  if (!input) return input;
  return input
    .replace(
      /\bSummer\s+Prior\s+to\s+12th\s+Grade\b/gi,
      'Summer Before Final Year',
    )
    .replace(/\b12TH\s+GRADE\b/g, 'FINAL YEAR')
    .replace(/\b12th\s+grade\b/gi, 'final year')
    .replace(/\bgrade\s+12\b/gi, 'final year')
    .replace(
      /\bsenior\s+year\s+of\s+high\s+school\b/gi,
      'final year of school',
    );
}
