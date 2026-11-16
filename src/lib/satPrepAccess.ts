import { useEffect, useState } from 'react';
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
 * Internal-tester allow-list. Entries are SHA-256 hex digests of the
 * lowercased, trimmed email, so no addresses ship in the client bundle.
 * These accounts bypass the kill-switch even though their `managementRole`
 * is `User`, so we can run real-world QA before the public launch.
 *
 * To add one: sha256 of the lowercased, trimmed email, as hex. Keep the
 * list small — every entry effectively pre-launches the product.
 */
export const SAT_PREP_INTERNAL_TESTER_HASHES: ReadonlySet<string> = new Set([
  'd2ae429ebdc5be13584a0fed774fa4b5b209c366a15a7506d63cf98b7e00c123',
  'bb3ddecbf7977de2f4729b37304fae11e174434e1b08a9324db5626bc8a2ab4e',
  'ecd5572f40b3e3cdb2a156180bb046d8ea3258b82ec767991cfddde5a69bc870',
  'c0e6f9f90a69ae78a4114b087c9159e5a7d2c6f8d595786b7eb5564c8fff8c68',
  '9ef1f7442e912f87f7aac27e117e9a21c9d01f122fbbb3ee79b2870a70af4a3d',
]);

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Synchronous part of the check: roles and the global switch. */
export function canUseSatPrepByRole(managementRole: string | null | undefined): boolean {
  const role = managementRole ?? '';
  if (role === RoleEnum.SuperAdmin || role === RoleEnum.Owner) return true;
  return SAT_PREP_SHOW_ALL;
}

export async function isSatPrepTester(email?: string | null): Promise<boolean> {
  const normalized = (email ?? '').trim().toLowerCase();
  if (!normalized || !globalThis.crypto?.subtle) return false;
  try {
    return SAT_PREP_INTERNAL_TESTER_HASHES.has(await sha256Hex(normalized));
  } catch {
    return false;
  }
}

/**
 * Whether the current user should see the live SAT Prep flows
 * (Dashboard / Practice / Test Packs / Mock Tests / Library / Runner).
 *
 * Order of precedence:
 *   1) SuperAdmin / Owner always pass.
 *   2) `SAT_PREP_SHOW_ALL` is on → pass.
 *   3) Email hash is in the tester list → pass (resolved async; false until then).
 */
export function useCanUseSatPrep(
  managementRole: string | null | undefined,
  email?: string | null,
): boolean {
  const byRole = canUseSatPrepByRole(managementRole);
  const [tester, setTester] = useState(false);
  useEffect(() => {
    if (byRole) return;
    let cancelled = false;
    setTester(false);
    void isSatPrepTester(email).then((ok) => {
      if (!cancelled) setTester(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [byRole, email]);
  return byRole || tester;
}
