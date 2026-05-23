import { RoleEnum } from 'src/app/api/Api';

/**
 * Master kill-switch for the My Rewards page (TopCoach coins, earning
 * rules, marketplace preview).
 *
 *   false → only SuperAdmin / Owner see the live rewards UI; everyone
 *           else lands on the "Coming soon" placeholder.
 *   true  → My Rewards is available to all enrolled users.
 *
 * Flipped on 2026-05-23 once the coin backend shipped — community
 * users start earning from this point. The marketplace remains locked
 * (per-item `isLockedUntil` from the backend) until 2026-07-01.
 */
export const MY_REWARDS_SHOW_ALL = true;

/**
 * Returns true when the current user should see the live My Rewards
 * editorial flow. SuperAdmin / Owner always pass; everyone else is
 * gated by `MY_REWARDS_SHOW_ALL`.
 */
export function canUseMyRewards(
  managementRole: string | null | undefined,
): boolean {
  const role = managementRole ?? '';
  if (role === RoleEnum.SuperAdmin || role === RoleEnum.Owner) return true;
  return MY_REWARDS_SHOW_ALL;
}
