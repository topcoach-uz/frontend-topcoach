import type { VerifiedProgramLink } from 'src/app/services/universities';

export type Major = { id: string; type?: string; name?: unknown };
export type Field = { value: string; label: string };
export const normalizeStudyArea = (value: string) => value.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
export const majorName = (name: unknown): string => typeof name === 'string' ? name : (name && typeof name === 'object' && 'en' in name && typeof name.en === 'string' ? name.en : '');
export function verifiedStudyAreaUrl(field: string, majors: readonly Major[], links: readonly VerifiedProgramLink[]): string | undefined {
  const ids = new Set(majors.filter(major => major.type === 'undergraduate' && normalizeStudyArea(majorName(major.name)) === normalizeStudyArea(field)).map(major => major.id));
  for (const link of links) {
    if (link.degreeLevel !== 'undergraduate' || !ids.has(link.majorId)) continue;
    try { const url = new URL(link.url); if (url.protocol === 'https:' && !url.username && !url.password) return link.url; } catch { /* Leave malformed sources unavailable. */ }
  }
  return undefined;
}
