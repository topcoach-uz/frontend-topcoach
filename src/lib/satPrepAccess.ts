import { RoleEnum } from 'src/app/api/Api';

/**
 * Master kill-switch for SAT Prep visibility while the product is in
 * internal preview.
 *
 *   false → only SuperAdmin / Owner see the live SAT Prep flows; everyone
 *           else lands on the "Coming soon" placeholder.
 *   true  → SAT Prep is available to all enrolled users.
 *
 * Flip this to `true` when we're ready to open the gate to all students.
 */
export const SAT_PREP_SHOW_ALL = false;

/**
 * Returns true when the current user should see the live SAT Prep flows
 * (Dashboard / Practice / Test Packs / Mock Tests / Library / Runner).
 *
 * SuperAdmin and Owner always pass. Everyone else is gated by
 * SAT_PREP_SHOW_ALL.
 */
export function canUseSatPrep(
  managementRole: string | null | undefined,
): boolean {
  const role = managementRole ?? '';
  if (role === RoleEnum.SuperAdmin || role === RoleEnum.Owner) return true;
  return SAT_PREP_SHOW_ALL;
}
