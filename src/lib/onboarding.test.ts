import { describe, expect, it } from 'vitest';
import { usesJuniorCommunity } from './onboarding';

describe('junior community routing', () => {
  it.each([7, 8, '7', '8'])('routes saved grade %s to community', (gradeLevel) => {
    expect(usesJuniorCommunity({ gradeLevel })).toBe(true);
    expect(usesJuniorCommunity({ gradeLevel, targetDegree: 'bachelor' })).toBe(true);
  });

  it.each([undefined, null, '', 9, '9', 10, 11, 12, 'gap-year', 'graduated'])('keeps admissions onboarding for %s', (gradeLevel) => {
    expect(usesJuniorCommunity({ gradeLevel })).toBe(false);
  });

  it('keeps the master path even if an old school grade remains', () => {
    expect(usesJuniorCommunity({ gradeLevel: 8, targetDegree: 'master' })).toBe(false);
  });
});
