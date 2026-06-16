/**
 * Phase-1 launch gate — single source of truth on the frontend for who
 * may see the Community Feed entry point while we're still smoke-testing
 * in production.
 *
 * MUST be kept in lock-step with the backend allowlist at
 *   src/modules/community-feed/guards/community-enrollment.guard.ts
 *     → PHASE_1_EMAIL_ALLOWLIST
 *
 * If the frontend allows an email the backend doesn't, the user sees the
 * Feed nav item then gets a 403 when they click it. If the backend allows
 * one the frontend doesn't, the user can hit the API directly but the UI
 * still hides Feed from the sidebar — they "can't find the page". Both
 * sides need to match exactly.
 *
 * To widen access, add the email here AND on the backend, then ship both.
 * To open the gate to everyone, flip the frontend by removing this gate's
 * call-sites and flip the backend's PHASE_1_SUPERADMIN_ONLY flag.
 *
 * Search the codebase for "Phase-1 launch gate" to find every gate in
 * one sweep.
 */
export const PHASE_1_EMAIL_ALLOWLIST: ReadonlySet<string> = new Set([
  'support@topcoach.uz',
  'dinararuzimuratova@gmail.com',
  'adhamjanovbahmanyor@gmail.com',
  'jamolovamadinabonu02@gmail.com',
  'shahriyoraliboyev23@gmail.com',
  'orifovaa20@gmail.com',
  'orzu@topcoach.uz',
]);

/**
 * Returns true if the current profile may see the Feed page right now.
 * Safe to call with `undefined` (returns false). Lowercases the email
 * before comparison — the allowlist is canonicalised lowercase.
 */
export const isFeedPhase1Allowed = (profile: {
  managementRole?: string | null;
  email?: string | null;
} | null | undefined): boolean => {
  if (!profile) return false;
  if (profile.managementRole === 'SuperAdmin') return true;
  const email = profile.email?.toLowerCase();
  return !!email && PHASE_1_EMAIL_ALLOWLIST.has(email);
};
