/**
 * Deterministic avatar fallback color picker.
 *
 * Returns one color from a curated palette based on a stable hash of
 * the user's name (or email). Same input → same color, so each peer
 * keeps a consistent avatar tint across the app rather than flashing
 * a different color on every render.
 *
 * The palette is chosen to read cleanly against the cream editorial
 * background — saturated enough to identify, restrained enough to
 * avoid clashing with the brand red.
 */

const AVATAR_PALETTE = [
  '#7B1F2F', // brand red
  '#1f2937', // charcoal
  '#0f766e', // teal
  '#7c3aed', // purple
  '#b45309', // amber
  '#15803d', // forest
  '#1e40af', // indigo
  '#be185d', // rose
  '#0e7490', // cyan
  '#a16207', // ochre
] as const;

export function avatarColorForName(name: string | null | undefined): string {
  const key = (name ?? '').trim() || 'unknown';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // force int32
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

/** Initial(s) shown inside the colored fallback circle. */
export function avatarInitials(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return 'U';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase();
}
