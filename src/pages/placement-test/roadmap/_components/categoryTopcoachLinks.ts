import type {
  RoadmapActionItem,
  RoadmapCategory,
  RoadmapTopcoachLink,
} from 'src/app/services/roadmapApi';

/**
 * Per-category fallback TopCoach deep links shared between the on-page
 * `ActionItemRow` and the PDF export.
 *
 * The LLM is supposed to populate `topcoachResource`, but it often
 * returns null or sends users to the wrong path (e.g. the legacy
 * `?section=sat-prep` query rather than the current `/student-hub/sat-prep`
 * route). For SAT-prep especially we always want our own canonical
 * page to be the primary CTA, so we override the LLM's link when the
 * category is something we have a first-party page for.
 */
export const CATEGORY_TOPCOACH_FALLBACK: Partial<
  Record<RoadmapCategory, RoadmapTopcoachLink>
> = {
  Testing: {
    section: 'SAT Prep',
    path: '/student-hub/sat-prep',
    action: 'Open TopCoach SAT Prep',
  },
  Research: {
    section: 'Research Prep',
    path: '/student-hub/research-prep',
    action: 'Open Research Prep program',
  },
  Essays: {
    section: 'Admissions',
    path: '/student-hub/admissions',
    action: 'Open Admissions program',
  },
  English: {
    section: 'Admissions',
    path: '/student-hub/admissions',
    action: 'Open Admissions program',
  },
};

/**
 * Returns the TopCoach link the row should render, preferring our
 * hard-coded canonical path over whatever the LLM produced. Used by
 * both the UI and the PDF so the displayed/printed CTAs match.
 */
export function pickTopcoachLink(
  item: RoadmapActionItem,
): RoadmapTopcoachLink | null {
  const fallback = CATEGORY_TOPCOACH_FALLBACK[item.category];
  if (fallback) return fallback;
  return item.topcoachResource ?? null;
}
