import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { getMm3Questions, getMm3QuestionMap } from './mm3-content';
import { buildMm3Payload, buildMm3Prefill } from './mm3-payload';
import { isMM3Answered } from './components/MM3Inputs';

const t = ((key: string) => key) as TFunction;

describe('master’s applicant assessment', () => {
  it('replaces school questions while retaining all 30 stable question IDs', () => {
    const questions = getMm3Questions('master');
    expect(questions.map((q) => q.id)).toEqual(getMm3Questions('bachelor').map((q) => q.id));
    expect(questions.filter((q) => ['grade', 'curriculum', 'sat', 'olympiad'].includes(q.slug))).toEqual([]);
    expect(questions.map((q) => q.slug)).toEqual(expect.arrayContaining(['education', 'degreeBackground', 'graduateTests', 'experience']));
  });

  it('uses university education and GPA rather than stale school data to prefill', () => {
    const result = buildMm3Prefill({ academicProfile: {
      targetDegree: 'master', educationStatus: 'graduated', bachelorGraduationYear: 2024,
      previousInstitution: 'Example University', previousDegree: 'BSc', previousField: 'Physics',
      universityGpa: '8.7', universityGpaScale: '10', gpa: { unweighted: 2.5 },
      testScores: { sat: { total: 1500 } }, relevantExperience: 'Two years in a research lab',
    } }, t);
    expect(result.answers.sat).toBeUndefined();
    expect(result.answers.graduateGpa).toMatchObject({ value: '8.7', scale: '10' });
    expect(result.answers.degreeBackground).toMatchObject({ institution: 'Example University', degree: 'BSc', field: 'Physics' });
    expect(result.answers.education).toMatchObject({ year: '2024' });
  });

  it('does not serialize leftover undergraduate answers for the master’s engine', () => {
    const payload = buildMm3Payload({ grade: 0, sat: { satScore: '1500' }, degreeBackground: { degree: ' MSc ', field: 'Physics' } }, t, 'master');
    expect(payload.targetDegree).toBe('master');
    expect(payload.grade).toBeUndefined();
    expect(payload.sat).toBeUndefined();
    expect(payload.degreeBackground).toEqual({ degree: 'MSc', field: 'Physics' });
  });

  it('allows optional experience to be skipped but rejects blank required education', () => {
    const map = getMm3QuestionMap('master');
    expect(isMM3Answered(map.get(9)!, undefined)).toBe(true);
    expect(isMM3Answered(map.get(2)!, { institution: '  ', degree: 'BSc', field: 'Physics' })).toBe(false);
    expect(isMM3Answered(map.get(2)!, { institution: 'University', degree: 'BSc', field: 'Physics' })).toBe(true);
  });
});
