/**
 * Onboarding wizard step machinery shared by the shell (index.tsx) and each
 * step component.
 *
 * Trimmed-tail pass (2026-07): the wizard now ends after 'telegram'. Order:
 * info -> source -> role -> opportunity -> telegram. 'info' (name/country/
 * phone/SAT) runs FIRST, before any role choice; 'source' (hear-about +
 * "why are you using TopCoach") comes next; 'role' runs third — a student
 * there just advances to 'opportunity' like any other step, while a mentor
 * EXITS the wizard entirely (profile.role -> Mentor via PUT /users, then
 * navigate to the mentor signup wizard at ?step=1 — see the 'role' step's
 * onNext handler in index.tsx). The old 'video' + 'community' interstitials
 * were merged into a single 'opportunity' step; 'contact' was folded into
 * 'info' (phone is now collected there). 'trial', 'majorMatch' and
 * 'academic' were REMOVED (onboarding no longer covers the trial pitch,
 * major-match assessment, or the placement-test handoff — those are reached
 * later from inside the product itself). 'telegram' is now the TERMINAL
 * step: completion (`onboardingCompletedAt`) fires there (StepTelegram.tsx),
 * on both the connected/continue path and the Skip path, then navigates to
 * '/student-hub'.
 */
export type OnboardingStepId = 'role' | 'info' | 'source' | 'opportunity' | 'telegram';

export const STEP_ORDER: OnboardingStepId[] = ['info', 'source', 'role', 'opportunity', 'telegram'];

// A user may have `onboardingStep` persisted from before this restructure
// ('video'/'community'/'contact' from the general-info-first pass, and
// 'trial'/'majorMatch'/'academic' from the trimmed-tail pass, no longer
// exist as steps). Map those to their closest surviving step so a resuming
// user lands somewhere sane instead of falling back all the way to
// STEP_ORDER[0].
const LEGACY_STEP_REMAP: Record<string, OnboardingStepId> = {
  video: 'opportunity',
  community: 'opportunity',
  contact: 'info',
  trial: 'telegram',
  majorMatch: 'telegram',
  academic: 'telegram',
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
