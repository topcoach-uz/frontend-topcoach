import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  readPendingWork,
  storePendingWork,
  type ProgramWorkSubmission,
} from "./programWorkRetry";
const pending: ProgramWorkSubmission = {
  id: "enrollment",
  body: {
    mentorUserId: "mentor",
    requestId: "same-request",
    date: "2026-11-09",
    actualDurationMinutes: 60,
    description: "Essay practice",
    reason: "Completed work",
  },
};
beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});
describe("Unconfirmed program work requests", () => {
  it("retains the original request ID and payload across a page reload", () => {
    storePendingWork("mentor", pending);
    expect(readPendingWork("mentor")).toEqual(pending);
    expect(readPendingWork("other-mentor")).toBeNull();
  });
  it("clears a request after its result is confirmed", () => {
    storePendingWork("mentor", pending);
    storePendingWork("mentor", null);
    expect(readPendingWork("mentor")).toBeNull();
  });
  it("ignores malformed storage and data from a different account", () => {
    sessionStorage.setItem("mentor-program-work-pending:mentor", "{");
    expect(readPendingWork("mentor")).toBeNull();
    storePendingWork("mentor", {
      ...pending,
      body: { ...pending.body, mentorUserId: "other-mentor" },
    });
    expect(readPendingWork("mentor")).toBeNull();
  });
});
