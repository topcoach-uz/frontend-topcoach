import { RoleEnum } from 'src/app/api/Api';

/**
 * Master kill-switch for SAT Prep visibility while the product is in
 * internal preview.
 *
 *   false → only SuperAdmin / Owner + the internal-tester whitelist see
 *           the live SAT Prep flows; everyone else lands on the
 *           "Coming soon" placeholder.
 *   true  → SAT Prep is available to all enrolled users.
 *
 * Flip this to `true` when we're ready to open the gate to all students.
 */
export const SAT_PREP_SHOW_ALL = false;

/**
 * Internal-tester email whitelist. These accounts bypass the kill-switch
 * even though their `managementRole` is `User`, so we can run real-world
 * QA on the SAT Prep flows before the public launch. Compared case-
 * insensitively against the user's email.
 *
 * Add / remove entries here (no other files touched). Always keep the
 * list small — every entry effectively pre-launches the product for
 * that account.
 */
export const SAT_PREP_INTERNAL_TESTERS: ReadonlySet<string> = new Set([
  'shahriyoraliboyev23@gmail.com',
  'adhamjanovbahmanyor@gmail.com',
  'dinararuzimuratova@gmail.com',
  'jamolovamadinabonu02@gmail.com',
  'orzu@topcoach.uz'
]);

/**
 * Returns true when the current user should see the live SAT Prep flows
 * (Dashboard / Practice / Test Packs / Mock Tests / Library / Runner).
 *
 * Order of precedence:
 *   1) SuperAdmin / Owner always pass.
 *   2) Email is in `SAT_PREP_INTERNAL_TESTERS` → pass (internal QA).
 *   3) Otherwise gated by `SAT_PREP_SHOW_ALL`.
 */
export function canUseSatPrep(
  managementRole: string | null | undefined,
  email?: string | null,
): boolean {
  const role = managementRole ?? '';
  if (role === RoleEnum.SuperAdmin || role === RoleEnum.Owner) return true;
  const normalized = (email ?? '').trim().toLowerCase();
  if (normalized && SAT_PREP_INTERNAL_TESTERS.has(normalized)) return true;
  return SAT_PREP_SHOW_ALL;
}
