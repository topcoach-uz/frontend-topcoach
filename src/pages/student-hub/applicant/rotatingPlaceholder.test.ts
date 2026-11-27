import { describe, expect, it } from "vitest";
import { initialTypewriterState, stepTypewriter, typewriterText } from "./rotatingPlaceholder";

describe("stepTypewriter", () => {
  it("types, holds, erases, then moves to the next example", () => {
    const examples = ["ab", "c"];
    let state = initialTypewriterState;
    const seen: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      state = stepTypewriter(state, examples).state;
      seen.push(`${state.phase}:${typewriterText(state, examples)}`);
    }
    expect(seen.slice(0, 5)).toEqual(["typing:a", "holding:ab", "erasing:ab", "erasing:a", "gap:"]);
    expect(seen).toContain("holding:c");
  });
  it("is a no-op without examples", () => {
    expect(typewriterText(initialTypewriterState, [])).toBe("");
  });
});
