export function initialsFromName(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name
    .replace(/\s+(undefined|null)\b/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

const AVATAR_PALETTE = [
  '#8b0000',
  '#a90000',
  '#b45309',
  '#15803d',
  '#1d4ed8',
  '#6d28d9',
  '#0f766e',
  '#be185d',
];

export function avatarStyleForId(id: string | null | undefined): {
  background: string;
} {
  const key = (id ?? '').toString();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % AVATAR_PALETTE.length;
  return { background: AVATAR_PALETTE[idx]! };
}

export function cleanName(
  name: string | null | undefined,
  fallbackEmail?: string | null,
): string {
  const cleaned = (name ?? '')
    .replace(/\s+(undefined|null)\b/gi, '')
    .replace(/\bundefined\b|\bnull\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (cleaned) return cleaned;
  const email = (fallbackEmail ?? '').trim();
  if (email && email.includes('@')) return email.split('@')[0] ?? email;
  return email || '—';
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const abs = Math.abs(diff);
    const mins = Math.floor(abs / 60000);
    const label = (v: number, unit: string) => `${v}${unit}`;
    if (mins < 1) return diff >= 0 ? 'just now' : 'in a moment';
    if (mins < 60)
      return diff >= 0 ? `${label(mins, 'm')} ago` : `in ${label(mins, 'm')}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)
      return diff >= 0 ? `${label(hrs, 'h')} ago` : `in ${label(hrs, 'h')}`;
    const days = Math.floor(hrs / 24);
    return diff >= 0 ? `${label(days, 'd')} ago` : `in ${label(days, 'd')}`;
  } catch {
    return iso;
  }
}
