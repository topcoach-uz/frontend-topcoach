import { describe, expect, test } from "vitest";
import {
  loadEntries,
  skillProgress,
  testProgress,
  normalizeRecent,
  pushRecent,
  setMarker,
  unfinishedPractices,
} from "./progress.js";
import {
  overallBand,
  writingBand,
  latestWritingBand,
  recordResult,
  resultDelta,
  nextTest,
  roundHalf,
  speakingStatus,
} from "./scores.js";
import { booksFor, testCount } from "./model.js";

const r = { type: "academic", book: "21", test: 1 };
const answers = (n) => JSON.stringify(Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, "x"])));
const entries = (obj) => Object.entries(obj);

describe("skillProgress", () => {
  test("counts answered questions across the most complete release", () => {
    const e = entries({
      "workspace:academic:21:1:reading:library:a": answers(3),
      "workspace:academic:21:1:reading:library:b": answers(14),
      "workspace:academic:21:1:reading:library:b:highlights:1": JSON.stringify(["k1", "k2", "k3", "k4", "k5", "k6"]),
      "workspace:academic:21:2:reading:library:a": answers(40),
    });
    expect(skillProgress(e, {}, r, "reading")).toMatchObject({ state: "in-progress", answered: 14, total: 40 });
  });
  test("ignores blank answers and other tests, marks 40 as done", () => {
    const blank = { 1: "  ", 2: "" };
    expect(skillProgress(entries({ "workspace:academic:21:1:listening": JSON.stringify(blank) }), {}, r, "listening").state).toBe("not-started");
    expect(skillProgress(entries({ "workspace:academic:21:1:listening": answers(40) }), {}, r, "listening").state).toBe("done");
  });
  test("writing counts drafted tasks", () => {
    const e = entries({ "workspace:academic:21:1:writing:library:z:essay:1": JSON.stringify("Hello"), "workspace:academic:21:1:writing:library:z:essay:2": JSON.stringify(" ") });
    expect(skillProgress(e, {}, r, "writing")).toMatchObject({ state: "in-progress", answered: 1, total: 2 });
    e.push(["workspace:academic:21:1:writing:library:z:essay:2", JSON.stringify("More")]);
    expect(skillProgress(e, {}, r, "writing").state).toBe("done");
  });
  test("speaking comes from markers only", () => {
    expect(skillProgress([], {}, r, "speaking").state).toBe("not-started");
    const started = setMarker({}, r, "speaking", "started");
    expect(skillProgress([], started, r, "speaking").state).toBe("in-progress");
    expect(skillProgress([], setMarker(started, r, "speaking", "done"), r, "speaking").state).toBe("done");
  });
  test("a done marker is never downgraded", () => {
    const done = setMarker({}, r, "speaking", "done");
    expect(setMarker(done, r, "speaking", "started")).toBe(done);
  });
});

test("testProgress reports N of 4 skills done", () => {
  const e = entries({ "workspace:academic:21:1:reading": answers(40), "workspace:academic:21:1:listening": answers(5) });
  const p = testProgress(e, {}, r);
  expect(p.done).toBe(1);
  expect(p.total).toBe(4);
  expect(p.skills.listening.state).toBe("in-progress");
});

test("loadEntries strips the user prefix and survives broken storage", () => {
  const store = { a: "1", "p:workspace:x": "2", "other:workspace:x": "3" };
  const storage = { length: 3, key: (i) => Object.keys(store)[i], getItem: (k) => store[k] };
  expect(loadEntries(storage, "p:")).toEqual([["workspace:x", "2"]]);
  expect(loadEntries({ get length() { throw new Error("no"); } }, "p:")).toEqual([]);
});

describe("recent list", () => {
  const path = "/ielts/practice/academic/21/1/reading/2";
  test("legacy single value still works", () => {
    const list = normalizeRecent(null, { path, title: "t" });
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ book: "21", test: 1, skill: "reading", part: 2 });
  });
  test("pushRecent dedupes per test/skill and caps", () => {
    const a = { type: "academic", book: "21", test: 1, skill: "reading", path };
    const b = { ...a, skill: "writing" };
    expect(pushRecent([a, b], { ...a, part: 3 }).map((x) => x.skill)).toEqual(["reading", "writing"]);
    expect(pushRecent(Array.from({ length: 9 }, (_, i) => ({ ...a, test: i + 1 })), { ...a, test: 99 }, 6)).toHaveLength(6);
  });
  test("unfinishedPractices lists only in-progress with counts", () => {
    const recent = normalizeRecent([{ path, title: "t" }, { path: "/ielts/practice/academic/21/2/listening/1", title: "u" }]);
    const e = entries({ "workspace:academic:21:1:reading": answers(14), "workspace:academic:21:2:listening": answers(40) });
    const out = unfinishedPractices(e, {}, recent, 3);
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe("Reading · Book 21 Test 1 · 14/40 answered");
  });
});

describe("scores", () => {
  test("overall rounds to nearest half and needs all four skills", () => {
    expect(overallBand({ listening: 7, reading: 6.5, writing: 6, speaking: 6.5 }).value).toBe(6.5);
    expect(overallBand({ listening: 7, reading: 6.5, writing: 6, speaking: 6 }).value).toBe(6.5);
    const partial = overallBand({ listening: 7, reading: 6.5, writing: null });
    expect(partial.value).toBeNull();
    expect(partial.missing).toEqual(["writing", "speaking"]);
    expect(roundHalf(6.25)).toBe(6.5);
    expect(roundHalf(6.75)).toBe(7);
  });
  test("writing band weights task 2 double and needs both tasks", () => {
    expect(writingBand(6, 7)).toBe(6.5);
    expect(writingBand(6, null)).toBeNull();
  });
  test("latestWritingBand picks the newest assessed band", () => {
    const rows = [
      { state: "assessed", createdAt: "2026-01-01", feedback: { estimatedBand: 5 } },
      { state: "assessed", createdAt: "2026-02-01", feedback: { estimatedBand: 6.5 } },
      { state: "failed", createdAt: "2026-03-01", feedback: { estimatedBand: 9 } },
      { state: "assessed", createdAt: "2026-04-01", feedback: { estimatedBand: null } },
    ];
    expect(latestWritingBand(rows)).toBe(6.5);
    expect(latestWritingBand([])).toBeNull();
  });
  test("speaking status is qualitative", () => {
    expect(speakingStatus("done")).toBe("Completed");
    expect(speakingStatus(undefined)).toBe("Not started");
  });
  test("recordResult keeps the previous attempt only when the outcome changes", () => {
    const first = { correct: 20, answered: 40, total: 40, band: 5.5 };
    const s1 = recordResult(null, first);
    expect(recordResult(s1, first)).toBe(s1);
    const s2 = recordResult(s1, { ...first, correct: 26, band: 6.5 });
    expect(resultDelta(s2)).toEqual({ correct: 6, band: 1 });
    expect(resultDelta(s1)).toBeNull();
  });
  test("nextTest moves within a book, then to the next book", () => {
    const books = booksFor("academic");
    expect(nextTest({ type: "academic", book: "21", test: 2 }, books, testCount)).toEqual({ type: "academic", book: "21", test: 3, });
    expect(nextTest({ type: "academic", book: "21", test: 4 }, books, testCount)).toEqual({ type: "academic", book: "20", test: 1 });
    expect(nextTest({ type: "academic", book: "og", test: 8 }, books, testCount)).toBeNull();
    expect(nextTest({ type: "general-training", book: "10", test: 2 }, booksFor("general-training"), testCount)).toBeNull();
  });
});
