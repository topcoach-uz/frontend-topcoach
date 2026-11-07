import { describe, expect, it } from 'vitest';
import type { UndergraduateDegree } from 'src/app/services/undergraduateDegreesApi';
import { verifiedUniversityFinance, withVerifiedUniversityFinance, type VerifiedUniversityFinance } from './verifiedUniversityFinance';

const degree = { id: 'major-a', universityId: 'uni-a', name: 'Computer Science', feesSummary: null, feesUrl: 'https://example.edu/old-link', fundingSummary: null } as UndergraduateDegree;
const record: VerifiedUniversityFinance = {
  universityId: 'uni-a', schemaVersion: 1, reviewStatus: 'approved', verifiedAt: '2026-10-30T18:00:00Z',
  scope: 'International undergraduate university guidance; campus and programme exceptions apply.',
  content: { feesSummary: '2026–27 tuition differs by faculty; living costs are additional.', feesUrl: 'https://example.edu/fees', fundingSummary: 'International undergraduate applicants may apply for the named merit awards; selection is competitive.', fundingPolicyUrl: 'https://example.edu/aid' },
};

describe('university finance guidance', () => {
  it('fills a link-only section with the brief and its matching source without changing programme identity', () => {
    const result = withVerifiedUniversityFinance(degree, record);
    expect(result.feesSummary).toBe('University guidance: ' + record.content.feesSummary);
    expect(result.feesUrl).toBe(record.content.feesUrl);
    expect(result.id).toBe(degree.id); expect(result.name).toBe(degree.name);
  });
  it('preserves programme-specific tuition and funding with their original source links', () => {
    const specific = { ...degree, feesSummary: 'This programme has a different tuition schedule.', feesUrl: 'https://example.edu/course-fees', fundingSummary: 'Programme-specific award eligibility.', fundingPolicyUrl: 'https://example.edu/course-award' };
    expect(withVerifiedUniversityFinance(specific, record)).toEqual(specific);
  });
  it.each([
    { ...record, universityId: 'uni-b' },
    { ...record, reviewStatus: 'draft' as 'approved' },
    { ...record, scope: '' },
    { ...record, scope: 42 as unknown as string },
    { ...record, content: { ...record.content, feesSummary: 42 as unknown as string } },
    { ...record, verifiedAt: 'unverified' },
    { ...record, content: { ...record.content, feesUrl: 'javascript:alert(1)' } },
    { ...record, content: { ...record.content, fundingSummary: '' } },
  ])('withholds unapproved, mismatched, unsafe or incomplete records', candidate => {
    expect(verifiedUniversityFinance('uni-a', candidate)).toBeUndefined();
    expect(withVerifiedUniversityFinance(degree, candidate)).toBe(degree);
  });
});
