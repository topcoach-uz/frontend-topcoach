/* ── Person-name display helpers ──────────────────────────────────────────────
   One rule: the literal strings "undefined" and "null" never reach a screen.

   They used to. Google sign-up stored the profile name as
   `${firstName} ${lastName}`, and Google often returns a given name with no
   family name — so accounts exist named "Asila undefined", and every greeting
   repeated it back ("Hi, Asila undefined."). The backend write path is fixed
   and a migration scrubs the stored rows, but names also arrive from older
   payloads, cached Redux state, and third-party imports, so display code keeps
   its own guard. */

/** A stringified `undefined`/`null` left inside a name string. */
const PLACEHOLDER_TOKENS = /\b(undefined|null|NaN)\b/g;

/**
 * Strip placeholder tokens and collapse the whitespace they leave behind.
 * Returns '' when nothing usable remains — callers decide the fallback.
 */
export function sanitizeName(name: unknown): string {
  if (name == null) return '';
  return String(name)
    .replace(PLACEHOLDER_TOKENS, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * The name to show for a person, given whatever the API returned. Tries the
 * name, then the email's local part, then `fallback`.
 *
 * @example displayName('Asila undefined')            // 'Asila'
 * @example displayName('undefined', 'a.k@gmail.com') // 'a.k'
 * @example displayName(null, null, 'there')          // 'there'
 */
export function displayName(
  name: unknown,
  email?: string | null,
  fallback = '',
): string {
  const cleaned = sanitizeName(name);
  if (cleaned) return cleaned;
  const local = (email ?? '').split('@')[0]?.trim() ?? '';
  if (local) return local;
  return fallback;
}

/**
 * Join name parts that may individually be missing — the safe replacement for
 * `${firstName} ${lastName}`.
 */
export function joinNameParts(
  ...parts: (string | null | undefined)[]
): string {
  return sanitizeName(parts.filter(Boolean).join(' '));
}
