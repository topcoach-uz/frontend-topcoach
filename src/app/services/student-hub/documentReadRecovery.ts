/** Retry only idempotent document reads after temporary transport/server failures. */
export function isTemporaryDocumentError(error: unknown): boolean {
  const status = (error as { status?: unknown } | undefined)?.status;
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
  return method.toUpperCase() === 'GET' &&
    /^\/?document-management\/(shared-with-me|[^/]+\/review)$/.test(url);
}
