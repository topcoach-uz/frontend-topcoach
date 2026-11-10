import { useGetMentorEssayReviewsQuery } from 'src/app/services/student-hub/essayReviewApi';
import { useGetSharedDocumentsQuery } from 'src/app/services/student-hub/documentManagementApi';
import { isAwaitingDocumentReview } from './documentReviewStatus';

/** Pending counts for the review queues. Same args as the lists, so RTK Query dedupes the requests. */
export function useReviewCounts(skip = false, studentUserId?: string) {
  const { data: essays = [] } = useGetMentorEssayReviewsQuery(undefined, { skip, pollingInterval: 10000 });
  const { data: docs } = useGetSharedDocumentsQuery(undefined, { skip, pollingInterval: 10000 });
  const essayCount = essays.filter((r) => (!studentUserId || r.studentUserId === studentUserId) && (r.status === 'pending' || r.status === 'in_review')).length;
  const documentCount = (docs?.data ?? []).filter((d) => (!studentUserId || d.uploadedBy === studentUserId) && isAwaitingDocumentReview(d.reviewStatus)).length;
  return { essayCount, documentCount, total: essayCount + documentCount };
}
