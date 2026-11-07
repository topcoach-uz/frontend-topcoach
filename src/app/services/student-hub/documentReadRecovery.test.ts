import { afterEach, describe, expect, it, vi } from 'vitest';
import { isDocumentAccessDenied, recoverDocumentRead, isRecoverableDocumentRead } from './documentReadRecovery';

afterEach(() => vi.useRealTimers());
describe('document read recovery', () => {
  it('limits recovery to known JSON document GETs, excluding mutations and binary files', () => {
    const id = '12345678-1234-4234-8234-123456789abc';
    for (const url of ['/document-management', '/document-management/shared-with-me', `/document-management/${id}`, `/document-management/${id}/review`, `/document-management/${id}/versions`]) {
      expect(isRecoverableDocumentRead(url)).toBe(true);
      for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) expect(isRecoverableDocumentRead(url, method)).toBe(false);
    }
    for (const url of ['/document-management/upload', '/document-management/stats', `/document-management/${id}/download`, `/document-management/${id}/versions/${id}/download`, '/document-management/not-an-id', '/essay-management/reviews']) expect(isRecoverableDocumentRead(url)).toBe(false);
  });
  it.each(['FETCH_ERROR', 'TIMEOUT_ERROR', 408, 500, 502, 503, 504])('recovers a temporary %s without exposing an intermediate failure', async (status) => {
    vi.useFakeTimers();
    const request = vi.fn().mockResolvedValueOnce({ error: { status } }).mockResolvedValue({ data: { data: [{ id: 'shared-document' }] } });
    const pending = recoverDocumentRead(request, new AbortController().signal);
    await vi.runAllTimersAsync();
    expect(await pending).toEqual({ data: { data: [{ id: 'shared-document' }] } });
    expect(request).toHaveBeenCalledTimes(2);
  });
  it.each([400, 401, 403, 404, 409, 429, 'PARSING_ERROR'])('preserves %s without retrying a permanent/authentication error', async (status) => {
    const request = vi.fn().mockResolvedValue({ error: { status } });
    expect(await recoverDocumentRead(request, new AbortController().signal)).toEqual({ error: { status } });
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('bounds persistent failures to three attempts and returns the real final error', async () => {
    vi.useFakeTimers();
    const request = vi.fn().mockResolvedValue({ error: { status: 503, data: 'unavailable' } });
    const pending = recoverDocumentRead(request, new AbortController().signal);
    await vi.runAllTimersAsync();
    expect(await pending).toEqual({ error: { status: 503, data: 'unavailable' } });
    expect(request).toHaveBeenCalledTimes(3);
  });
  it('stops when navigation cancels a pending retry', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const request = vi.fn().mockResolvedValue({ error: { status: 'FETCH_ERROR' } });
    const pending = recoverDocumentRead(request, controller.signal);
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await pending;
    expect(request).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('does not label temporary errors or expired sessions as removed document access', () => {
    for (const status of ['FETCH_ERROR', 'TIMEOUT_ERROR', 401, 500, 503]) expect(isDocumentAccessDenied({ status })).toBe(false);
    expect(isDocumentAccessDenied({ status: 403 })).toBe(true);
    expect(isDocumentAccessDenied({ status: 404 })).toBe(true);
  });
});
