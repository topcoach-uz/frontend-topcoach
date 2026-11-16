import { describe, expect, test } from "vitest";
import {
  availableLibrary,
  availableBooks,
  isSkillAvailable,
  nextAvailableTest,
} from "./catalog.js";
import { booksFor, testCount } from "./model.js";

const catalog = {
  types: {
    academic: {
      21: { 1: ["listening", "reading"], 2: ["writing"] },
      20: { 3: ["speaking"] },
      19: { 1: ["writing"] },
      og: { 1: ["reading", "bogus"] },
    },
    "general-training": { 21: { 1: ["reading", "listening"] } },
  },
};

describe("availableLibrary", () => {
  test("falls back to everything without catalog", () => {
    const lib = availableLibrary("academic", booksFor("academic"), testCount, undefined);
    expect(lib).toHaveLength(booksFor("academic").length);
    expect(lib[0].tests[0].skills).toHaveLength(4);
    expect(availableLibrary("academic", [21], testCount, { foo: 1 })[0].tests).toHaveLength(4);
  });
  test("omits empty books/tests and unavailable skills", () => {
    const lib = availableLibrary("academic", booksFor("academic"), testCount, catalog);
    expect(lib.map((g) => g.book)).toEqual([21, 19, "og"]);
    expect(lib[0].tests).toEqual([
      { test: 1, skills: ["listening", "reading", "speaking"] },
      { test: 2, skills: ["writing", "speaking"] },
    ]);
    expect(lib[2].tests).toEqual([{ test: 1, skills: ["reading", "speaking"] }]);
    expect(lib[1].tests).toEqual([{ test: 1, skills: ["writing", "speaking"] }]);
  });
  test("general training only tracks reading", () => {
    const lib = availableLibrary("general-training", booksFor("general-training"), testCount, catalog, ["reading"]);
    expect(lib).toEqual([{ book: 21, tests: [{ test: 1, skills: ["reading"] }] }]);
  });
  test("availableBooks gives newest available book", () => {
    expect(availableBooks("academic", booksFor("academic"), testCount, catalog)[0]).toBe(21);
    expect(availableBooks("academic", booksFor("academic"), testCount, { types: { academic: { 19: { 1: ["reading"] } } } })[0]).toBe(19);
  });
});

describe("availability", () => {
  test("isSkillAvailable", () => {
    expect(isSkillAvailable("academic", 21, 1, "reading", catalog)).toBe(true);
    expect(isSkillAvailable("academic", 21, 1, "speaking", catalog)).toBe(true);
    expect(isSkillAvailable("academic", 20, 3, "speaking", catalog)).toBe(false);
    expect(isSkillAvailable("academic", 21, 1, "writing", undefined)).toBe(true);
  });
  test("nextAvailableTest skips gaps", () => {
    const books = booksFor("academic");
    expect(nextAvailableTest({ type: "academic", book: "21", test: 1 }, books, testCount, catalog)).toEqual({ type: "academic", book: "21", test: 2 });
    expect(nextAvailableTest({ type: "academic", book: "21", test: 2 }, books, testCount, catalog)).toEqual({ type: "academic", book: "19", test: 1 });
    expect(nextAvailableTest({ type: "academic", book: "og", test: 1 }, books, testCount, catalog)).toBeNull();
    expect(nextAvailableTest({ type: "academic", book: "21", test: 1 }, books, testCount, undefined)).toEqual({ type: "academic", book: "21", test: 2 });
  });
});
