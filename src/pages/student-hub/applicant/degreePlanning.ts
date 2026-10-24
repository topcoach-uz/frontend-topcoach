import type { UndergraduateDegree } from 'src/app/services/undergraduateDegreesApi';

export const planningSteps = [
  { id: 'qualifications', title: 'Check my qualifications' },
  { id: 'tests', title: 'Review test registration dates' },
  { id: 'application', title: 'Prepare my application' },
] as const;
export type PlanningStepId = typeof planningSteps[number]['id'];

export function qualificationOptions(degree: Pick<UndergraduateDegree, 'qualificationLabel' | 'qualificationValue'>) {
  const label = degree.qualificationLabel?.trim();
  const published = label && degree.qualificationValue ? [{ value: label, label }] : [];
  const names = ['A-levels', 'International Baccalaureate', 'Other qualifications'];
  return [...published, ...names.filter(name => !published.some(p => p.value.toLowerCase() === name.toLowerCase())).map(name => ({ value: name, label: name }))];
}

export function applicationPlanHref(baseHref: string, completed: readonly PlanningStepId[]) {
  const url = new URL(baseHref, 'https://tracker.local');
  url.searchParams.set('degreePlan', '1');
  url.searchParams.set('completedPlanSteps', planningSteps.filter(step => completed.includes(step.id)).map(step => step.id).join(','));
  return url.pathname + url.search;
}

// Only explicit degree-page handoffs seed a new application. Never overwrite an
// existing checklist or carry a plan to another university/degree after edits.
export function requirementsFromDegreePlan(params: URLSearchParams, values: { universityId?: string | null; undergraduateDegreeId?: string | null; major?: string | null }) {
  if (params.get('degreePlan') !== '1' || !values.universityId || values.universityId !== params.get('university')) return undefined;
  const degreeId = params.get('undergraduateDegreeId');
  if (degreeId ? values.undergraduateDegreeId !== degreeId : values.undergraduateDegreeId || values.major !== params.get('major')) return undefined;
  const done = new Set((params.get('completedPlanSteps') ?? '').split(','));
  return { custom: { items: planningSteps.map(step => ({ id: `degree-plan-${step.id}`, title: step.title, completed: done.has(step.id) })) } };
}
