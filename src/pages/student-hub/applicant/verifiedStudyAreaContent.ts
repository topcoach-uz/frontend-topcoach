import type { UndergraduateDegree, QualificationRequirement } from 'src/app/services/undergraduateDegreesApi';

export type StudyAreaContentFields = Partial<Pick<UndergraduateDegree,
  'degreeType' | 'description' | 'curriculumSummary' | 'firstYearSubjects' | 'entrySummary' |
  'durationYears' | 'studyMode' | 'courseCode' | 'qualificationRequirements' |
  'admissionsTest' | 'admissionsTestNote' | 'applicationSummary' | 'deadlineAt' | 'deadlineNote' |
  'feesSummary' | 'fundingSummary' | 'fundingPolicyNote' | 'officialDegreeUrl' | 'curriculumUrl' |
  'requirementsUrl' | 'applicationUrl' | 'feesUrl' | 'fundingPolicyUrl' | 'sourceTitle' | 'sourceUrl'
>>;

export interface VerifiedStudyAreaContent {
  universityId: string;
  majorId?: string;
  majorIds?: string[];
  schemaVersion: 1;
  reviewStatus: 'approved';
  verifiedAt: string;
  content: StudyAreaContentFields;
}

const textFields = ['degreeType', 'description', 'curriculumSummary', 'firstYearSubjects', 'entrySummary',
  'studyMode', 'courseCode', 'admissionsTest', 'admissionsTestNote', 'applicationSummary', 'deadlineNote',
  'feesSummary', 'fundingSummary', 'fundingPolicyNote', 'sourceTitle'] as const;
const urlFields = ['officialDegreeUrl', 'curriculumUrl', 'requirementsUrl', 'applicationUrl', 'feesUrl',
  'fundingPolicyUrl', 'sourceUrl'] as const;
const httpsUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
};
const validDate = (value: unknown): value is string => typeof value === 'string' && Boolean(value.trim()) && Number.isFinite(Date.parse(value));
const qualification = (row: QualificationRequirement): boolean => Boolean(row && ['label', 'value', 'scope', 'sourceTitle'].every(key => typeof row[key as keyof QualificationRequirement] === 'string' && String(row[key as keyof QualificationRequirement]).trim()) && httpsUrl(row.sourceUrl) && validDate(row.verifiedAt));

/** Curated study-area facts fill this page without turning it into a new degree
 * or changing the selected university, major, save route or matching eligibility. */
export function withVerifiedStudyAreaContent(base: UndergraduateDegree, rows: readonly VerifiedStudyAreaContent[] = []): UndergraduateDegree {
  const record = rows.find(row => row && row.universityId === base.universityId && (row.majorId === base.id || Array.isArray(row.majorIds) && row.majorIds.includes(base.id))
    && row.schemaVersion === 1 && row.reviewStatus === 'approved' && validDate(row.verifiedAt));
  if (!record?.content) return base;
  const content = record.content;
  const result = { ...base };
  for (const key of textFields) if (typeof content[key] === 'string' && content[key]!.trim()) result[key] = content[key]!;
  for (const key of urlFields) if (httpsUrl(content[key])) result[key] = content[key]!;
  if (typeof content.durationYears === 'number' && content.durationYears > 0 && content.durationYears <= 12) result.durationYears = content.durationYears;
  if (validDate(content.deadlineAt)) result.deadlineAt = content.deadlineAt;
  if (Array.isArray(content.qualificationRequirements)) result.qualificationRequirements = content.qualificationRequirements.filter(qualification);
  result.verifiedAt = record.verifiedAt;
  return result;
}
