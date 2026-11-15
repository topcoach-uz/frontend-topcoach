import type { EssayIdeaAngle, EssayIdeasDocument } from "src/app/services/student-hub/essayManagementApi";

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

export const MAX_COACH_DOCUMENTS = 5;
export const MAX_COACH_DOCUMENT_BYTES = 8 * 1024 * 1024;
const COACH_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain"];
const WORD_MIME_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export interface CoachDocumentSupport {
  supported: boolean;
  reason?: string;
}

export function isCoachSupportedDocument(record: { mimeType?: string; fileSize?: number }): CoachDocumentSupport {
  const mime = (record.mimeType ?? "").toLowerCase();
  if (WORD_MIME_TYPES.includes(mime)) return { supported: false, reason: "Word files: save as PDF to use" };
  if (!COACH_MIME_TYPES.includes(mime)) return { supported: false, reason: "Not supported" };
  if (typeof record.fileSize === "number" && record.fileSize > MAX_COACH_DOCUMENT_BYTES) {
    return { supported: false, reason: "Larger than 8 MB" };
  }
  return { supported: true };
}

const docsKey = (ownerId: string) => `topcoach:essay-coach-docs:${ownerId}`;

/** Keeps only unique string ids that are still available, capped at the maximum. */
export function sanitiseDocumentSelection(ids: unknown, available: readonly string[]): string[] {
  if (!Array.isArray(ids)) return [];
  const ok = new Set(available);
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id === "string" && ok.has(id) && !out.includes(id)) out.push(id);
  }
  return out.slice(0, MAX_COACH_DOCUMENTS);
}

export function loadDocumentSelection(ownerId: string): string[] {
  try {
    const raw = localStorage.getItem(docsKey(ownerId));
    const v = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveDocumentSelection(ownerId: string, ids: string[]): void {
  try {
    localStorage.setItem(docsKey(ownerId), JSON.stringify(ids));
  } catch {
    /* storage unavailable: selection lives in memory only */
  }
}

export function documentsSelectionLabel(count: number): string {
  return count === 0 ? "Documents: none selected" : `Documents: ${count} selected`;
}

/** One muted line: "Read: a.pdf · Skipped: b.docx (reason)". Empty string when nothing to say. */
export function documentsSummary(documents: EssayIdeasDocument[] | undefined): string {
  if (!documents || documents.length === 0) return "";
  const read = documents.filter((d) => d.used).map((d) => d.name);
  const skipped = documents.filter((d) => !d.used).map((d) => (d.reason ? `${d.name} (${d.reason})` : d.name));
  return [read.length ? `Read: ${read.join(", ")}` : "", skipped.length ? `Skipped: ${skipped.join(", ")}` : ""]
    .filter(Boolean)
    .join(" · ");
}

export function documentSelectionChanged(selected: readonly string[], result: EssayIdeasDocument[] | undefined): boolean {
  const before = new Set((result ?? []).map((d) => d.id));
  return before.size !== selected.length || selected.some((id) => !before.has(id));
}
