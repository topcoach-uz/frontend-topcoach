import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANGLES_UNAVAILABLE,
  documentSelectionChanged,
  documentsSelectionLabel,
  documentsSummary,
  isCoachSupportedDocument,
  loadDocumentSelection,
  sanitiseDocumentSelection,
  saveDocumentSelection,
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

describe("coach documents", () => {
  it("classifies support", () => {
    expect(isCoachSupportedDocument({ mimeType: "application/pdf", fileSize: 100 })).toEqual({ supported: true });
    expect(isCoachSupportedDocument({ mimeType: "application/pdf", fileSize: 9 * 1024 * 1024 }).reason).toBe("Larger than 8 MB");
    expect(isCoachSupportedDocument({ mimeType: "application/msword" }).reason).toMatch(/PDF/);
    expect(isCoachSupportedDocument({ mimeType: "application/zip" }).reason).toBe("Not supported");
    expect(isCoachSupportedDocument({}).supported).toBe(false);
  });
  it("sanitises selection", () => {
    expect(sanitiseDocumentSelection(["a", "a", "gone", "b", 3], ["a", "b"])).toEqual(["a", "b"]);
    expect(sanitiseDocumentSelection("x", ["a"])).toEqual([]);
    expect(sanitiseDocumentSelection(["1", "2", "3", "4", "5", "6"], ["1", "2", "3", "4", "5", "6"])).toHaveLength(5);
  });
  it("persists selection and survives throwing storage", () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) });
    saveDocumentSelection("u1", ["a", "b"]);
    expect(loadDocumentSelection("u1")).toEqual(["a", "b"]);
    expect(loadDocumentSelection("u2")).toEqual([]);
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); } });
    expect(loadDocumentSelection("u1")).toEqual([]);
    expect(() => saveDocumentSelection("u1", ["a"])).not.toThrow();
    vi.unstubAllGlobals();
  });
  it("formats summaries", () => {
    expect(documentsSelectionLabel(0)).toBe("Documents: none selected");
    expect(documentsSelectionLabel(2)).toBe("Documents: 2 selected");
    expect(documentsSummary(undefined)).toBe("");
    expect(
      documentsSummary([
        { id: "1", name: "CV.pdf", used: true },
        { id: "2", name: "essay.docx", used: false, reason: "Word files aren't supported yet" },
      ]),
    ).toBe("Read: CV.pdf · Skipped: essay.docx (Word files aren't supported yet)");
  });
  it("detects selection change", () => {
    expect(documentSelectionChanged([], undefined)).toBe(false);
    expect(documentSelectionChanged(["a"], undefined)).toBe(true);
    expect(documentSelectionChanged(["a"], [{ id: "a", name: "A", used: true }])).toBe(false);
    expect(documentSelectionChanged([], [{ id: "a", name: "A", used: true }])).toBe(true);
  });
});
