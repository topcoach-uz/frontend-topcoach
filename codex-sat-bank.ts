// Development-only file-backed API adapter. Production uses the backend SAT API.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type {
  SatQuestion,
  AggregateCount,
  SkillCount,
  ComposeMockTestBody,
  FilteredSatQuestions,
} from "./src/app/services/sat-prep/types";
export function loadLocalSatBank(
  root = resolve(process.cwd(), "../backend-topcoach/sat-bank"),
): SatQuestion[] {
  const notesPath = resolve(root, "topcoach/explanations.json");
  const notes: Record<string, string> = existsSync(notesPath)
    ? JSON.parse(readFileSync(notesPath, "utf8"))
    : {};
  if (
    !notes ||
    typeof notes !== "object" ||
    Array.isArray(notes) ||
    Object.values(notes).some((note) => typeof note !== "string")
  ) {
    throw new Error(
      "Invalid TopCoach explanations: expected question ID → HTML",
    );
  }
  return ["math", "reading-writing"].flatMap((section) =>
    readdirSync(resolve(root, section))
      .filter((f) => f.endsWith(".json"))
      .sort()
      .flatMap((file) => {
        const rows = JSON.parse(
          readFileSync(resolve(root, section, file), "utf8"),
        );
        if (!Array.isArray(rows)) throw new Error(`Invalid bank file: ${file}`);
        return rows.map((row) => ({
          ...row,
          id: `local-${row.id}`,
          questionId: row.id,
          skill: row.skill.trim(),
          domain: row.domain.trim(),
          rationaleHtml: notes[row.id]
            ? `${row.rationaleHtml}\n<section><h3>TopCoach walkthrough</h3>${notes[row.id]}</section>`
            : row.rationaleHtml,
        }));
      }),
  );
}
export const localSatBank = loadLocalSatBank();
function counts<T>(keys: string[]): T[] {
  const groups = new Map<string, Record<string, string | number>>();
  for (const q of localSatBank) {
    const values = keys.map((key) => String(q[key as keyof SatQuestion]));
    const id = JSON.stringify(values);
    const group = groups.get(id);
    if (group) group.count = Number(group.count) + 1;
    else
      groups.set(id, {
        ...Object.fromEntries(keys.map((k, i) => [k, values[i]])),
        count: 1,
      });
  }
  return Array.from(groups.values()) as T[];
}
export const localAggregateCounts = counts<AggregateCount>([
  "section",
  "domain",
  "difficulty",
]);
export const localSkillCounts = counts<SkillCount>([
  "section",
  "domain",
  "skill",
  "skillCode",
  "difficulty",
]);
function shuffle<T>(items: T[], random: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
const csv = (value: string | null) =>
  value
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];
export function filterLocalBank(params: URLSearchParams): FilteredSatQuestions {
  let items = localSatBank.filter((q) =>
    ["section", "domain", "skill", "difficulty", "questionType"].every(
      (key) => {
        const values = csv(params.get(key));
        return (
          !values.length ||
          values.includes(String(q[key as keyof SatQuestion])) ||
          (key === "skill" && params.get(key) === q.skill)
        );
      },
    ),
  );
  const excludes = csv(params.get("excludeIds"));
  items = items.filter(
    (q) => !excludes.includes(q.id) && !excludes.includes(q.questionId),
  );
  if (params.get("order") === "random") items = shuffle(items, Math.random);
  else if (params.get("order") === "difficulty") {
    const rank = { easy: 0, medium: 1, hard: 2 };
    items.sort((a, b) => rank[a.difficulty] - rank[b.difficulty]);
  }
  const limit = Math.min(200, Math.max(1, Number(params.get("limit")) || 20));
  const offset = Math.max(0, Number(params.get("offset")) || 0);
  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    limit,
    offset,
  };
}
export function composeLocalMock(body: ComposeMockTestBody): SatQuestion[] {
  let seed = (body.seed ?? Math.floor(Math.random() * 4294967296)) >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pool = localSatBank
    .filter(
      (q) =>
        q.section === body.section &&
        (!body.domains?.length || body.domains.includes(q.domain)) &&
        !body.excludeIds?.includes(q.questionId),
    )
    .sort((a, b) => a.questionId.localeCompare(b.questionId));
  const total = Math.min(200, Math.max(1, Number(body.totalQuestions) || 10));
  const d = { easy: 0.25, medium: 0.5, hard: 0.25, ...body.distribution };
  const sum = d.easy + d.medium + d.hard || 1;
  const easy = Math.round((d.easy / sum) * total),
    medium = Math.round((d.medium / sum) * total);
  const quotas = { easy, medium, hard: Math.max(0, total - easy - medium) };
  let result = (["easy", "medium", "hard"] as const).flatMap((level) =>
    shuffle(
      pool.filter((q) => q.difficulty === level),
      random,
    ).slice(0, quotas[level]),
  );
  const used = new Set(result.map((q) => q.id));
  result = result.concat(
    shuffle(
      pool.filter((q) => !used.has(q.id)),
      random,
    ).slice(0, Math.max(0, total - result.length)),
  );
  return shuffle(result, random).slice(0, total);
}
