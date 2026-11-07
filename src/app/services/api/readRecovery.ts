import type { BaseQueryFn, FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query';

type Query = BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, {}, FetchBaseQueryMeta>;

function transient(error: FetchBaseQueryError | undefined) {
  if (!error) return false;
  if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') return true;
  if (error.status === 'PARSING_ERROR') {
    return [502, 503, 504].includes(error.originalStatus) ||
      (error.originalStatus >= 200 && error.originalStatus < 300 &&
        /^TypeError: (Failed to fetch|Load failed|terminated|NetworkError.*|network error)$/i.test(error.error));
  }
  return error.status === 408 || error.status === 502 || error.status === 503 || error.status === 504;
}

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve(); };
    const timer = setTimeout(finish, ms);
    signal.addEventListener('abort', finish, { once: true });
    if (signal.aborted) finish();
  });
}

/** Recover safe reads after a transient gateway/transport failure. Never replay writes. */
export function withReadRecovery(query: Query): Query {
  return async (args, api, options) => {
    const method = typeof args === 'string' ? 'GET' : (args.method ?? 'GET').toUpperCase();
    if (api.type !== 'query' || !['GET', 'HEAD'].includes(method)) return query(args, api, options);
    const attempt = async () => {
      const controller = new AbortController();
      const abort = () => controller.abort();
      api.signal.addEventListener('abort', abort, { once: true });
      if (api.signal.aborted) abort();
      let timedOut = false;
      // Cover response bodies as well as headers, without aborting the RTK
      // operation itself: a request deadline must still allow a fresh attempt.
      const timer = setTimeout(() => { timedOut = true; abort(); }, 15000);
      try {
        const result = await query(
          { ...(typeof args === 'string' ? { url: args } : args), timeout: 0 },
          { ...api, signal: controller.signal, abort }, options,
        );
        return timedOut
          ? { error: { status: 'TIMEOUT_ERROR' as const, error: 'Read attempt timed out' }, meta: result.meta }
          : result;
      } finally {
        clearTimeout(timer);
        api.signal.removeEventListener('abort', abort);
      }
    };
    let result = await attempt();
    for (const delay of [300, 1000]) {
      if (api.signal.aborted || !transient(result.error)) break;
      await pause(delay, api.signal);
      if (api.signal.aborted) break;
      result = await attempt();
    }
    return result;
  };
}
