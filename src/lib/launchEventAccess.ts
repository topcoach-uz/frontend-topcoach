import { useGetMeQuery } from 'src/app/services/users';

/**
 * Master kill-switch for the Top Coach Launch Event UI.
 *
 *   false → hidden from every public surface. Only SuperAdmin / Owner
 *           accounts can see the card, the dedicated page, and the
 *           promo on My Progress (so the team can preview + QA in prod
 *           before flipping the flag).
 *   true  → visible to everyone (production launch).
 *
 * To launch publicly: flip this to `true`, redeploy. No other code
 * needs to change.
 */
export const LAUNCH_EVENT_PUBLIC = true;

/**
 * Hook: should the current user see the Launch Event UI?
 * Always true when the flag is on. Otherwise only SuperAdmin / Owner.
 */
export function useLaunchEventVisible(): boolean {
  const { data: me } = useGetMeQuery(undefined);
  if (LAUNCH_EVENT_PUBLIC) return true;
  const role = (me as { managementRole?: string } | undefined)?.managementRole;
  return role === 'SuperAdmin' || role === 'Owner';
}
