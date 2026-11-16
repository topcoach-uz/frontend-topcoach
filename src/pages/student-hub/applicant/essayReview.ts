import type { EssayReviewComment } from "src/app/services/student-hub/essayManagementApi";

export const REVIEW_UNAVAILABLE = "AI review isn't available right now.";

/** Maps a failed RTK Query error to a short, student-facing message. */
export function reviewErrorMessage(error: unknown): string {
  const e = error as { status?: number; data?: { message?: unknown } } | undefined;
  const raw = e?.data?.message;
  const text = Array.isArray(raw) ? raw.join(" ") : typeof raw === "string" ? raw : "";
  if ((e?.status === 400 || e?.status === 429) && text.trim()) return text.trim();
  return REVIEW_UNAVAILABLE;
}

export const COMMENT_KIND_LABELS: Record<EssayReviewComment["kind"], string> = {
  clarity: "Clarity",
  specificity: "Specificity",
  structure: "Structure",
  voice: "Voice",
  prompt_fit: "Prompt fit",
  length: "Length",
};

/** Character offset where the nth (0-based) non-empty line starts, or -1. */
export function paragraphOffset(content: string, paragraph: number): number {
  let index = 0;
  let pos = 0;
  for (const line of content.split("\n")) {
    if (line.trim()) {
      if (index === paragraph) return pos;
      index += 1;
    }
    pos += line.length + 1;
  }
  return -1;
}

const QUOTES = /[‘’“”]/g;

/** Lower-cased, whitespace-collapsed copy of `text` with a map back to original indices. */
function normalise(text: string): { value: string; map: number[] } {
  let value = "";
  const map: number[] = [];
  let lastSpace = true;
  for (let i = 0; i < text.length; i += 1) {
    let ch = text[i];
    if (/\s/.test(ch)) {
      if (lastSpace) continue;
      ch = " ";
      lastSpace = true;
    } else {
      lastSpace = false;
      ch = ch.replace(QUOTES, (q) => (q === "‘" || q === "’" ? "'" : '"')).toLowerCase();
    }
    value += ch;
    map.push(i);
  }
  return { value, map };
}

/** Finds the quoted excerpt in the draft, preferring the given paragraph. Null when absent. */
export function findQuoteRange(
  content: string,
  paragraph: number,
  quote: string,
): { start: number; end: number } | null {
  const needle = normalise(quote.replace(/^[\s.…]+|[\s.…]+$/g, "")).value.trim();
  if (!needle) return null;
  const hay = normalise(content);
  const search = (from: number) => {
    const at = hay.value.indexOf(needle, from);
    if (at < 0) return null;
    return { start: hay.map[at], end: hay.map[at + needle.length - 1] + 1 };
  };
  const offset = paragraphOffset(content, paragraph);
  if (offset >= 0) {
    const fromNorm = hay.map.findIndex((orig) => orig >= offset);
    if (fromNorm >= 0) {
      const hit = search(fromNorm);
      if (hit) return hit;
    }
  }
  return search(0);
}
