import { describe, expect, it } from 'vitest';
import { validateProgramProgress } from './programProgress';

describe('program progress validation', () => {
  it('accepts cleared progress and valid boundary percentages', () => {
    expect(validateProgramProgress([])).toBeNull();
    expect(validateProgramProgress([{ key: 'Proposal', percent: 0 }, { key: 'Final paper', percent: 100, target: null }])).toBeNull();
  });
  it('prevents ambiguous trimmed keys from replacing program progress', () => {
    expect(validateProgramProgress([{ key: ' Paper ', percent: 10 }, { key: 'Paper', percent: 20 }])).toContain('unique');
    expect(validateProgramProgress([{ key: ' ', percent: 10 }])).toContain('name');
  });
  it('matches the server bounds before submitting a replacement', () => {
    for (const percent of [-1, 101, NaN, Infinity]) expect(validateProgramProgress([{ key: 'Paper', percent }])).toContain('percentages');
    expect(validateProgramProgress([{ key: 'p'.repeat(201), percent: 10 }])).toContain('200');
    expect(validateProgramProgress([{ key: 'Paper', percent: 10, target: 't'.repeat(1001) }])).toContain('1000');
    expect(validateProgramProgress(Array.from({ length: 101 }, (_, i) => ({ key: String(i), percent: 0 })))).toContain('100 progress');
  });
});
