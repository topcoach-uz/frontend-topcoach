/**
 * Onboarding wizard step machinery shared by the shell (index.tsx) and each
 * step component.
 *
 * Restructured step order (2026-07, general-info-first pass): info -> source
 * -> role -> opportunity -> telegram -> trial -> majorMatch -> academic.
 * 'info' (name/country/phone/SAT) now runs FIRST, before any role choice;
 * 'source' (hear-about + "why are you using TopCoach") comes next; 'role'
 * moved to third — a student there just advances to 'opportunity' like any
 * other step, while a mentor EXITS the wizard entirely (profile.role ->
 * Mentor via PUT /users, then navigate to the mentor signup wizard at
 * ?step=1 — see the 'role' step's onNext handler in index.tsx). The old
 * 'video' + 'community' interstitials were merged into a single
 * 'opportunity' step; 'contact' was folded into 'info' (phone is now
 * collected there). Completion (`onboardingCompletedAt`) still fires at the
 * 'academic' step (StepAcademic.tsx).
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
  'info',
  'source',
  'role',
  'opportunity',
  'telegram',
  'trial',
  'majorMatch',
  'academic',
];

// A user may have `onboardingStep` persisted from before this restructure
// ('video'/'community'/'contact' no longer exist as steps). Map those to
// their closest surviving step so a resuming user lands somewhere sane
// instead of falling back all the way to STEP_ORDER[0].
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
 * step, falling back to the first step in STEP_ORDER ('info').
 */
export function resolveResumeStepId(value: unknown): OnboardingStepId {
  if (isOnboardingStepId(value)) return value;
  if (typeof value === 'string' && LEGACY_STEP_REMAP[value]) {
    return LEGACY_STEP_REMAP[value];
  }
  return STEP_ORDER[0];
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
