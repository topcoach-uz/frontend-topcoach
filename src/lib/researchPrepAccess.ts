import { RoleEnum } from 'src/app/api/Api';

/** Emails allowed to use Research Prep while the product is in internal preview (in addition to SuperAdmin / Owner). Bypasses the community-access requirement. */
export const RESEARCH_PREP_PREVIEW_EMAILS = ['dinararuzimuratova@gmail.com'] as const;

/**
 * Student emails granted Research Prep access *only when they also have
 * community access*. Used to roll the page out to a small batch of
 * pilot students without flipping it on for everyone with community
 * access. SuperAdmin/Owner/preview emails above bypass the community
 * check; these emails do not.
 */
export const RESEARCH_PREP_COMMUNITY_GATED_EMAILS = [
  'mirzarasulovhamidulllo@gmail.com',
  'r.gulasal09@icloud.com',
  'jaxongirerkinov88@gmail.com',
  'sabina.me.29@gmail.com',
  'mirziyodvaliyev600@gmail.com',
  'bahromperson@gmail.com',
  'razabovujgun9@gmail.com',
  'hadicanematzonova51@gmail.com',
  'azizbek01030412@gmail.com',
  'nodirabegimgulomova27@gmail.com',
  'razhabbayevmirabror@gmail.com',
  'baxtiyorovbehzodbek8@gmail.com',
  'joldasbayevaanora@gmail.com',
  'ruzimuratovadinara@gmail.com',
] as const;

function normEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

/**
 * Live Research Prep (learner + grader flows). Three tiers:
 *   1. SuperAdmin / Owner — unconditional.
 *   2. RESEARCH_PREP_PREVIEW_EMAILS — unconditional (legacy preview).
 *   3. RESEARCH_PREP_COMMUNITY_GATED_EMAILS — only when `isCommunityEnrolled` is true.
 *
 * Callers that don't pass `isCommunityEnrolled` (mentor / admin views
 * looking at other students) skip tier 3, which is intentional —
 * those views gate on staff role, not on a per-student community flag.
 */
export function canUseResearchPrepLive(
  email: string | null | undefined,
  managementRole: string | null | undefined,
  isCommunityEnrolled?: boolean,
): boolean {
  const role = managementRole ?? '';
  if (role === RoleEnum.SuperAdmin || role === RoleEnum.Owner) return true;
  const e = normEmail(email);
  if (RESEARCH_PREP_PREVIEW_EMAILS.some((a) => a === e)) return true;
  if (
    isCommunityEnrolled &&
    RESEARCH_PREP_COMMUNITY_GATED_EMAILS.some((a) => a === e)
  ) {
    return true;
  }
  return false;
}
