/**
 * Onboarding wizard step machinery shared by the shell (index.tsx) and each
 * step component. Order matches ONBOARDING_DESIGN.md's step numbering
 * (role=1 .. academic=9, with 'majorMatch' inserted between 'trial' and
 * 'academic'). Completion (`onboardingCompletedAt`) now fires at the
 * 'academic' step (StepAcademic.tsx), not at 'contact' anymore.
 */
export type OnboardingStepId =
  | 'role'
  | 'source'
  | 'telegram'
  | 'video'
  | 'community'
  | 'contact'
  | 'trial'
  | 'majorMatch'
  | 'academic';

export const STEP_ORDER: OnboardingStepId[] = [
  'role',
  'source',
  'telegram',
  'video',
  'community',
  'contact',
  'trial',
  'majorMatch',
  'academic',
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
