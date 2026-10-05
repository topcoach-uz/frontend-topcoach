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
  it('distinguishes date-based phases using their activities while preserving dates', () => {
    const phases = [
      ['Grade 10–11', ['Maintain a stable GPA', 'Advance independent research', 'Prepare for science competitions'], 'prepare'],
      ['Summer Grade 11', ['Narrow down university list', 'Draft personal statements'], 'build'],
      ['Grade 12 (Fall)', ['Submit applications', 'Verify financial aid documents'], 'apply'],
      ['Spring 2027', ['Interview if invited', 'Finalize enrollment and visa arrangements'], 'enroll'],
    ] as const;
    phases.forEach(([when, actions, kind]) => expect(journeyStage(when, [...actions])).toEqual({ kind, label: when }));
  });
  it('uses neutral decoration for missing activity evidence, not phase order', () => {
    expect(journeyStage('Phase 4', [])).toEqual({ kind: 'plan', label: 'Phase 4' });
    expect(journeyStage('2027', ['Discuss compensation'])).toEqual({ kind: 'plan', label: '2027' });
  });
});
