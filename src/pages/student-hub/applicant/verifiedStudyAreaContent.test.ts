import { describe, expect, it } from 'vitest';
import { withVerifiedStudyAreaContent, type VerifiedStudyAreaContent } from './verifiedStudyAreaContent';
import type { UndergraduateDegree } from 'src/app/services/undergraduateDegreesApi';
const base = { id: 'major-1', universityId: 'university-1', slug: 'major-1', name: 'Selected study area', degreeType: 'Undergraduate study area', curriculumSummary: null, entrySummary: null, officialDegreeUrl: 'https://university.edu/programme', sourceUrl: 'https://university.edu/programme', verifiedAt: '', fieldAliases: ['Selected study area'] } as UndergraduateDegree;
const row: VerifiedStudyAreaContent = { universityId: base.universityId, majorId: base.id, schemaVersion: 1, reviewStatus: 'approved', verifiedAt: '2026-10-30T00:00:00Z', content: { curriculumSummary: 'Verified project and laboratory coursework.', entrySummary: 'Requires prior undergraduate enrolment; this is a minor.', degreeType: 'Minor within a bachelor programme', curriculumUrl: 'https://university.edu/curriculum', qualificationRequirements: [{ label: 'International Baccalaureate', value: 'Published accepted qualification', scope: 'University-wide undergraduate guidance; not a course-specific offer.', sourceTitle: 'Official admissions', sourceUrl: 'https://university.edu/admissions', verifiedAt: '2026-10-30T00:00:00Z' }] } };
describe('verified study-area content', () => {
  it('shows sourced curriculum and entry scope while preserving selected identity and minor status', () => {
    const result = withVerifiedStudyAreaContent(base, [row]);
    expect(result.curriculumSummary).toBe(row.content.curriculumSummary);
    expect(result.entrySummary).toContain('minor');
    expect(result.degreeType).toBe('Minor within a bachelor programme');
    expect(result.id).toBe(base.id);expect(result.universityId).toBe(base.universityId);expect(result.name).toBe(base.name);expect(result.fieldAliases).toEqual(base.fieldAliases);
    expect(result.qualificationRequirements?.[0].scope).toContain('not a course-specific offer');
  });
  it.each([{ ...row, universityId: 'another-university' }, { ...row, majorId: 'another-major' }, { ...row, reviewStatus: 'draft' as 'approved' }, { ...row, verifiedAt: 'invalid-date' }])('withholds unmatched, unapproved or undated content', candidate => {
    expect(withVerifiedStudyAreaContent(base, [candidate])).toBe(base);
  });
  it('does not let source payloads replace identity or inject unsafe links and unscoped offers', () => {
    const malicious = { ...row, content: { ...row.content, id: 'other-major', name: 'Invented degree', universityId: 'other-university', curriculumUrl: 'javascript:alert(1)', qualificationRequirements: [{ label: 'A-levels', value: 'AAA', scope: '', sourceTitle: 'Unknown', sourceUrl: 'https://university.edu/requirements', verifiedAt: row.verifiedAt }] } };
    const result = withVerifiedStudyAreaContent(base, [malicious]);expect(result.id).toBe(base.id);expect(result.name).toBe(base.name);expect(result.universityId).toBe(base.universityId);expect(result.curriculumUrl).toBe(base.curriculumUrl);expect(result.qualificationRequirements).toEqual([]);
  });
  it('shares a verified parent-course summary only across its explicit major IDs', () => {
    expect(withVerifiedStudyAreaContent(base, [{ ...row, majorId: undefined, majorIds: [base.id, 'other-alias'] }]).curriculumSummary).toBe(row.content.curriculumSummary);
    expect(withVerifiedStudyAreaContent(base, [{ ...row, majorId: undefined, majorIds: ['unrelated-major'] }])).toBe(base);
  });
  it('keeps the link-only fallback when no approved content exists', () => expect(withVerifiedStudyAreaContent(base)).toBe(base));
});
