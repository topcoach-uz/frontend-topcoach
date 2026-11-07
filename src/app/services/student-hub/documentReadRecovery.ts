/** Retry only idempotent document reads after temporary transport/server failures. */
export function isTemporaryDocumentError(error: unknown): boolean {
  const failure = error as { status?: unknown; originalStatus?: number; error?: string } | undefined;
  const status = failure?.status;
  // fetchBaseQuery calls interrupted response-body reads PARSING_ERROR, even
  // after a server has successfully sent HTTP 200. Invalid JSON stays an error.
  if (status === 'PARSING_ERROR') {
    const original = failure?.originalStatus;
    return original === 408 || (typeof original === 'number' && original >= 500 && original <= 599) ||
      (typeof original === 'number' && original >= 200 && original < 300 &&
        /^TypeError: (?:Failed to fetch|Load failed|terminated|NetworkError(?: when attempting to fetch resource\.)?|network error)$/i.test(failure?.error ?? ''));
  }
  return status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR' ||
    status === 408 ||
    (typeof status === 'number' && status >= 500 && status <= 599);
}

export function isDocumentAccessDenied(error: unknown): boolean {
  const status = (error as { status?: unknown } | undefined)?.status;
  return status === 403 || status === 404;
}

function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve(); };
    const timer = setTimeout(finish, ms);
    signal.addEventListener('abort', finish, { once: true });
    if (signal.aborted) finish();
  });
}

export async function recoverDocumentRead<T extends { error?: unknown }>(
  request: () => Promise<T>, signal: AbortSignal,
): Promise<T> {
  let result = await request();
  for (const delay of [500, 1500]) {
    if (signal.aborted || !isTemporaryDocumentError(result.error)) break;
    await pause(delay, signal);
    if (signal.aborted) break;
    result = await request();
  }
  return result;
}

export function isRecoverableDocumentRead(url: string, method = 'GET'): boolean {
  if (method.toUpperCase() !== 'GET') return false;
  const path = url.replace(/^\//, '');
  if (path === 'document-management' || path === 'document-management/shared-with-me') return true;
  // Only the known JSON read routes; never uploads, decisions or binary files.
  return /^document-management\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}(?:\/(?:review|versions))?$/i.test(path);
}
