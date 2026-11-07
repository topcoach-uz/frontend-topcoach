/** A shared document still needs the mentor's attention (no decision yet). */
export function isAwaitingDocumentReview(reviewStatus?: string): boolean {
  return !reviewStatus || reviewStatus === 'pending' || reviewStatus === 'in_progress';
}
