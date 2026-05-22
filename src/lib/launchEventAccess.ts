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
 * Two distinct auto-hide deadlines for the launch event.
 *
 *   - DETAILS_HIDE_AT: the full event page + the featured card on
 *     `/events`. We stop accepting registrations the day BEFORE the
 *     event itself so latecomers don't show up unprepared. Tashkent
 *     time, noon.
 *   - PROMO_HIDE_AT: the small dashboard "Top Coach presents" promo
 *     stays one extra day so registered users keep their reminder
 *     up to the event itself, then it auto-clears at noon on the
 *     event day.
 *
 * Both are evaluated against `Date.now()` — once the cutoff passes,
 * the corresponding hook returns `false` for everyone, including
 * SuperAdmin. (If we ever need to keep admin previews alive
 * post-cutoff, add a query param or env override here.)
 */
export const LAUNCH_EVENT_DETAILS_HIDE_AT_ISO =
  '2026-05-23T12:00:00+05:00';
export const LAUNCH_EVENT_PROMO_HIDE_AT_ISO =
  '2026-05-24T12:00:00+05:00';

/**
 * Hook: should the current user see the Launch Event UI at all?
 * Combines: master flag → role check (if flag off) → past-cutoff
 * check. Used to gate the events-list card + the dedicated page.
 */
export function useLaunchEventVisible(): boolean {
  const { data: me } = useGetMeQuery(undefined);
  if (isPastCutoff(LAUNCH_EVENT_DETAILS_HIDE_AT_ISO)) return false;
  if (LAUNCH_EVENT_PUBLIC) return true;
  const role = (me as { managementRole?: string } | undefined)?.managementRole;
  return role === 'SuperAdmin' || role === 'Owner';
}

/**
 * Hook: should the dashboard "Top Coach presents" promo card render?
 * Same as `useLaunchEventVisible` but uses the later cutoff so the
 * reminder stays up for one extra day for already-registered users.
 */
export function useLaunchEventPromoVisible(): boolean {
  const { data: me } = useGetMeQuery(undefined);
  if (isPastCutoff(LAUNCH_EVENT_PROMO_HIDE_AT_ISO)) return false;
  if (LAUNCH_EVENT_PUBLIC) return true;
  const role = (me as { managementRole?: string } | undefined)?.managementRole;
  return role === 'SuperAdmin' || role === 'Owner';
}

function isPastCutoff(iso: string): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() > t;
}
