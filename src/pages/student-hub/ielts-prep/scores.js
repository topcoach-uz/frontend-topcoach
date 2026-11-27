// Pure score maths + result-history helpers for the Scores page.
/** IELTS overall: mean of the four bands, rounded to the nearest half band. */
export function roundHalf(n) {
  return Math.round(n * 2) / 2;
}
const isBand = (n) => typeof n === "number" && Number.isFinite(n);

/** Overall band only when all four skills have a numeric band; else null + the gaps. */
export function overallBand(bands) {
  const order = ["listening", "reading", "writing", "speaking"];
  const missing = order.filter((s) => !isBand(bands?.[s]));
  if (missing.length) return { value: null, missing };
  return {
    value: roundHalf(order.reduce((sum, s) => sum + bands[s], 0) / order.length),
    missing: [],
  };
}

/** Writing: Task 2 counts double. Needs both tasks; otherwise no skill band. */
export function writingBand(task1, task2) {
  if (!isBand(task1) || !isBand(task2)) return null;
  return roundHalf((task1 + 2 * task2) / 3);
}

/** Newest assessed submission that carries a numeric estimated band. */
export function latestWritingBand(submissions) {
  const rows = (Array.isArray(submissions) ? submissions : [])
    .filter((s) => s?.state === "assessed" && isBand(s.feedback?.estimatedBand))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return rows.length ? rows[0].feedback.estimatedBand : null;
}

export const formatBand = (n) => (isBand(n) ? n.toFixed(1) : "—");

/** Qualitative speaking status; never a fabricated band. */
export function speakingStatus(markerState) {
  return markerState === "done"
    ? "Completed"
    : markerState === "started"
      ? "In progress"
      : "Not started";
}

/**
 * Keep the previous result so the next view can show a delta. A new entry only
 * replaces `current` when the outcome actually changed.
 */
export function recordResult(stored, result) {
  const same = (a, b) =>
    a && b && a.correct === b.correct && a.answered === b.answered && a.total === b.total;
  if (!stored?.current) return { current: result, previous: null };
  if (same(stored.current, result)) return stored;
  return { current: result, previous: stored.current };
}

export function resultDelta(stored) {
  if (!stored?.current || !stored?.previous) return null;
  const correct = stored.current.correct - stored.previous.correct;
  const bandDelta =
    isBand(stored.current.band) && isBand(stored.previous.band)
      ? stored.current.band - stored.previous.band
      : null;
  return { correct, band: bandDelta };
}

/** Next test of the same book, else first test of the next book in the list. */
export function nextTest(r, books, testCountFn) {
  const count = testCountFn(r.type, r.book === "og" || r.book === "eg" ? r.book : Number(r.book));
  if (r.test < count) return { ...r, test: r.test + 1 };
  const i = books.findIndex((b) => String(b) === String(r.book));
  const next = i >= 0 ? books[i + 1] : undefined;
  return next === undefined ? null : { type: r.type, book: String(next), test: 1 };
}
