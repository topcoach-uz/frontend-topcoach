// Filters the static IELTS book list down to what actually has content, using
// GET ielts-content/catalog. Without catalog data (loading, 404, network error)
// everything is returned unchanged, which is the pre-catalog behaviour.
import { skills as allSkills } from "./model.js";

// Speaking falls back to standalone topics server-side, so it is available for
// any test that has at least one other skill even if the catalog omits it.
const withSpeaking = (list) => {
  if (!Array.isArray(list)) return [];
  const core = list.filter((s) => ["listening", "reading", "writing"].includes(s));
  return core.length ? [...core, "speaking"] : [];
};

const hasCatalog = (catalog, type) =>
  !!catalog &&
  typeof catalog === "object" &&
  !!catalog.types &&
  typeof catalog.types === "object" &&
  !!catalog.types[type] &&
  typeof catalog.types[type] === "object";

/**
 * Returns [{ book, tests: [{ test, skills }] }] in `books` order.
 * `trackable` limits skills (General Training only has reading).
 */
export function availableLibrary(type, books, testCountFn, catalog, trackable = allSkills) {
  const known = hasCatalog(catalog, type);
  const typeData = known ? catalog.types[type] : null;
  const out = [];
  for (const book of books) {
    const count = testCountFn(type, book);
    const tests = [];
    for (let test = 1; test <= count; test++) {
      if (!known) {
        tests.push({ test, skills: [...trackable] });
        continue;
      }
      const list = withSpeaking(typeData[String(book)]?.[String(test)]);
      const skills = trackable.filter((s) => list.includes(s));
      if (skills.length) tests.push({ test, skills });
    }
    if (tests.length) out.push({ book, tests });
  }
  return out;
}

/** Book ids that have at least one available test, in `books` order. */
export function availableBooks(type, books, testCountFn, catalog, trackable) {
  return availableLibrary(type, books, testCountFn, catalog, trackable).map((g) => g.book);
}

/** Whether one skill of one test is available (true when catalog unknown). */
export function isSkillAvailable(type, book, test, skill, catalog) {
  if (!hasCatalog(catalog, type)) return true;
  const list = withSpeaking(catalog.types[type]?.[String(book)]?.[String(test)]);
  return list.includes(skill);
}

export function isTestAvailable(type, book, test, catalog, trackable = allSkills) {
  return trackable.some((s) => isSkillAvailable(type, book, test, s, catalog));
}

/** Next available test after `r` (same book first, then following books). */
export function nextAvailableTest(r, books, testCountFn, catalog, trackable) {
  const idx = books.findIndex((b) => String(b) === String(r.book));
  const start = idx >= 0 ? idx : -1;
  for (let i = Math.max(start, 0); i < books.length; i++) {
    const book = books[i];
    const count = testCountFn(r.type, book);
    const from = i === start ? Number(r.test) + 1 : 1;
    for (let test = from; test <= count; test++) {
      if (isTestAvailable(r.type, book, test, catalog, trackable))
        return { type: r.type, book: String(book), test };
    }
  }
  return null;
}
