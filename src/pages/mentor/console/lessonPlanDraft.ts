export function loadLessonDraft<T>(key: string): T | null {
  try {
    return JSON.parse(
      sessionStorage.getItem(`full-support-pending:${key}`) || 'null',
    );
  } catch {
    return null;
  }
}
export function storeLessonDraft(key: string, value: unknown) {
  try {
    if (value === null)
      sessionStorage.removeItem(`full-support-pending:${key}`);
    else
      sessionStorage.setItem(
        `full-support-pending:${key}`,
        JSON.stringify(value),
      );
  } catch {
    /* The current form retains its draft if storage is unavailable. */
  }
}
export function lessonPlanError(error: unknown) {
  const message = (error as { data?: { message?: string | string[] } }).data
    ?.message;
  return Array.isArray(message)
    ? message.join(', ')
    : message || 'Could not load the lesson dates. Please try again.';
}
export function definitiveRejection(error: unknown) {
  const status = (error as { status?: number }).status;
  return (
    typeof status === 'number' &&
    status >= 400 &&
    status < 500 &&
    status !== 408
  );
}
