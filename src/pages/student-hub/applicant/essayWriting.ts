export type EssayTypeKey = string;

export const ESSAY_WORD_LIMITS: Record<string, number> = {
  personal_statement: 650,
};

export function essayWordLimit(type: EssayTypeKey): number | undefined {
  return ESSAY_WORD_LIMITS[type];
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export type LimitLevel = "none" | "ok" | "near" | "over";

export function limitLevel(words: number, limit?: number): LimitLevel {
  if (!limit) return "none";
  if (words > limit) return "over";
  if (words >= limit * 0.9) return "near";
  return "ok";
}

export type SaveState = "saving" | "error" | "unsaved" | "saved" | "idle";

export function saveState(input: { saving: boolean; failed: boolean; dirty: boolean; lastSavedAt?: Date }): SaveState {
  if (input.saving) return "saving";
  if (input.failed) return "error";
  if (input.dirty) return "unsaved";
  return input.lastSavedAt ? "saved" : "idle";
}

export function formatSavedTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ideasForEssay(type: EssayTypeKey, prompt?: string): string[] {
  switch (type) {
    case "why_school":
      return [
        "Which specific programs, people or resources there connect to what you have already done?",
        "What would you contribute that is particular to you?",
        "What can you only find here, and why does it matter to you?",
      ];
    case "why_major":
      return [
        "When did you first notice this subject pulling at you?",
        "What have you done on your own to explore it?",
        "What problem or question do you want to spend years on?",
      ];
    case "scholarship":
      return [
        "What does this scholarship value, in its own words?",
        "Which experience shows that value rather than just claiming it?",
        "What would the funding make possible that is concrete?",
      ];
    case "supplemental":
      return [
        "What is the question really asking beyond the first sentence?",
        "Which detail about you does the rest of your application not show?",
        "How does this answer stay specific to this school or program?",
      ];
    case "personal_statement":
      return [
        "What is one specific moment you keep thinking about?",
        "What did you choose to do?",
        "What did you learn or see differently afterward?",
      ];
    default:
      return [
        "What is this question really asking?",
        "Which specific example answers it best?",
        "What should the reader understand about you by the end?",
      ];
  }
}
