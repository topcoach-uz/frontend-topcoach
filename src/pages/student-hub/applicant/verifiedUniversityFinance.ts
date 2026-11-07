import type { UndergraduateDegree } from 'src/app/services/undergraduateDegreesApi';

export interface VerifiedUniversityFinance {
  universityId: string;
  schemaVersion: 1;
  reviewStatus: 'approved';
  verifiedAt: string;
  scope: string;
  content: {
    feesSummary: string;
    feesUrl: string;
    fundingSummary: string;
    fundingPolicyNote?: string;
    fundingPolicyUrl: string;
  };
}

function httpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}

export function verifiedUniversityFinance(universityId: string, record?: VerifiedUniversityFinance | null): VerifiedUniversityFinance | undefined {
  if (!record || record.universityId !== universityId || record.schemaVersion !== 1 || record.reviewStatus !== 'approved'
    || typeof record.scope !== 'string' || !record.scope.trim()
    || typeof record.verifiedAt !== 'string' || !Number.isFinite(Date.parse(record.verifiedAt))) return;
  const content = record.content;
  if (!content || typeof content.feesSummary !== 'string' || !content.feesSummary.trim()
    || typeof content.fundingSummary !== 'string' || !content.fundingSummary.trim()
    || (content.fundingPolicyNote !== undefined && typeof content.fundingPolicyNote !== 'string')
    || !httpsUrl(content.feesUrl) || !httpsUrl(content.fundingPolicyUrl)) return;
  return record;
}

/** University guidance fills missing finance sections. A programme's own
 * sourced summary and its corresponding link remain together. */
export function withVerifiedUniversityFinance(degree: UndergraduateDegree, record?: VerifiedUniversityFinance | null): UndergraduateDegree {
  const finance = verifiedUniversityFinance(degree.universityId, record);
  if (!finance) return degree;
  return {
    ...degree,
    ...(!degree.feesSummary?.trim() ? { feesSummary: 'University guidance: ' + finance.content.feesSummary, feesUrl: finance.content.feesUrl } : {}),
    ...(!degree.fundingSummary?.trim() ? {
      fundingSummary: 'University guidance: ' + finance.content.fundingSummary,
      fundingPolicyNote: finance.content.fundingPolicyNote ?? null,
      fundingPolicyUrl: finance.content.fundingPolicyUrl,
    } : {}),
  };
}
