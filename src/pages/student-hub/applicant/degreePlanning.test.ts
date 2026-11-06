import { describe, expect, it } from 'vitest';
import { applicationPlanHref, requirementsFromDegreePlan, qualificationOptions } from './degreePlanning';

describe('degree planning handoff', () => {
  const values = { universityId: 'university-1', undergraduateDegreeId: 'degree-1' };
  const href = '/student-hub/applications/new?university=university-1&undergraduateDegreeId=degree-1&degreeLevel=bachelor';
  const params = (url: string) => new URL(url, 'https://tracker.test').searchParams;
  it('carries only the explicitly checked steps into an editable tracker checklist', () => {
    const plan = requirementsFromDegreePlan(params(applicationPlanHref(href, ['qualifications', 'application'])), values);
    expect(plan?.custom.items.map(item => [item.id, item.completed])).toEqual([
      ['degree-plan-qualifications', true], ['degree-plan-tests', false], ['degree-plan-application', true],
    ]);
  });
  it('does not seed a checklist for the ordinary Save to College List action', () => {
    expect(requirementsFromDegreePlan(params(href), values)).toBeUndefined();
  });
  it('drops the plan when the user chooses another university or degree', () => {
    const p = params(applicationPlanHref(href, ['tests']));
    expect(requirementsFromDegreePlan(p, { ...values, universityId: 'other' })).toBeUndefined();
    expect(requirementsFromDegreePlan(p, { ...values, undergraduateDegreeId: 'other' })).toBeUndefined();
  });
  it('saves a study-area plan without fabricating a published degree id', () => {
    const url = applicationPlanHref('/student-hub/applications/new?university=university-1&major=Arts+%26+Sciences&degreeLevel=bachelor', ['tests']);
    const v = { universityId: 'university-1', major: 'Arts & Sciences' };
    expect(requirementsFromDegreePlan(params(url), v)?.custom.items[1].completed).toBe(true);
    expect(requirementsFromDegreePlan(params(url), { ...v, major: 'Other' })).toBeUndefined();
    expect(requirementsFromDegreePlan(params(url), { ...v, undergraduateDegreeId: 'unrelated' })).toBeUndefined();
  });
  it('ignores unrecognized completion tokens and never trusts titles from the URL', () => {
    const p = params(applicationPlanHref(href, [])); p.set('completedPlanSteps', 'anything,tests'); p.set('title', 'Untrusted');
    expect(requirementsFromDegreePlan(p, values)?.custom.items.map(item => item.completed)).toEqual([false, true, false]);
    expect(requirementsFromDegreePlan(p, values)?.custom.items.map(item => item.title)).not.toContain('Untrusted');
  });
});

describe('published qualification choices', () => {
  it('keeps a verified qualification first and offers alternate systems without invented grades', () => {
    expect(qualificationOptions({ qualificationLabel: 'A-levels', qualificationValue: 'A*AA' }).map(x => x.value)).toEqual(['A-levels', 'International Baccalaureate', 'Other qualifications']);
  });
  it('does not present a label without verified grades as a published requirement', () => {
    expect(qualificationOptions({ qualificationLabel: 'Local credential', qualificationValue: null }).map(x => x.value)).not.toContain('Local credential');
  });
});
