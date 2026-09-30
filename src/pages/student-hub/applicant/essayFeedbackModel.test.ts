import { describe, expect, it } from "vitest";
import { getMentorFeedbackText } from "./essayFeedbackModel";

describe("getMentorFeedbackText", () => {
  it("does not treat the API's default empty object as feedback", () => {
    expect(getMentorFeedbackText({})).toBe("");
  });

  it("does not treat whitespace-only feedback as available", () => {
    expect(getMentorFeedbackText("   ")).toBe("");
    expect(getMentorFeedbackText({ suggestions: ["  "] })).toBe("");
  });

  it("returns substantive mentor comments", () => {
    expect(
      getMentorFeedbackText({
        strengths: ["Clear opening"],
        suggestions: ["Add one concrete example"],
      }),
    ).toBe("Clear opening\n\nAdd one concrete example");
  });
});
