/**
 * Onboarding wizard step machinery shared by the shell (index.tsx) and each
 * step component.
 *
 * Restructured step order (2026-07): role -> info -> source -> opportunity
 * -> telegram -> trial -> majorMatch -> academic. 'info' (name/country/
 * phone/SAT) now runs right after role; 'source' gained a second
 * "why are you using TopCoach" question; the old 'video' + 'community'
 * interstitials were merged into a single 'opportunity' step; 'contact'
 * was folded into 'info' (phone is now collected there). Completion
 * (`onboardingCompletedAt`) still fires at the 'academic' step
 * (StepAcademic.tsx).
 */
export type OnboardingStepId =
  | 'role'
  | 'info'
  | 'source'
  | 'opportunity'
  | 'telegram'
  | 'trial'
  | 'majorMatch'
  | 'academic';

export const STEP_ORDER: OnboardingStepId[] = [
  'role',
  'info',
  'source',
  'opportunity',
  'telegram',
  'trial',
  'majorMatch',
  'academic',
];

// A user may have `onboardingStep` persisted from before this restructure
// ('video'/'community'/'contact' no longer exist as steps). Map those to
// their closest surviving step so a resuming user lands somewhere sane
// instead of falling back all the way to 'role'.
const LEGACY_STEP_REMAP: Record<string, OnboardingStepId> = {
  video: 'opportunity',
  community: 'opportunity',
  contact: 'info',
};

export function isOnboardingStepId(value: unknown): value is OnboardingStepId {
  return typeof value === 'string' && (STEP_ORDER as string[]).includes(value);
}

/**
 * Resolves a persisted `onboardingStep` (possibly a legacy value from
 * before the restructure, possibly unknown/missing) to a valid current
 * step, falling back to 'role'.
 */
export function resolveResumeStepId(value: unknown): OnboardingStepId {
  if (isOnboardingStepId(value)) return value;
  if (typeof value === 'string' && LEGACY_STEP_REMAP[value]) {
    return LEGACY_STEP_REMAP[value];
  }
  return 'role';
}

export function nextStepId(current: OnboardingStepId): OnboardingStepId | null {
  const idx = STEP_ORDER.indexOf(current);
  if (idx === -1 || idx === STEP_ORDER.length - 1) return null;
  return STEP_ORDER[idx + 1];
}

export function prevStepId(current: OnboardingStepId): OnboardingStepId | null {
  const idx = STEP_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return STEP_ORDER[idx - 1];
}
