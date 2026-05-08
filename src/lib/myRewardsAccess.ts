import { RoleEnum } from 'src/app/api/Api';

/**
 * Master kill-switch for the new editorial My Rewards page (TopCoach
 * coins, missions, marketplace) while it's in internal preview.
 *
 *   false → only SuperAdmin / Owner see the live rewards UI; everyone
 *           else lands on the "Coming soon" placeholder.
 *   true  → My Rewards is available to all enrolled users.
 *
 * Flip this to `true` once we're ready to open the gate to all
 * students. Mirrors `SAT_PREP_SHOW_ALL` so the two staged rollouts
 * read the same.
 */
export const MY_REWARDS_SHOW_ALL = false;

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
