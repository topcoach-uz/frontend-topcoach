/**
 * Turning in-memory MM3 answers into the payload the backend prompt reads.
 *
 * The runner stores answers in the shape the INPUTS need (option indexes for
 * `single`/`multi`, a number for `scale`, a label map for `fields`). The
 * backend digest renders each answer with `String(raw)` / `raw.join(', ')`
 * straight into the Gemini prompt — so shipping raw indexes would show the
 * model `Answer: 2` with no idea what option 2 was. Everything is resolved to
 * human-readable text here, at the boundary.
 *
 * Indexes stay the storage format (stable across locales and across copy
 * edits); labels are produced only at submit time.
 */

import type { TFunction } from 'i18next';

import {
  MM3_QUESTIONS_BY_SLUG,
  MM3_MASTERS_REPLACEMENTS,
  getMm3Questions,
  mm3QuestionKey,
} from './mm3-content';
import type { MM3Answer, MM3FieldsAnswer } from './components/MM3Inputs';

/**
 * Q21's options are REGIONS ("Continental Europe"), but grounding filters on
 * `locations.country` with `ILIKE '%hint%'` — so passing the region label
 * verbatim matches no row and, because the clause is ANDed, collapses the
 * candidate set to nothing.
 *
 * Keyed by option INDEX so it survives translation. Values are checked against
 * the countries actually present in the catalogue; a region we hold no
 * universities for maps to `[]` (send no hint and search unconstrained rather
 * than guarantee zero results). The backend also retries without the country
 * filter if a hinted query comes back empty — belt and braces, because this
 * list will drift as universities are added.
 */
const MM3_COUNTRY_HINTS: Readonly<Record<number, readonly string[]>> = {
  0: ['United States'],
  1: ['United Kingdom'],
  2: ['Canada'],
  3: [
    'Germany',
    'France',
    'Netherlands',
    'Sweden',
    'Switzerland',
    'Belgium',
    'Denmark',
    'Ireland',
  ],
  4: ['South Korea', 'Japan'],
  5: ['Singapore', 'Hong Kong'],
  6: [], // Middle East — no universities in the catalogue today.
  7: [], // Central Asia / closer to home — likewise.
  8: [], // "Open to anywhere" is explicitly not a filter.
};

const COUNTRY_SLUG = 'countries';

/** Resolve an option index to its displayed label. */
const optionLabel = (t: TFunction, slug: string, index: number): string =>
  t(`${mm3QuestionKey(slug)}.opt.${index}`);

/**
 * Answers keyed by slug, every value rendered as text the model can read.
 * Unanswered questions are omitted; the digest prints "(skipped)" for them.
 */
export const buildMm3Payload = (
  answers: Record<string, MM3Answer>,
  t: TFunction,
  targetDegree?: string | null,
): Record<string, unknown> => {
  const payload: Record<string, unknown> = { targetDegree: targetDegree ?? 'bachelor' };

  for (const question of getMm3Questions(targetDegree)) {
    const answer = answers[question.slug];
    if (answer === undefined || answer === null) continue;

    switch (question.type) {
      case 'single':
        if (typeof answer === 'number') {
          payload[question.slug] = optionLabel(t, question.slug, answer);
        }
        break;

      case 'multi':
        if (Array.isArray(answer) && answer.length > 0) {
          payload[question.slug] = answer.map((i) =>
            optionLabel(t, question.slug, i),
          );
        }
        break;

      case 'scale':
        if (typeof answer === 'number') {
          // Bare "4" reads as ambiguous next to a question title; the range
          // makes the direction unmistakable.
          payload[question.slug] = `${answer} out of 5`;
        }
        break;

      case 'fields': {
        if (typeof answer !== 'object' || Array.isArray(answer)) break;
        // Selects already store their label; text fields store what was typed.
        // Drop blanks so the digest shows a clean "—" instead of empty keys.
        const filled = Object.entries(answer as MM3FieldsAnswer).filter(
          ([, v]) => typeof v === 'string' && v.trim().length > 0,
        );
        if (filled.length > 0) {
          payload[question.slug] = Object.fromEntries(
            filled.map(([k, v]) => [k, v.trim()]),
          );
        }
        break;
      }

      default:
        break;
    }
  }

  return payload;
};

/**
 * Concrete country names for the grounding filter, expanded from the regions
 * the student picked. Empty array = search every country.
 */
export const buildMm3CountryHints = (
  answers: Record<string, MM3Answer>,
): string[] => {
  const picked = answers[COUNTRY_SLUG];
  if (!Array.isArray(picked)) return [];

  const hints = new Set<string>();
  for (const index of picked) {
    for (const country of MM3_COUNTRY_HINTS[index] ?? []) hints.add(country);
  }
  return Array.from(hints);
};

// ─────────────────────────────────────────────────────────────────────────
// Prefill — don't re-ask for what the profile already holds
// ─────────────────────────────────────────────────────────────────────────

const asText = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value.trim() || null;
  return null;
};

export interface Mm3Prefill {
  answers: Record<string, MM3Answer>;
  /** Slugs that got a value — the runner shows a "check this" notice on them. */
  slugs: string[];
}

/**
 * Hydrate from `GET /student-profile/my-profile`.
 *
 * Deliberately covers only inputs we can fill DETERMINISTICALLY: free-text
 * scores, and selects whose value is derivable from which fields exist. Grade
 * level, curriculum and activities are stored as free text / arrays that would
 * have to be fuzzy-matched back to an option index — and quietly selecting the
 * wrong option is worse for a student than leaving it blank, so those are left
 * for them to answer.
 */
export const buildMm3Prefill = (
  profile: any,
  t: TFunction,
): Mm3Prefill => {
  const answers: Record<string, MM3Answer> = {};
  const slugs = new Set<string>();

  const academic = profile?.academicProfile ?? {};
  const isMaster = academic.targetDegree === 'master';
  const scores = academic?.testScores ?? {};

  // ── Q3 GPA: value + scale ──────────────────────────────────────────────
  const gpa: Record<string, string> = {};
  const gpaValue = asText(isMaster ? academic.universityGpa : academic?.gpa?.unweighted ?? academic?.gpa?.cumulative);
  if (gpaValue) gpa.gpaValue = gpaValue;

  // Stored numerically (4 / 5 / 100); anything else has no matching option.
  const scaleOption: Record<string, number> = { '4': 0, '4.0': 0, '5': 1, '5.0': 1, '100': 2 };
  const rawScale = asText(isMaster ? academic.universityGpaScale : academic?.gpa?.scale);
  if (rawScale && scaleOption[rawScale] !== undefined) {
    gpa.gpaScale = t(`${mm3QuestionKey('gpa')}.f.gpaScale.opt.${scaleOption[rawScale]}`);
  }
  if (!isMaster && Object.keys(gpa).length > 0) {
    answers.gpa = gpa;
    slugs.add('gpa');
  }

  // ── Q4 SAT/ACT: score + status ─────────────────────────────────────────
  const sat: Record<string, string> = {};
  const satTotal = asText(scores?.sat?.total);
  const actComposite = asText(scores?.act?.composite);
  if (satTotal) sat.satScore = `SAT ${satTotal}`;
  else if (actComposite) sat.satScore = `ACT ${actComposite}`;

  // 2 = Taken SAT, 3 = Taken ACT, 4 = Taken both
  const satStatusIndex =
    satTotal && actComposite ? 4 : satTotal ? 2 : actComposite ? 3 : null;
  if (satStatusIndex !== null) {
    sat.satStatus = t(`${mm3QuestionKey('sat')}.f.satStatus.opt.${satStatusIndex}`);
  }
  if (!isMaster && Object.keys(sat).length > 0) {
    answers.sat = sat;
    slugs.add('sat');
  }

  // ── Q5 English: score + status ─────────────────────────────────────────
  const english: Record<string, string> = {};
  const ielts = asText(scores?.ielts?.overall);
  const toefl = asText(scores?.toefl?.total);
  const duolingo = asText(scores?.duolingo?.total ?? scores?.duolingo);
  if (ielts) {
    english.engScore = `IELTS ${ielts}`;
    english.engStatus = t(`${mm3QuestionKey('english')}.f.engStatus.opt.1`);
  } else if (toefl) {
    english.engScore = `TOEFL ${toefl}`;
    english.engStatus = t(`${mm3QuestionKey('english')}.f.engStatus.opt.2`);
  } else if (duolingo) {
    english.engScore = `Duolingo ${duolingo}`;
    english.engStatus = t(`${mm3QuestionKey('english')}.f.engStatus.opt.3`);
  }
  if (Object.keys(english).length > 0) {
    answers.english = english;
    slugs.add('english');
  }

  if (isMaster) {
    const add = (slug: string, values: Record<string, unknown>) => {
      const present = Object.fromEntries(Object.entries(values).flatMap(([key, value]) => {
        const text = asText(value);
        return text ? [[key, text]] : [];
      }));
      if (Object.keys(present).length) {
        answers[slug] = present;
        slugs.add(slug);
      }
    };
    add('education', {
      status: academic.educationStatus === 'studying'
        ? t('majorMatch3.q.education.f.status.opt.0')
        : academic.educationStatus === 'graduated' ? t('majorMatch3.q.education.f.status.opt.1') : undefined,
      year: academic.bachelorGraduationYear,
    });
    add('degreeBackground', { institution: academic.previousInstitution, degree: academic.previousDegree, field: academic.previousField });
    add('graduateGpa', { value: academic.universityGpa, scale: academic.universityGpaScale });
    add('graduateTests', { gre: academic.greScore, gmat: academic.gmatScore });
    add('experience', { summary: academic.relevantExperience });
  }

  return { answers, slugs: Array.from(slugs) };
};

/** Guard so a stale draft can't reference a question that no longer exists. */
export const isKnownMm3Slug = (slug: string): boolean =>
  MM3_QUESTIONS_BY_SLUG.has(slug) || MM3_MASTERS_REPLACEMENTS.some((question) => question.slug === slug);
