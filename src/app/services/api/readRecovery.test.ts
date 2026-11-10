import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchBaseQuery, type BaseQueryApi } from '@reduxjs/toolkit/query';
import { withReadRecovery } from './readRecovery';

const api = (signal = new AbortController().signal, type: 'query' | 'mutation' = 'query') => ({
  signal, abort: () => {}, dispatch: vi.fn(), getState: () => ({}), extra: undefined,
  endpoint: 'qa', type,
}) as BaseQueryApi;
const json = () => new Response(JSON.stringify({ saved: true }), { headers: { 'Content-Type': 'application/json' } });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('safe API read recovery with the real fetch base query', () => {
  it('recovers a proxy HTML 502 without requiring a manual retry', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn().mockResolvedValueOnce(new Response('<h1>Bad Gateway</h1>', { status: 502 })).mockImplementation(async () => json());
    const request = withReadRecovery(fetchBaseQuery({ baseUrl: 'https://dev.example/api', fetchFn }));
    const pending = request('/student-hub/overview', api(), {});
    await vi.runAllTimersAsync();
    expect(await pending).toMatchObject({ data: { saved: true } });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
  it.each(['POST', 'PATCH', 'DELETE'])('does not replay %s after an uncertain response', async (method) => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const request = withReadRecovery(fetchBaseQuery({ baseUrl: 'https://dev.example/api', fetchFn }));
    expect(await request({ url: '/tasks', method }, api(undefined, 'mutation'), {})).toMatchObject({ error: { status: 'FETCH_ERROR' } });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
  it.each([400, 401, 403, 404, 409, 422, 429, 500])('keeps HTTP %s visible without repeated requests', async (status) => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('{}', { status }));
    const request = withReadRecovery(fetchBaseQuery({ baseUrl: 'https://dev.example/api', fetchFn }));
    expect(await request('/tasks', api(), {})).toMatchObject({ error: { status } });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
  it('bounds repeated gateway failures to three attempts', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn().mockImplementation(async () => new Response('{}', { status: 503 }));
    const pending = withReadRecovery(fetchBaseQuery({ baseUrl: 'https://dev.example/api', fetchFn }))('/tasks', api(), {});
    await vi.runAllTimersAsync();
    expect(await pending).toMatchObject({ error: { status: 503 } });
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });
  it('does not retry malformed successful JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('invalid json'));
    const result = await withReadRecovery(fetchBaseQuery({ baseUrl: 'https://dev.example/api', fetchFn }))('/tasks', api(), {});
    expect(result).toMatchObject({ error: { status: 'PARSING_ERROR', originalStatus: 200 } });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
  it('cancels the backoff when the caller aborts', async () => {
    vi.useFakeTimers();
    const parent = new AbortController();
    const fetchFn = vi.fn().mockImplementation(async () => new Response('{}', { status: 503 }));
    const pending = withReadRecovery(fetchBaseQuery({ baseUrl: 'https://dev.example/api', fetchFn }))('/tasks', api(parent.signal), {});
    await vi.advanceTimersByTimeAsync(100);
    parent.abort();
    await vi.runAllTimersAsync();
    await pending;
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
  it('recovers after an attempt times out while reading the body', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const query = vi.fn(async (_args: unknown, requestApi: BaseQueryApi) => {
      if (++calls > 1) return { data: { saved: true } };
      await new Promise<void>(resolve => requestApi.signal.addEventListener('abort', () => resolve(), { once: true }));
      return { error: { status: 'FETCH_ERROR' as const, error: 'TypeError: Failed to fetch' } };
    });
    const parent = new AbortController();
    const pending = withReadRecovery(query)('/tasks', api(parent.signal), {});
    await vi.runAllTimersAsync();
    expect(await pending).toMatchObject({ data: { saved: true } });
    expect(parent.signal.aborted).toBe(false);
    expect(query).toHaveBeenCalledTimes(2);
  });
});
