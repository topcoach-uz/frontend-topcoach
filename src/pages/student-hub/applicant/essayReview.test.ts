import { describe, expect, it } from "vitest";
import { findQuoteRange, paragraphOffset, reviewErrorMessage } from "./essayReview";

const draft = "First line about robots.\n\n  I built a Robot in grade nine.\nIt   failed twice.";

describe("paragraphOffset", () => {
  it("skips empty lines", () => {
    expect(paragraphOffset(draft, 0)).toBe(0);
    expect(paragraphOffset(draft, 1)).toBe(draft.indexOf("  I built"));
    expect(paragraphOffset(draft, 5)).toBe(-1);
  });
});

describe("findQuoteRange", () => {
  it("matches case-insensitively", () => {
    const r = findQuoteRange(draft, 1, "i built a robot");
    expect(draft.slice(r!.start, r!.end)).toBe("I built a Robot");
  });
  it("matches across collapsed whitespace", () => {
    const r = findQuoteRange(draft, 2, "It failed twice.");
    expect(draft.slice(r!.start, r!.end)).toBe("It   failed twice");
  });
  it("prefers the paragraph but falls back to the first match", () => {
    const text = "robots\nrobots again";
    expect(findQuoteRange(text, 1, "robots")!.start).toBe(7);
    expect(findQuoteRange(text, 9, "robots")!.start).toBe(0);
  });
  it("ignores surrounding ellipses and curly quotes", () => {
    const r = findQuoteRange("It’s fine here", 0, "…it's fine…");
    expect(r).toEqual({ start: 0, end: 9 });
  });
  it("returns null when absent", () => {
    expect(findQuoteRange(draft, 0, "submarine")).toBeNull();
    expect(findQuoteRange(draft, 0, "  ")).toBeNull();
  });
});

describe("reviewErrorMessage", () => {
  it("shows backend text for 400/429 only", () => {
    expect(reviewErrorMessage({ status: 400, data: { message: "Write at least 80 words." } })).toBe("Write at least 80 words.");
    expect(reviewErrorMessage({ status: 503, data: { message: "x" } })).toBe("AI review isn't available right now.");
  });
});
