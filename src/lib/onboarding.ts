/**
 * Onboarding completion check, shared by the wizard shell and the
 * centralized route gate (see ONBOARDING_DESIGN.md §5).
 *
 * FAILS OPEN ON PURPOSE: this frontend PR ships before its backend
 * companion PR, which is the one that adds `onboardingCompletedAt` to the
 * `getMe` payload. Until that field exists, every caller sees `undefined`
 * here and this returns `true` (already onboarded) — so today's users see
 * zero behavior change and are never redirected into /onboarding. Once the
 * backend field lands, a fresh user has `onboardingCompletedAt: null` until
 * they finish the wizard — that is the ONLY value this treats as
 * incomplete.
 */

export interface OnboardingStatus {
  onboardingVersion?: number | null;
  onboardingCompletedAt?: string | null;
  onboardingStep?: string | null;
  hearAboutSource?: string | null;
  usageReasons?: string[] | null;
}

export function isOnboardingComplete(
  user: OnboardingStatus | null | undefined,
): boolean {
  return user?.onboardingCompletedAt !== null;
}
