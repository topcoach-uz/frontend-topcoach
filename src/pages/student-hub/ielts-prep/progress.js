// Pure helpers that derive "how far along is this practice" from what the
// workspace already keeps in localStorage. Nothing here touches the DOM.
//
// Storage shapes this reads (all under the per-user prefix, see routes.ts):
//   reading / listening answers  workspace:<type>:<book>:<test>:<skill>[:library:<release>]
//                                = { "<question number>": "<answer>" }
//   writing drafts               workspace:<type>:<book>:<test>:writing:library:<release>:essay:<part>
//                                = "<essay text>"
//   speaking                     keyed by topic id only (no test in the key), so it is
//                                tracked through workspace:progress markers instead.
//   workspace:progress           = { "<type>:<book>:<test>:<skill>": { state, at } }
//   workspace:recent             = [ { type, book, test, skill, part, path, title, at } ]
import { hasAnswer, route, skills } from "./model.js";

export const QUESTION_TOTAL = 40;
export const WRITING_TASKS = 2;
export const MAX_RECENT = 6;

export const STATE_LABEL = {
  "not-started": "Not started",
  "in-progress": "In progress",
  done: "Done",
};

const SUBKEY = /:(annotations|highlights|essay|versions|savedAt|transcript)(:|$)/;

function parse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const base = (r, skill) => `workspace:${r.type}:${r.book}:${r.test}:${skill}`;
export const markerKey = (r, skill = r.skill) => `${r.type}:${r.book}:${r.test}:${skill}`;

/** One pass over storage; values stay raw strings until a skill needs them. */
export function loadEntries(storage, prefix) {
  const entries = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix))
        entries.push([key.slice(prefix.length), storage.getItem(key)]);
    }
  } catch {
    /* storage unavailable (private mode, SSR) */
  }
  return entries;
}

export function answeredCount(answers) {
  if (!answers || typeof answers !== "object") return 0;
  return Object.values(answers).filter(hasAnswer).length;
}

function marker(markers, r, skill) {
  return markers?.[markerKey(r, skill)]?.state || null;
}

/** { state, answered, total, unit } for one skill of one test. */
export function skillProgress(entries, markers, r, skill) {
  const mark = marker(markers, r, skill);
  if (skill === "reading" || skill === "listening") {
    const re = new RegExp(`^${escape(base(r, skill))}(?::library:.+)?$`);
    let answered = 0;
    for (const [key, raw] of entries)
      if (re.test(key) && !SUBKEY.test(key))
        answered = Math.max(answered, answeredCount(parse(raw)));
    const state =
      answered >= QUESTION_TOTAL || mark === "done"
        ? "done"
        : answered > 0 || mark === "started"
          ? "in-progress"
          : "not-started";
    return { state, answered, total: QUESTION_TOTAL, unit: "answered" };
  }
  if (skill === "writing") {
    const re = new RegExp(`^${escape(base(r, skill))}(?::library:.+)?:essay:([1-9])$`);
    const parts = new Set();
    for (const [key, raw] of entries) {
      const m = re.exec(key);
      const text = m && parse(raw);
      if (typeof text === "string" && text.trim()) parts.add(m[1]);
    }
    const answered = Math.min(parts.size, WRITING_TASKS);
    const state =
      answered >= WRITING_TASKS || mark === "done"
        ? "done"
        : answered > 0 || mark === "started"
          ? "in-progress"
          : "not-started";
    return { state, answered, total: WRITING_TASKS, unit: "tasks drafted" };
  }
  const state =
    mark === "done" ? "done" : mark === "started" ? "in-progress" : "not-started";
  return { state, answered: state === "done" ? 1 : 0, total: 1, unit: "recorded" };
}

/** Every skill of a test plus a "N of 4 skills done" count. */
export function testProgress(entries, markers, r, skillList = skills) {
  const bySkill = {};
  for (const skill of skillList) bySkill[skill] = skillProgress(entries, markers, r, skill);
  const done = skillList.filter((s) => bySkill[s].state === "done").length;
  return { skills: bySkill, done, total: skillList.length };
}

/** Accepts the legacy single { path, title } value or the new list. */
export function normalizeRecent(raw, legacyLast = null) {
  const list = Array.isArray(raw) ? raw : [];
  const out = [];
  for (const item of list.length ? list : legacyLast ? [legacyLast] : []) {
    const r = item && typeof item.path === "string" ? route(item.path) : null;
    if (r) out.push({ ...item, ...r });
  }
  return out.slice(0, MAX_RECENT);
}

export function pushRecent(list, entry, max = MAX_RECENT) {
  const same = (a, b) =>
    a.type === b.type && a.book === b.book && a.test === b.test && a.skill === b.skill;
  return [entry, ...(Array.isArray(list) ? list : []).filter((x) => !same(x, entry))].slice(0, max);
}

export function setMarker(markers, r, skill, state) {
  const key = markerKey(r, skill);
  const old = markers?.[key]?.state;
  if (old === "done" && state !== "done") return markers || {};
  if (old === state) return markers || {};
  return { ...(markers || {}), [key]: { state, at: new Date().toISOString() } };
}

const SKILL_NAME = (s) => s[0].toUpperCase() + s.slice(1);
export const bookName = (book) =>
  book === "og" ? "Official Guide" : book === "eg" ? "Exam Essentials" : `Book ${book}`;

/** Up to `limit` unfinished practices, newest first, ready to render. */
export function unfinishedPractices(entries, markers, recent, limit = 3) {
  const out = [];
  for (const item of recent) {
    const p = skillProgress(entries, markers, item, item.skill);
    if (p.state !== "in-progress") continue;
    const detail =
      p.answered > 0 ? `${p.answered}/${p.total} ${p.unit}` : "Started";
    out.push({
      path: item.path,
      label: `${SKILL_NAME(item.skill)} · ${bookName(item.book)} Test ${item.test} · ${detail}`,
      skill: item.skill,
    });
    if (out.length >= limit) break;
  }
  return out;
}
