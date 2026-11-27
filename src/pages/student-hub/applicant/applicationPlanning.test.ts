import { describe, expect, it } from "vitest";
import {
  planningDeadlineState,
  submissionDateFields,
} from "./applicationPlanning";

describe("application submission dates", () => {
  it("does not invent a date when an already-submitted plan has an unknown date", () => {
    expect(submissionDateFields("submitted", undefined, null)).toEqual({
      submittedAt: null,
    });
  });
  it("records the entered date and lets the student clear an incorrect date", () => {
    expect(submissionDateFields("submitted", "2026-11-10")).toEqual({
      submittedAt: "2026-11-10",
    });
    expect(submissionDateFields("under_review", null, "2026-11-10")).toEqual({
      submittedAt: null,
    });
  });
  it("preserves an existing timestamp if its displayed calendar date was not changed", () => {
    const existing = new Date(2026, 10, 10, 14, 30).toISOString();
    expect(submissionDateFields("submitted", "2026-11-10", existing)).toEqual({
      submittedAt: existing,
    });
  });
  it("leaves submission history untouched while planning or recording a decision", () => {
    expect(submissionDateFields("applying", undefined, "2026-11-10")).toEqual(
      {},
    );
    expect(submissionDateFields("accepted", "2026-11-10")).toEqual({});
  });
});
describe("planning date urgency", () => {
  const now = new Date(2026, 10, 24, 23, 59);
  it("distinguishes overdue, today and upcoming dates using calendar days", () => {
    expect(planningDeadlineState("2026-11-15", now)).toEqual({
      tone: "overdue",
      label: "Overdue by 9 days",
    });
    expect(planningDeadlineState("2026-11-23", now)?.label).toBe(
      "Overdue by 1 day",
    );
    expect(planningDeadlineState("2026-11-24", now)).toEqual({
      tone: "today",
      label: "Due today",
    });
    expect(planningDeadlineState("2026-11-25", now)?.label).toBe("1 day left");
    expect(planningDeadlineState("2026-11-28", now)?.label).toBe("4 days left");
  });
  it("does not claim urgency for missing, invalid or distant dates", () => {
    expect(planningDeadlineState(null, now)).toBeNull();
    expect(planningDeadlineState("not a date", now)).toBeNull();
    expect(planningDeadlineState("2027-01-10", now)).toBeNull();
  });
});
