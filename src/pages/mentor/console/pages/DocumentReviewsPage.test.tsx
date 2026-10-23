import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentReviewsPage from './DocumentReviewsPage';
const state = vi.hoisted(() => ({ queue: {} as any }));
vi.mock('src/app/services/student-hub/documentManagementApi', () => ({
  useGetSharedDocumentsQuery: () => state.queue,
  useGetDocumentReviewQuery: () => ({}),
  useSubmitMentorDocumentReviewMutation: () => [vi.fn(), {}],
  useDownloadDocumentMutation: () => [vi.fn()],
}));
beforeEach(() => { state.queue = { isLoading: false, isError: true, error: { status: 'FETCH_ERROR' }, refetch: vi.fn() }; });
describe('document queue failure display', () => {
  it('keeps cached documents visible and explains failed refresh without claiming access was removed', () => {
    state.queue.data = { data: [{ id: 'qa', fileName: 'Synthetic QA.pdf', currentVersion: 2, reviewStatus: 'pending' }] };
    const html = renderToStaticMarkup(<DocumentReviewsPage />);
    expect(html).toContain('Synthetic QA.pdf');
    expect(html).toContain('Document list could not refresh');
    expect(html).toContain('Showing the last loaded documents');
    expect(html).not.toContain('No documents shared');
    expect(html).not.toContain('access is no longer available');
  });
  it('shows an initial failure instead of a false empty queue', () => {
    const html = renderToStaticMarkup(<DocumentReviewsPage />);
    expect(html).toContain('Could not load shared documents');
    expect(html).toContain('Check your connection');
    expect(html).not.toContain('No documents shared');
  });
  it('distinguishes denied queue access from connection failures', () => {
    state.queue.error = { status: 403 };
    const html = renderToStaticMarkup(<DocumentReviewsPage />);
    expect(html).toContain('You do not have access to this document queue.');
    expect(html).not.toContain('Check your connection');
  });
});
