import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  normalizeFullSupportSession,
  normalizePlatformBooking,
  parseFullSupportDuration,
} from "./sessionSources";
import type { SessionLogDto } from "src/app/services/fullSupportApi";
import type { SessionsSchema } from "src/app/api/Api";

vi.mock("src/app/services/sessions", () => ({
  useGetMySessionsQuery: vi.fn(),
}));
vi.mock("src/app/services/fullSupportApi", () => ({
  useGetMentorSessionsQuery: vi.fn(),
}));

const fs = (extra: Partial<SessionLogDto> = {}) =>
  ({
    id: "lesson-1",
    dateTime: "2026-09-25T10:00:00Z",
    duration: "1h",
    outcome: "scheduled",
    done: false,
    ...extra,
  }) as SessionLogDto;
const platform = (extra = {}) =>
  ({
    id: "session-1",
    type: "individual60m",
    date: "2026-09-25T10:00:00Z",
    participants: [{ id: "student-1" }],
    ...extra,
  }) as unknown as SessionsSchema;

describe("Mentor session attendance states", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-17T12:00:00Z')); });
  afterEach(() => vi.useRealTimers());
  it("uses hours for Full Support timing and supports older minute labels", () => {
    expect(parseFullSupportDuration("1h")).toBe(60);
    expect(parseFullSupportDuration("0.5h")).toBe(30);
    expect(parseFullSupportDuration("1.5")).toBe(90);
    expect(parseFullSupportDuration("45m")).toBe(45);
    expect(normalizeFullSupportSession(fs(), "Student").durationLabel).toBe(
      "60 min",
    );
  });
  it("does not put Full Support no-shows back in the report queue", () => {
    for (const outcome of [
      "student_no_show",
      "mentor_no_show",
      "held",
    ] as const)
      expect(normalizeFullSupportSession(fs({ outcome }), null).status).toBe(
        "completed",
      );
  });
  it("keeps cancelled and rescheduled Full Support records out of upcoming and due", () => {
    for (const outcome of ["cancelled", "rescheduled"] as const)
      expect(normalizeFullSupportSession(fs({ outcome }), null).status).toBe(
        "cancelled",
      );
  });
  it("leaves unrecorded Full Support lessons awaiting a record", () => {
    expect(normalizeFullSupportSession(fs(), null).status).toBe("report-due");
  });
  it("keeps ongoing lessons upcoming until their planned end", () => {
    expect(normalizeFullSupportSession(fs({ dateTime: '2026-10-17T11:30:00Z', duration: '1h' }), null).status).toBe('upcoming');
    expect(normalizeFullSupportSession(fs({ dateTime: '2026-10-17T11:00:00Z', duration: '1h' }), null).status).toBe('report-due');
  });
});
