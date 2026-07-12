/**
 * Master switch for the ISC 2026 admissions feature on the frontend.
 *
 * false → every entry point and route is hidden: the Events-page card, the
 * My-Progress promo, the reviewer sidebar links, the admin "Open ISC 2026
 * admin" card, and the /events/international-summer-camp-2026, /isc-2026,
 * /isc-2026/review and /new-admin/events/isc-2026 routes all disappear.
 *
 * The backend has a mirror flag (src/modules/isc-admissions/isc-admissions.flags.ts)
 * that 404s the API. To launch, flip BOTH to true.
 */
export const ISC_2026_ENABLED = true;

/**
 * Whether the application window is currently shut, derived from the public
 * `GET /isc-admissions/config` payload. The backend is authoritative — it
 * rejects out-of-window submissions with a 403 — but the FE cards/landing must
 * check this too, otherwise a returning applicant with a saved draft still sees
 * "Resume application / Applications open" after the deadline has passed.
 *
 * Closed when the manual kill switch is off OR the current time is past
 * `closeAt`. A null/absent config is treated as open (fail-soft: the backend
 * still gates the actual submit).
 */
export function isIscWindowClosed(config?: {
  applicationsOpen?: boolean;
  closeAt?: string | null;
} | null): boolean {
  if (!config) return false;
  if (config.applicationsOpen === false) return true;
  if (config.closeAt) {
    const closeAt = new Date(config.closeAt).getTime();
    if (!Number.isNaN(closeAt) && Date.now() > closeAt) return true;
  }
  return false;
}
