import { describe, expect, it } from "vitest";
import { countWords, essayWordLimit, ideasForEssay, limitLevel, limitMessage, saveState } from "./essayWriting";

describe("essayWriting", () => {
  it("counts words", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("  one two\nthree ")).toBe(3);
  });
  it("limits only personal statements", () => {
    expect(essayWordLimit("personal_statement")).toBe(650);
    expect(essayWordLimit("why_school")).toBeUndefined();
  });
  it("classifies limit level", () => {
    expect(limitLevel(10)).toBe("none");
    expect(limitLevel(100, 650)).toBe("ok");
    expect(limitLevel(585, 650)).toBe("near");
    expect(limitLevel(650, 650)).toBe("near");
    expect(limitLevel(651, 650)).toBe("over");
  });
  it("words the limit state in text", () => {
    expect(limitMessage(10)).toBeUndefined();
    expect(limitMessage(100, 650)).toBeUndefined();
    expect(limitMessage(600, 650)).toBe("50 words left");
    expect(limitMessage(649, 650)).toBe("1 word left");
    expect(limitMessage(650, 650)).toBe("0 words left");
    expect(limitMessage(660, 650)).toBe("Over by 10 words");
    expect(limitMessage(651, 650)).toBe("Over by 1 word");
  });
  it("derives save state with precedence", () => {
    const base = { saving: false, failed: false, dirty: false };
    expect(saveState({ ...base, saving: true, failed: true })).toBe("saving");
    expect(saveState({ ...base, failed: true, dirty: true })).toBe("error");
    expect(saveState({ ...base, dirty: true })).toBe("unsaved");
    expect(saveState({ ...base, lastSavedAt: new Date() })).toBe("saved");
    expect(saveState(base)).toBe("idle");
  });
  it("adapts ideas by type", () => {
    expect(ideasForEssay("why_major")[0]).toMatch(/subject/);
    expect(ideasForEssay("personal_statement")).toHaveLength(3);
  });
});
