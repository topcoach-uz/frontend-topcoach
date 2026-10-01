import { describe, expect, it } from 'vitest';
import { clearMm3Draft, loadMm3Draft, mm3DraftKey, saveMm3Draft } from './mm3-draft';
import { MM3_QUESTIONS_BY_SLUG } from './mm3-content';
import { isMM3Answered } from './components/MM3Inputs';
import { buildMm3Payload } from './mm3-payload';
import type { TFunction } from 'i18next';

const memoryStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    values,
  };
};

describe('Major Match draft persistence', () => {
  it('round-trips answers, review state and resume question', () => {
    const storage = memoryStorage();
    saveMm3Draft('profile-1', { answers: { grade: 2, countries: [0, 2] }, currentIndex: 21, step: 'review' }, storage);
    expect(loadMm3Draft('profile-1', storage)).toEqual({
      answers: { grade: 2, countries: [0, 2] }, currentIndex: 21, step: 'review',
    });
  });

  it('sanitizes stale slugs and out-of-range indexes', () => {
    const storage = memoryStorage();
    storage.setItem(mm3DraftKey('profile-1'), JSON.stringify({ answers: { grade: 1, removedQuestion: 9 }, currentIndex: 999 }));
    expect(loadMm3Draft('profile-1', storage)).toEqual({ answers: { grade: 1 }, currentIndex: 29, step: 'questions' });
  });

  it('fails safely for corrupt or unavailable storage', () => {
    const corrupt = { getItem: () => '{nope' };
    expect(loadMm3Draft('profile-1', corrupt)).toBeNull();
    const storage = memoryStorage();
    saveMm3Draft('profile-1', { answers: {}, currentIndex: 0, step: 'questions' }, storage);
    clearMm3Draft('profile-1', storage);
    expect(storage.values.has(mm3DraftKey('profile-1'))).toBe(false);
  });

  it('keeps a specified Other answer through resume and report submission', () => {
    const storage = memoryStorage();
    const grade = MM3_QUESTIONS_BY_SLUG.get('grade')!;
    const answer = { option: 6, other: 'Vocational college, final year' };
    expect(isMM3Answered(grade, { ...answer, other: '   ' })).toBe(false);
    expect(isMM3Answered(grade, answer)).toBe(true);

    saveMm3Draft('profile-1', { answers: { grade: answer }, currentIndex: 0, step: 'questions' }, storage);
    const resumed = loadMm3Draft('profile-1', storage)!;
    expect(resumed.answers.grade).toEqual(answer);

    const t = ((key: string) => key === 'majorMatch3.q.grade.opt.6' ? 'Other (please specify)' : key) as TFunction;
    expect(buildMm3Payload(resumed.answers, t).grade).toBe('Other (please specify): Vocational college, final year');
  });
});
