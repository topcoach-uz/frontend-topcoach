import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('src/constants/storage', () => ({ ACCESS_TOKEN: 'access', LANGUAGE: 'language' }));
vi.mock('../api/const', () => ({ baseUrl: 'https://tracker.test/api', apiTagTypes: ['StudentDocuments'] }));
import { documentManagementApi } from './documentManagementApi';

const id = '12345678-1234-4234-8234-123456789abc';
const record = { id, fileName: 'synthetic.pdf', mimeType: 'application/pdf' };
const response = () => new Response(JSON.stringify({ data: record, success: true }), { headers: { 'Content-Type': 'application/json' } });
const makeStore = () => configureStore({
  reducer: { [documentManagementApi.reducerPath]: documentManagementApi.reducer },
  middleware: getDefault => getDefault().concat(documentManagementApi.middleware),
});
let store: ReturnType<typeof makeStore>;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('localStorage', { getItem: () => null });
  store = makeStore();
});
afterEach(() => {
  store.dispatch(documentManagementApi.util.resetApiState());
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('document reads through the real RTK request layer', () => {
  it('recovers document metadata after one transport failure', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockImplementation(response);
    vi.stubGlobal('fetch', fetch);
    const pending = store.dispatch(documentManagementApi.endpoints.getDocument.initiate(id));
    await vi.advanceTimersByTimeAsync(2500);
    const result = await pending;
    expect(result.data?.data).toEqual(record);
    expect(result.isError).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('retries a timed-out attempt without aborting the subscribed query', async () => {
    const fetch = vi.fn().mockImplementationOnce((request: Request) => new Promise((_, reject) => {
      request.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    })).mockImplementation(response);
    vi.stubGlobal('fetch', fetch);
    const pending = store.dispatch(documentManagementApi.endpoints.getDocument.initiate(id));
    await vi.advanceTimersByTimeAsync(33500);
    const result = await pending;
    expect(result.data?.data).toEqual(record);
    expect(result.isError).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('also recovers mentor queue timeouts through the existing recovery route', async () => {
    const fetch = vi.fn().mockImplementationOnce((request: Request) => new Promise((_, reject) => {
      request.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    })).mockImplementation(() => new Response(JSON.stringify({ data: [] })));
    vi.stubGlobal('fetch', fetch);
    const pending = store.dispatch(documentManagementApi.endpoints.getSharedDocuments.initiate());
    await vi.advanceTimersByTimeAsync(16500);
    expect((await pending).data).toEqual({ data: [] });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('still cancels an in-flight attempt when the caller aborts', async () => {
    const fetch = vi.fn().mockImplementation((request: Request) => new Promise((_, reject) => {
      request.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }));
    vi.stubGlobal('fetch', fetch);
    const pending = store.dispatch(documentManagementApi.endpoints.getDocument.initiate(id));
    await vi.advanceTimersByTimeAsync(1);
    pending.abort();
    await vi.advanceTimersByTimeAsync(33500);
    expect((await pending).error).toMatchObject({ name: 'AbortError' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('recovers a lost response body even when HTTP headers say 200', async () => {
    const fetch = vi.fn().mockImplementationOnce(() => new Response(new ReadableStream({
      start(controller) { controller.error(new TypeError('terminated')); },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })).mockImplementation(response);
    vi.stubGlobal('fetch', fetch);
    const pending = store.dispatch(documentManagementApi.endpoints.getDocument.initiate(id));
    await vi.advanceTimersByTimeAsync(2500);
    expect((await pending).data?.data).toEqual(record);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('bounds a response body that stalls after HTTP 200 headers', async () => {
    const fetch = vi.fn().mockImplementationOnce((request: Request) => new Response(new ReadableStream({
      start(controller) {
        request.signal.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')), { once: true });
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })).mockImplementation(response);
    vi.stubGlobal('fetch', fetch);
    const pending = store.dispatch(documentManagementApi.endpoints.getDocument.initiate(id));
    await vi.advanceTimersByTimeAsync(16500);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect((await pending).data?.data).toEqual(record);
  });

  it('does not retry malformed JSON or denied access', async () => {
    for (const reply of [() => new Response('{invalid', { status: 200 }), () => new Response('{}', { status: 403 })]) {
      const fetch = vi.fn().mockImplementation(reply);
      vi.stubGlobal('fetch', fetch);
      const pending = store.dispatch(documentManagementApi.endpoints.getDocument.initiate(id, { forceRefetch: true }));
      await vi.advanceTimersByTimeAsync(2500);
      expect((await pending).isError).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1);
      pending.unsubscribe();
    }
  });

  it('does not replay a document review submission after a transport failure', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetch);
    const pending = store.dispatch(documentManagementApi.endpoints.submitMentorDocumentReview.initiate({
      id, versionId: id, status: 'approved', feedback: 'Synthetic review',
    }));
    await vi.advanceTimersByTimeAsync(2500);
    const result = await pending;
    expect('error' in result ? result.error : undefined).toMatchObject({ status: 'FETCH_ERROR' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
