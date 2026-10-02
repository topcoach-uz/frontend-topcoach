import { describe, expect, it } from 'vitest';
import { journeyStage } from './journeyStage';

describe('journey stage labels', () => {
  it('uses the report wording rather than the phase position', () => {
    expect(journeyStage('Phase 2 · Test your interests').kind).toBe('try');
    expect(journeyStage('Phase 4 · Build your portfolio').kind).toBe('build');
  });
  it('preserves unrecognized and localized phase titles', () => {
    expect(journeyStage('September 2027')).toEqual({ kind: 'plan', label: 'September 2027' });
    expect(journeyStage('Исследуйте направления').label).toBe('Исследуйте направления');
  });
});
