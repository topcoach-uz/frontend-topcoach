import type { EssayIdeaAngle } from "src/app/services/student-hub/essayManagementApi";

export const ANGLES_UNAVAILABLE = "Story angles aren't available right now.";

/** Maps a failed RTK Query error to a short, student-facing message. */
export function anglesErrorMessage(error: unknown): string {
  const e = error as { status?: number; data?: { message?: unknown } } | undefined;
  const raw = e?.data?.message;
  const text = Array.isArray(raw) ? raw.join(" ") : typeof raw === "string" ? raw : "";
  if (e?.status === 429 && text.trim()) return text.trim();
  return ANGLES_UNAVAILABLE;
}

export interface PinnedAngle {
  id: string;
  title: string;
  questions: string[];
  sources: { kind: string; label: string }[];
}

const pinKey = (essayId: string) => `topcoach:essay-angle:${essayId}`;

export function pinnedAngleFrom(angle: EssayIdeaAngle): PinnedAngle {
  return {
    id: angle.id,
    title: angle.title,
    questions: angle.questions,
    sources: angle.sources.map((s) => ({ kind: s.kind, label: s.label })),
  };
}

export function loadPinnedAngle(essayId: string): PinnedAngle | undefined {
  try {
    const raw = localStorage.getItem(pinKey(essayId));
    if (!raw) return undefined;
    const v = JSON.parse(raw) as Partial<PinnedAngle> | null;
    if (!v || typeof v.title !== "string" || !v.title.trim()) return undefined;
    return {
      id: typeof v.id === "string" ? v.id : "",
      title: v.title,
      questions: Array.isArray(v.questions) ? v.questions.filter((q): q is string => typeof q === "string") : [],
      sources: Array.isArray(v.sources)
        ? v.sources.filter((s) => s && typeof s.label === "string").map((s) => ({ kind: String(s.kind), label: s.label }))
        : [],
    };
  } catch {
    return undefined;
  }
}

export function savePinnedAngle(essayId: string, angle: PinnedAngle): void {
  try {
    localStorage.setItem(pinKey(essayId), JSON.stringify(angle));
  } catch {
    /* storage unavailable: the pin lives in memory only */
  }
}

export function clearPinnedAngle(essayId: string): void {
  try {
    localStorage.removeItem(pinKey(essayId));
  } catch {
    /* ignore */
  }
}
