export const examChecklistKey = (universityId: string) => `tc.examChecklist.${universityId}`;

/** Keeps only exams that are still required, in a stable order. */
export function parseReadyExams(raw: string | null, exams: readonly string[]): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const ready = new Set(parsed.filter((item): item is string => typeof item === "string"));
    return exams.filter((exam) => ready.has(exam));
  } catch { return []; }
}

export function toggleExam(ready: readonly string[], exam: string): string[] {
  return ready.includes(exam) ? ready.filter((item) => item !== exam) : [...ready, exam];
}

export function loadReadyExams(universityId: string, exams: readonly string[]): string[] {
  try { return parseReadyExams(window.localStorage.getItem(examChecklistKey(universityId)), exams); } catch { return []; }
}

export function saveReadyExams(universityId: string, ready: readonly string[]): void {
  try { window.localStorage.setItem(examChecklistKey(universityId), JSON.stringify(ready)); } catch { /* storage unavailable: checklist still works for this visit */ }
}
