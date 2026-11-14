export type Period = "year" | "semester" | "quarter" | "term" | "one-time" | null;
export type Src = { sourceUrl: string; sourceTitle: string };
export type DateText = { date?: string; text: string };

export type CostCategory = "tuition" | "fees" | "housing" | "food" | "books" | "personal" | "travel" | "health" | "other";

export interface StructuredUniversityContent {
  schemaVersion: 2;
  universityId: string;
  academicYear: string;
  entryCycle: string;
  verifiedAt: string;
  costItems: Array<Src & { label: string; category: CostCategory; amount: number | null; currency: string; period: Period; note?: string }>;
  totalCost?: Src & { label: string; amount: number; currency: string; period: Period; note?: string };
  scholarships: Array<Src & {
    name: string; type: "need-based" | "merit" | "other"; coverage: string;
    amount?: { min?: number; max?: number; currency: string; period: Period };
    internationalEligible: boolean | null; eligibility: string[]; howToApply: string[]; deadline?: DateText;
  }>;
  entryRequirements: Array<Src & { label: string; status: "required" | "recommended" | "optional" | "not-required"; detail: string; appliesTo: "all" | "international" }>;
  supplementary: Array<Src & { label: string; required: boolean; detail: string }>;
  applicationSteps: Array<Src & { order: number; title: string; detail: string; deadline?: DateText; url?: string }>;
  deadlines: Array<Src & { round: string; applicationDeadline?: DateText; decisionRelease?: DateText }>;
  officialLinks: Array<{ label: string; url: string }>;
}

const isStructured = (value: unknown, universityId: string): value is StructuredUniversityContent =>
  !!value && typeof value === "object" && (value as { schemaVersion?: unknown }).schemaVersion === 2 && (value as { universityId?: unknown }).universityId === universityId;

/** Structured content supplied by the API, when it ever does. */
export function apiStructuredContent(university: { id: string; structuredContent?: unknown }): StructuredUniversityContent | undefined {
  return isStructured(university.structuredContent, university.id) ? university.structuredContent : undefined;
}

// Pilot fixtures are only reachable when the build flag is on, so production bundles never include them.
const pilotLoaders: Record<string, () => Promise<unknown>> = import.meta.env.VITE_STRUCTURED_PILOT === "true"
  ? import.meta.glob("./pilot/structured/*.json", { import: "default" }) as Record<string, () => Promise<unknown>>
  : {};

export async function getStructuredContent(university: { id: string; structuredContent?: unknown }): Promise<StructuredUniversityContent | undefined> {
  const fromApi = apiStructuredContent(university);
  if (fromApi) return fromApi;
  const load = pilotLoaders[`./pilot/structured/${university.id}.json`];
  if (!load) return undefined;
  try { const data = await load(); return isStructured(data, university.id) ? data : undefined; } catch { return undefined; }
}

/* ---------- formatters ---------- */

const SYMBOLS: Record<string, string> = { USD: "US$", GBP: "£", EUR: "€" };
const PERIOD_LABEL: Record<Exclude<Period, null>, string> = { year: "year", semester: "semester", quarter: "quarter", term: "term", "one-time": "one-time" };

const money = (amount: number, currency: string) => { const code = currency.toUpperCase(); return `${SYMBOLS[code] ?? `${code} `}${amount.toLocaleString("en-US")}`; };
const periodSuffix = (period: Period) => (period ? (period === "one-time" ? " one-time" : ` / ${PERIOD_LABEL[period]}`) : "");

export function formatCostAmount(amount: number | null | undefined, currency: string, period: Period = null): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  return money(amount, currency) + periodSuffix(period);
}

export function formatAmountRange(range: { min?: number; max?: number; currency: string; period: Period } | undefined): string | undefined {
  if (!range) return undefined;
  const { min, max, currency, period } = range;
  if (typeof min === "number" && typeof max === "number" && min !== max) return `${money(min, currency)}–${max.toLocaleString("en-US")}${periodSuffix(period)}`;
  const single = typeof max === "number" ? max : min;
  return typeof single === "number" ? formatCostAmount(single, currency, period) : undefined;
}

export const formatDateText = (value: DateText | undefined): string | undefined => value?.text?.trim() || undefined;

export const COST_ORDER: CostCategory[] = ["tuition", "fees", "housing", "food", "books", "personal", "health", "travel", "other"];
export function sortedCostItems(items: StructuredUniversityContent["costItems"]) {
  return [...items].sort((a, b) => COST_ORDER.indexOf(a.category) - COST_ORDER.indexOf(b.category));
}

/** When every item cites the same source, one footer line replaces per-item links. */
export function sharedSource(items: readonly Src[]): Src | undefined {
  if (!items.length) return undefined;
  const first = items[0];
  return items.every((item) => item.sourceUrl === first.sourceUrl) ? { sourceUrl: first.sourceUrl, sourceTitle: first.sourceTitle } : undefined;
}

export const hasStructuredCosts = (content?: StructuredUniversityContent) => !!content && (content.costItems.length > 0 || content.scholarships.length > 0);

/* ---------- glance facts derived from structured content ---------- */

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const monthOf = (text: string) => MONTHS.findIndex((name) => new RegExp(`\\b${name.slice(0, 3)}[a-z]*\\b`, "i").test(text));
/** Orders dates inside one admissions cycle (Aug–Dec come before Jan–Jul). */
const cycleKey = (text: string) => { const month = monthOf(text); return month < 0 ? Number.NaN : (month >= 7 ? month - 7 : month + 5) * 100 + (parseInt(text.match(/\b(\d{1,2})\b/)?.[1] ?? "0", 10) || 0); };
const shortMonths = (text: string) => MONTHS.reduce((out, name) => out.replace(new RegExp(`\\b${name}\\b`, "gi"), name.slice(0, 3).replace(/^./, (c) => c.toUpperCase())), text);
const isAidRound = (round: string) => /financial aid|css profile|fafsa|\baid\b/i.test(round);

/** The applicant's final-chance deadline from structured rounds, with the early round noted when there is one. */
export function structuredDeadlineTile(content?: StructuredUniversityContent): { value: string; sub: string } | undefined {
  const rounds = (content?.deadlines ?? []).filter((row) => !isAidRound(row.round) && formatDateText(row.applicationDeadline));
  if (!rounds.length) return undefined;
  const keyed = rounds.map((row, index) => ({ row, key: cycleKey(formatDateText(row.applicationDeadline)!), index }));
  const final = keyed.reduce((best, item) => (Number.isFinite(item.key) && Number.isFinite(best.key) ? (item.key >= best.key ? item : best) : (item.index >= best.index ? item : best)));
  const early = keyed.find((item) => item !== final && /early/i.test(item.row.round));
  const text = formatDateText(final.row.applicationDeadline)!;
  return { value: text, sub: early ? `${final.row.round} · ${early.row.round} ${shortMonths(formatDateText(early.row.applicationDeadline)!)}` : final.row.round };
}

/** Tuition from structured cost items with its published period and academic year. */
export function structuredTuition(content?: StructuredUniversityContent): { value: string; period?: string; sub?: string } | undefined {
  const item = content?.costItems.find((row) => row.category === "tuition" && typeof row.amount === "number");
  if (!item) return undefined;
  const period = item.period && item.period !== "one-time" ? item.period : undefined;
  const value = formatCostAmount(item.amount, item.currency);
  const sub = [period ? `per ${period}` : "", content?.academicYear ?? ""].filter(Boolean).join(" · ") || undefined;
  return { value, period, sub };
}

export const deadlinesHaveYear = (content: StructuredUniversityContent) =>
  content.deadlines.some((row) => /\b20\d{2}\b/.test(`${formatDateText(row.applicationDeadline) ?? ""} ${formatDateText(row.decisionRelease) ?? ""}`));
