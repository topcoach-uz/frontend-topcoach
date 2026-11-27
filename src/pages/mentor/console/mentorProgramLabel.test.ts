import { describe, expect, it } from 'vitest';
import { mentorProgramLabel } from './mentorProgramLabel';
describe('Mentor student program labels', () => {
  it.each([['customized', 'Customized Program'], ['admissions', 'Admissions'], ['research', 'Research'], ['bootcamp', 'Essay Bootcamp']])('does not label %s as Full Support', (program, expected) => {
    expect(mentorProgramLabel({ programs: [{ program }] })).toBe(expected);
  });
  it('keeps multiple assignments and their roles', () => {
    expect(mentorProgramLabel({ programs: [{ program: 'customized', roles: ['individual'] }, { program: 'research', roles: ['research'] }] })).toBe('Customized Program · Individual / Research');
  });
  it('keeps legacy and platform mentee labels', () => {
    expect(mentorProgramLabel({})).toBe('Full Support');
    expect(mentorProgramLabel({}, false)).toBe('1:1 mentoring');
  });
  it('accepts older program keys without treating them as Full Support', () => {
    expect(mentorProgramLabel({ programs: ['admissions'] })).toBe('Admissions');
  });
});
