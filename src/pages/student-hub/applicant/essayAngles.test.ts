import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANGLES_UNAVAILABLE,
  anglesErrorMessage,
  clearPinnedAngle,
  loadPinnedAngle,
  pinnedAngleFrom,
  savePinnedAngle,
} from "./essayAngles";

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

describe("pinned angle storage", () => {
  const angle = pinnedAngleFrom({
    id: "a1",
    title: "Robotics club",
    why: "w",
    questions: ["Q1", "Q2"],
    sources: [{ kind: "profile", label: "Your profile" }],
  } as never);

  const mem = new Map<string, string>();
  const stub = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  };
  beforeEach(() => { mem.clear(); vi.stubGlobal("localStorage", stub); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("round-trips and clears", () => {
    savePinnedAngle("e1", angle);
    expect(loadPinnedAngle("e1")).toEqual(angle);
    expect(loadPinnedAngle("e2")).toBeUndefined();
    clearPinnedAngle("e1");
    expect(loadPinnedAngle("e1")).toBeUndefined();
  });
  it("ignores corrupt data", () => {
    localStorage.setItem("topcoach:essay-angle:e1", "{nope");
    expect(loadPinnedAngle("e1")).toBeUndefined();
    localStorage.setItem("topcoach:essay-angle:e1", JSON.stringify({ title: 3 }));
    expect(loadPinnedAngle("e1")).toBeUndefined();
  });
  it("does not throw when storage throws", () => {
    const boom = () => { throw new Error("denied"); };
    vi.stubGlobal("localStorage", { getItem: boom, setItem: boom, removeItem: boom });
    expect(() => savePinnedAngle("e1", angle)).not.toThrow();
    expect(loadPinnedAngle("e1")).toBeUndefined();
    expect(() => clearPinnedAngle("e1")).not.toThrow();
  });
});
