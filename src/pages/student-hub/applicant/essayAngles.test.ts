import { describe, expect, it } from "vitest";
import { ANGLES_UNAVAILABLE, angleClipboardText, anglesErrorMessage } from "./essayAngles";

describe("anglesErrorMessage", () => {
  it("shows the 429 message", () => {
    expect(anglesErrorMessage({ status: 429, data: { message: "Daily limit reached." } })).toBe("Daily limit reached.");
  });
  it("joins array messages", () => {
    expect(anglesErrorMessage({ status: 429, data: { message: ["a", "b"] } })).toBe("a b");
  });
  it("falls back for 429 without a message, 503 and unknown", () => {
    expect(anglesErrorMessage({ status: 429 })).toBe(ANGLES_UNAVAILABLE);
    expect(anglesErrorMessage({ status: 503, data: { message: "x" } })).toBe(ANGLES_UNAVAILABLE);
    expect(anglesErrorMessage(undefined)).toBe(ANGLES_UNAVAILABLE);
  });
});

describe("angleClipboardText", () => {
  it("formats title and numbered questions", () => {
    expect(angleClipboardText({ title: " Angle ", questions: ["Q1", "Q2"] })).toBe("Angle\n1. Q1\n2. Q2");
  });
});
