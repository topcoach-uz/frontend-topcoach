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

export function angleClipboardText(angle: Pick<EssayIdeaAngle, "title" | "questions">): string {
  const lines = [angle.title.trim()];
  angle.questions.forEach((q, i) => lines.push(`${i + 1}. ${q.trim()}`));
  return lines.join("\n");
}
