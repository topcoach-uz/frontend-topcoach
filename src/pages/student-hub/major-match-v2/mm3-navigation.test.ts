import { describe, expect, it } from 'vitest';
import { clampMm3Index, readMm3Location, writeMm3Location } from './mm3-navigation';

describe('Major Match URL navigation', () => {
  it('clamps question links to the 30-question range', () => {
    expect(clampMm3Index(-4)).toBe(0);
    expect(clampMm3Index(500)).toBe(29);
    expect(readMm3Location(new URLSearchParams('step=questions&question=31')).currentIndex).toBe(29);
  });

  it('preserves workspace parameters while writing an editable question link', () => {
    const next = writeMm3Location(new URLSearchParams('section=ai-major-match&campaign=fall'), 'questions', 13, 2);
    expect(next.toString()).toContain('section=ai-major-match');
    expect(next.get('campaign')).toBe('fall');
    expect(next.get('question')).toBe('14');
    expect(next.get('editPart')).toBe('2');
  });

  it('drops question-only state on review and rejects invalid URL states', () => {
    const review = writeMm3Location(new URLSearchParams('question=8&editPart=1'), 'review');
    expect(review.get('question')).toBeNull();
    expect(review.get('editPart')).toBeNull();
    expect(readMm3Location(new URLSearchParams('step=made-up&editPart=9'), 7)).toEqual({
      step: 'intro', currentIndex: 7, editPart: undefined,
    });
  });
});
