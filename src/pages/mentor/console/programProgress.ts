import type { ProgramProgressItem } from 'src/app/services/studentProgramsApi';

export function validateProgramProgress(items: ProgramProgressItem[]): string | null {
  if (items.length > 100) return 'Use up to 100 progress items';
  if (items.some(item => !item.key.trim() || item.key.trim().length > 200)) return 'Use a name of up to 200 characters for every progress item';
  if (new Set(items.map(item => item.key.trim())).size !== items.length) return 'Use a unique name for each progress item';
  if (items.some(item => !Number.isFinite(item.percent) || item.percent < 0 || item.percent > 100)) return 'Enter progress percentages from 0 to 100';
  if (items.some(item => item.target != null && item.target.length > 1000)) return 'Keep progress targets within 1000 characters';
  return null;
}
