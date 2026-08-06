import type { CSSProperties } from 'react';

import { displayName } from 'src/utils/displayName';

/** Format an amount as UZS (Uzbekistan Som). Integer UZS, thousand-separated. */
export function formatUZS(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return 'UZS 0';
  const rounded = Math.round(n);
  return `UZS ${rounded.toLocaleString('en-US')}`;
}

/** Short form — for tight KPI cards — e.g. "UZS 8.4M". */
export function formatUZSShort(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return 'UZS 0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `UZS ${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `UZS ${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `UZS ${(n / 1_000).toFixed(1)}K`;
  return `UZS ${Math.round(n).toLocaleString('en-US')}`;
}

/**
 * Clean up legacy userName strings where the backend concatenated
 * firstName + ' ' + lastName and lastName was null/undefined, producing
 * values like "Sabina undefined" or "John null". Falls back to a given email.
 *
 * Thin wrapper over the app-wide `displayName` — kept because admin tables
 * want an em-dash placeholder rather than an empty cell.
 */
export function cleanUserName(name: string | null | undefined, fallbackEmail?: string | null): string {
  return displayName(name, fallbackEmail, '—');
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
}

const AVATAR_HUES = [142, 200, 280, 35, 210, 330];

export function avatarHueForId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h + id.charCodeAt(i) * (i + 1)) % 360;
  return AVATAR_HUES[h % AVATAR_HUES.length]!;
}

export function avatarStyleForId(id: string): CSSProperties {
  const hue = avatarHueForId(id);
  return {
    background: `linear-gradient(135deg, hsl(${hue}, 55%, 42%), hsl(${(hue + 40) % 360}, 50%, 32%))`,
    color: '#fff',
  };
}
