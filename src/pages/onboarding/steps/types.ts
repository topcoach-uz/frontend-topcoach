/**
 * Onboarding wizard step machinery shared by the shell (index.tsx) and each
 * step component. Order matches ONBOARDING_DESIGN.md's step numbering
 * (role=1 .. contact=6). Steps 7 (trial) and 8 (academic handoff) are a
 * later PR — see the TEMP comment on the 'contact' step's completion call
 * in index.tsx.
 */
export type OnboardingStepId =
  | 'role'
  | 'source'
  | 'telegram'
  | 'video'
  | 'community'
  | 'contact';

export const STEP_ORDER: OnboardingStepId[] = [
  'role',
  'source',
  'telegram',
  'video',
  'community',
  'contact',
];

export function isOnboardingStepId(value: unknown): value is OnboardingStepId {
  return typeof value === 'string' && (STEP_ORDER as string[]).includes(value);
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
