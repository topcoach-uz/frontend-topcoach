import type { UndergraduateDegree } from 'src/app/services/undergraduateDegreesApi';

export const planningSteps = [
  { id: 'qualifications', title: 'Check my qualifications' },
  { id: 'tests', title: 'Review test registration dates' },
  { id: 'application', title: 'Prepare my application' },
] as const;
export type PlanningStepId = typeof planningSteps[number]['id'];

type QualificationDegree = Pick<UndergraduateDegree, 'qualificationLabel' | 'qualificationValue'> & Partial<Pick<UndergraduateDegree, 'qualificationNote' | 'qualificationRequirements'>>;

export function publishedQualifications(degree: QualificationDegree) {
  const verified = (degree.qualificationRequirements ?? []).filter(row => row.label?.trim() && row.value?.trim() && row.sourceUrl && row.verifiedAt);
  if (verified.length) return verified;
  const label = degree.qualificationLabel?.trim();
  return label && degree.qualificationValue ? [{ label, value: degree.qualificationValue, note: degree.qualificationNote, scope: '', sourceTitle: '', sourceUrl: '', verifiedAt: '' }] : [];
}

export function qualificationOptions(degree: QualificationDegree) {
  const names = [...publishedQualifications(degree).map(row => row.label), 'A-levels', 'International Baccalaureate', 'Other qualifications'];
  return names.filter((name, index) => names.findIndex(other => other.toLowerCase() === name.toLowerCase()) === index).map(label => ({ value: label, label }));
}

export function selectedQualification(degree: QualificationDegree, label: string) {
  return publishedQualifications(degree).find(row => row.label === label);
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

export function publishedDegreeForStudyArea(degrees: UndergraduateDegree[], name: string) {
  const normalized = (value: string) => value.trim().normalize('NFKC').replace(/\s+/g, ' ').toLocaleLowerCase('en');
  const matches = degrees.filter(degree => normalized(degree.name) === normalized(name));
  return matches.length === 1 ? matches[0] : undefined;
}
