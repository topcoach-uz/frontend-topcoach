import { RoleEnum } from 'src/app/api/Api';

/**
 * Emails allowed to use Research Prep while the product is in internal
 * preview (in addition to SuperAdmin / Owner). Bypasses the
 * community-enrolment requirement, so non-Community staff can preview
 * the learner flow without flipping their account into the paid hub.
 */
export const RESEARCH_PREP_PREVIEW_EMAILS = ['dinararuzimuratova@gmail.com'] as const;

function normEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

/**
 * Live Research Prep (learner + grader flows). Three tiers:
 *   1. SuperAdmin / Owner — unconditional.
 *   2. RESEARCH_PREP_PREVIEW_EMAILS — unconditional (legacy preview).
 *   3. Any Community-enrolled student — `isCommunityEnrolled === true`.
 *
 * Callers that don't pass `isCommunityEnrolled` (mentor / admin views
 * looking at other students) skip tier 3, which is intentional —
 * those views gate on staff role, not on a per-student community flag.
 *
 * History: a `RESEARCH_PREP_COMMUNITY_GATED_EMAILS` whitelist used to
 * sit between tiers 2 and 3 so the page could be piloted with a
 * specific batch of students. That gate was removed once Research Prep
 * shipped to the full Community cohort.
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
  if (isCommunityEnrolled) return true;
  return false;
}
