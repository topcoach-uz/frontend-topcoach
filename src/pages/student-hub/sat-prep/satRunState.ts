/**
 * Persisted state for a SAT test in progress, so a reload (or an accidental
 * navigation) does not lose answers or reset the timer. Lives in
 * sessionStorage next to the composed test (`sat-mock-test`).
 */
export const RUN_PREFIX = 'sat-run:';
export const TEST_KEY = 'sat-mock-test';
export const TEST_META_KEY = 'sat-mock-test-meta';

export interface SavedRun {
  answers: Record<string, { letter: 'A' | 'B' | 'C' | 'D' | null; spr: string }>;
  marked: Record<string, boolean>;
  idx: number;
  phase: 'briefing' | 'taking';
  /** Absolute epoch ms when the timer hits zero (null = untimed). */
  endsAt: number | null;
  startedAt: number | null;
  savedAt: number;
}

export function runKey(questions: { id: string }[], meta: { mode?: string; mockId?: string }): string {
  const ids = questions.map((q) => q.id).join(',');
  let h = 0;
  for (let i = 0; i < ids.length; i++) h = (h * 31 + ids.charCodeAt(i)) | 0;
  return `${RUN_PREFIX}${meta.mode ?? 'practice'}:${meta.mockId ?? ''}:${questions.length}:${(h >>> 0).toString(36)}`;
}

export function loadRun(key: string): SavedRun | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedRun) : null;
  } catch {
    return null;
  }
}

export function saveRun(key: string, run: SavedRun) {
  try {
    sessionStorage.setItem(key, JSON.stringify(run));
  } catch {
    /* quota or private mode: the test still works, it just won't resume */
  }
}

export function clearRun(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function answeredCount(run: Pick<SavedRun, 'answers'>): number {
  return Object.values(run.answers).filter((a) => a.letter || a.spr).length;
}

/** The resumable run for the test currently composed in sessionStorage, if any. */
export function findResumableRun(): { run: SavedRun; total: number; title: string } | null {
  try {
    const raw = sessionStorage.getItem(TEST_KEY);
    if (!raw) return null;
    const questions = JSON.parse(raw) as { id: string }[];
    const rawMeta = sessionStorage.getItem(TEST_META_KEY);
    const meta = rawMeta ? (JSON.parse(rawMeta) as { mode?: string; mockId?: string; title?: string }) : {};
    const run = loadRun(runKey(questions, meta));
    if (!run || run.phase !== 'taking') return null;
    if (run.endsAt != null && run.endsAt <= Date.now()) return null;
    return { run, total: questions.length, title: meta.title ?? 'your test' };
  } catch {
    return null;
  }
}
