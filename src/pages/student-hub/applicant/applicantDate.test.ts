import { describe, expect, it } from "vitest";
import { parseApplicantDate } from "./applicantDate";

describe("parseApplicantDate", () => {
  it("keeps a date-only value on the same local calendar day", () => {
    const date = parseApplicantDate("2026-09-20");
    expect([date.getFullYear(), date.getMonth() + 1, date.getDate()]).toEqual([
      2026, 9, 20,
    ]);
  });

  it("keeps timestamp values as instants", () => {
    expect(parseApplicantDate("2026-09-20T12:30:00.000Z").toISOString()).toBe(
      "2026-09-20T12:30:00.000Z",
    );
  });
});
