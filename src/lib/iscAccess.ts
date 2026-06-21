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
