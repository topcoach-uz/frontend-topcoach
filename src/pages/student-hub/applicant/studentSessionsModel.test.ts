import { describe, expect, it } from "vitest";
import {
  hasStudentRated,
  needsRating,
  pickSummaryFields,
  splitSessions,
  unwrapSessions,
  type StudentSessionRow,
} from "./studentSessionsModel";

const NOW = new Date("2026-11-06T12:00:00Z").getTime();
const row = (id: string, date: string, extra: Partial<StudentSessionRow> = {}): StudentSessionRow => ({ id, date, ...extra });

describe("splitSessions", () => {
  it("separates upcoming and past and sorts", () => {
    const { upcoming, past } = splitSessions(
      [
        row("a", "2026-11-10T10:00:00Z"),
        row("b", "2026-11-08T10:00:00Z"),
        row("c", "2026-11-01T10:00:00Z"),
        row("d", "2026-11-03T10:00:00Z"),
        row("x", "2026-11-12T10:00:00Z", { cancelStatus: { id: "1" } }),
        row("bad", "nope"),
      ],
      NOW,
    );
    expect(upcoming.map((s) => s.id)).toEqual(["b", "a"]);
    expect(past.map((s) => s.id)).toEqual(["x", "d", "c"]);
  });
});

describe("rating", () => {
  const rated = row("r", "2026-11-01T10:00:00Z", { reviews: [{ rating: 4, reviewer: { id: "u1" } }] });
  it("detects the student's own review", () => {
    expect(hasStudentRated(rated, "u1")).toBe(true);
    expect(hasStudentRated(rated, "u2")).toBe(false);
  });
  it("needsRating only for past, uncancelled, unrated", () => {
    expect(needsRating(rated, "u1", NOW)).toBe(false);
    expect(needsRating(rated, "u2", NOW)).toBe(true);
    expect(needsRating(row("f", "2026-11-09T10:00:00Z"), "u1", NOW)).toBe(false);
    expect(needsRating(row("c", "2026-11-01T10:00:00Z", { cancelStatus: {} }), "u1", NOW)).toBe(false);
  });
});

describe("pickSummaryFields", () => {
  it("returns only topics and homework", () => {
    const s = row("a", "2026-11-01T10:00:00Z", {
      report: { topicsCovered: " Essay ", homework: "Draft", notes: "private", rating: "tough" },
    });
    expect(pickSummaryFields(s)).toEqual({ topicsCovered: "Essay", homework: "Draft" });
  });
  it("returns null without a usable report", () => {
    expect(pickSummaryFields(row("a", "2026-11-01T10:00:00Z"))).toBeNull();
    expect(pickSummaryFields(row("a", "2026-11-01T10:00:00Z", { report: { notes: "x" } }))).toBeNull();
  });
});

describe("unwrapSessions", () => {
  it("accepts the { data, total } payload GET /sessions/me actually returns", () => {
    expect(unwrapSessions({ data: [{ id: "a", date: "2026-11-01" }], total: 1 })).toHaveLength(1);
  });
  it("accepts a bare array and tolerates missing data", () => {
    expect(unwrapSessions([{ id: "a", date: "2026-11-01" }])).toHaveLength(1);
    expect(unwrapSessions(undefined)).toEqual([]);
    expect(unwrapSessions({ total: 0 })).toEqual([]);
  });
});
