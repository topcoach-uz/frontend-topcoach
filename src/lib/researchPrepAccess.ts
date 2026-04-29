import { RoleEnum } from 'src/app/api/Api';

/** Emails allowed to use Research Prep while the product is in internal preview (in addition to SuperAdmin / Owner). */
export const RESEARCH_PREP_PREVIEW_EMAILS = ['dinararuzimuratova@gmail.com'] as const;

function normEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

/**
 * Live Research Prep (learner + grader flows). SuperAdmin/Owner and an internal preview allowlist only.
 * Regular Admin / mentors / students are gated until launch.
 */
export function canUseResearchPrepLive(
  email: string | null | undefined,
  managementRole: string | null | undefined,
): boolean {
  const role = managementRole ?? '';
  if (role === RoleEnum.SuperAdmin || role === RoleEnum.Owner) return true;
  const e = normEmail(email);
  return RESEARCH_PREP_PREVIEW_EMAILS.some((a) => a === e);
}
