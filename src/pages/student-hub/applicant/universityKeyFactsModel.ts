import type { UniversitiesSchema } from "src/app/api/Api";

type Translatable = Parameters<typeof String>[0];
export type Translate = (value: Translatable) => string;

export interface KeyFactLink { label: string; url: string }
export interface KeyFactLine { text: string; note?: string; link?: KeyFactLink }
export interface KeyFactRow { id: string; label: string; note?: string; lines?: KeyFactLine[]; chips?: string[]; links?: KeyFactLink[] }

const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function safeHttpUrl(value: unknown): string | undefined {
  const text = clean(value);
  if (!text) return;
  try { const url = new URL(text); return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined; } catch { return; }
}

export function linkHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

export function formatFactDate(value: unknown): string {
  const text = clean(value);
  if (!text) return "";
  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function formatMoney(symbol: unknown, amount: unknown, currencyName?: unknown): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "";
  const sym = clean(symbol);
  const isUsd = sym === "US$" || (sym === "$" && /\b(usd|us dollars?|united states)\b/i.test(clean(currencyName)));
  return `${isUsd ? "US$" : sym}${amount.toLocaleString("en-US")}`;
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const monthIndex = (name: string) => MONTHS.findIndex((m) => m.startsWith(name.toLowerCase().slice(0, 3)));

/** Dates written with an explicit year, e.g. "November 1, 2025" or "1 November 2025". */
export function parseDatesWithYear(text: string): Date[] {
  const found: Date[] = [];
  const mdy = new RegExp(`\\b${MONTH_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(20\\d{2})\\b`, "gi");
  const dmy = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH_RE}\\.?,?\\s+(20\\d{2})\\b`, "gi");
  for (const m of text.matchAll(mdy)) found.push(new Date(Date.UTC(+m[3], monthIndex(m[1]), +m[2])));
  for (const m of text.matchAll(dmy)) found.push(new Date(Date.UTC(+m[3], monthIndex(m[2]), +m[1])));
  return found.filter((d) => Number.isFinite(d.getTime()));
}

export function hasMonthDay(text: string): boolean {
  return new RegExp(`\\b${MONTH_RE}\\.?\\s+\\d{1,2}\\b|\\b\\d{1,2}(?:st|nd|rd|th)?\\s+${MONTH_RE}\\b`, "i").test(text);
}

/** Drops a "Graduate…" paragraph (from a line starting with Graduate to the next blank line or the end). */
export function stripGraduateParagraph(text: string): string {
  const out: string[] = [];
  let skipping = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*graduate\b/i.test(line)) { skipping = true; continue; }
    if (skipping) { if (!line.trim()) skipping = false; continue; }
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function cleanExamName(name: string): string {
  return name.replace(/\(\s*for\s+undergraduates?[^)]*\)/gi, "").replace(/([A-Za-z])\(/g, "$1 (").replace(/\s+/g, " ").trim();
}

export const isGraduateOnlyExam = (name: string) => /\b(graduate|gmat|gre)\b/i.test(cleanExamName(name));

/** Text inside trailing parentheses ("… (MIT)") else the full name. */
export function shortUniversityName(name: string): string {
  const match = name.match(/\(([^()]+)\)\s*$/);
  return match?.[1].trim() || name;
}


export function humanizeKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim().toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function humanizeFactValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(humanizeFactValue).filter(Boolean).join(", ");
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([k, v]) => { const text = humanizeFactValue(v); return text ? `${humanizeKey(k)}: ${text}` : ""; }).filter(Boolean).join("; ");
  return String(value).trim();
}

export function humanizeFacts(facts: Record<string, unknown> | null | undefined): string {
  if (!facts) return "";
  return Object.entries(facts).map(([key, value]) => { const text = humanizeFactValue(value); return text ? `${humanizeKey(key)}: ${text}` : ""; }).filter(Boolean).join(" · ");
}

export interface KeyFactOptions { now?: Date }

export function buildKeyFactRows(university: Partial<UniversitiesSchema>, tr: Translate, options: KeyFactOptions = {}): KeyFactRow[] {
  const rows: KeyFactRow[] = [];
  const now = options.now ?? new Date();

  const current: KeyFactLine[] = [];
  const past: KeyFactLine[] = [];
  for (const item of university.deadlines ?? []) {
    const name = stripGraduateParagraph(tr(item?.name as Translatable).trim());
    const date = formatFactDate(item?.date);
    if (!name && !date) continue;
    let dates = parseDatesWithYear(name);
    if (!dates.length && name && hasMonthDay(name) && date) dates = [new Date(String(item?.date))];
    const stale = dates.length > 0 && dates.every((d) => d.getTime() < now.getTime());
    const year = date.slice(-4);
    const line: KeyFactLine = name && date && !name.includes(year) && !dates.length ? { text: name, note: date } : { text: name || date };
    (stale ? past : current).push(line);
  }
  if (current.length) rows.push({ id: "deadlines", label: "Application deadlines", lines: current });
  if (past.length) rows.push({ id: "deadlines-past", label: "Last cycle's deadlines", note: "Check the official site for this year's dates.", lines: past });

  const tuition = (university.tuitionFees ?? []).map((fee): KeyFactLine | undefined => {
    const currency = fee?.currency as { symbol?: string; name?: string } | undefined;
    const text = formatMoney(currency?.symbol, fee?.fee, currency?.name);
    return text ? { text } : undefined;
  }).filter((x): x is KeyFactLine => !!x);
  if (tuition.length) rows.push({ id: "tuition", label: "Tuition & fees", lines: tuition });

  const appFees = (university.applicationFees ?? []).map((fee): KeyFactLine | undefined => {
    const text = formatMoney(fee?.currency?.symbol, fee?.fee, fee?.currency?.name);
    return text ? { text } : undefined;
  }).filter((x): x is KeyFactLine => !!x);
  if (appFees.length) rows.push({ id: "application-fee", label: "Application fee", lines: appFees });

  const rates = (university.acceptanceRates ?? []).filter((r) => typeof r?.rate === "number" && Number.isFinite(r.rate))
    .map((r): KeyFactLine => ({ text: `${r.rate}%` }));
  if (rates.length) rows.push({ id: "acceptance", label: "Acceptance rate", lines: rates });

  const exams = [...new Set((university.requiredExams ?? []).map((e) => clean(e?.certification?.name)).filter(Boolean).filter((n) => !isGraduateOnlyExam(n)).map(cleanExamName).filter(Boolean))];
  if (exams.length) rows.push({ id: "exams", label: "Required exams", chips: exams });

  return rows;
}

export interface GlanceTile { id: string; label: string; value: string; sub?: string }

const MONEY_RE = /(?:US\$|A\$|C\$|\$|£|€|CHF\s?)\s?\d[\d,]*(?:\.\d+)?/;

/** First money amount after the word "tuition", plus the "per year · 2026–27" sub-line when a year range appears. */
export function extractTuition(text: string): { value: string; sub?: string } | undefined {
  const index = text.search(/tuition/i);
  if (index < 0) return;
  const match = text.slice(index).match(MONEY_RE);
  if (!match) return;
  const range = text.match(/\b(20\d{2})\s*[–-]\s*(\d{2}|20\d{2})\b/);
  const value = match[0].replace(/^\$/, "US$").replace(/\s+/g, "");
  return { value, sub: range ? `per year · ${range[1]}–${range[2].slice(-2)}` : undefined };
}

/** Conservative: only true when the text clearly says full/100% of (demonstrated/financial) need is met. */
export function meetsFullNeed(text: string): boolean {
  if (/\b(?:not|no|never|doesn'?t|does not)\b[^.]{0,40}(?:full|100\s?%)/i.test(text)) return false;
  return /\bmeets?\s+(?:the\s+)?(?:100\s?%|full)\s+(?:of\s+)?(?:(?:a\s+student'?s\s+|your\s+)?(?:demonstrated|financial)\s+)*need/i.test(text)
    || /\bfull(?:y)?\s+demonstrated\s+(?:financial\s+)?need/i.test(text)
    || /\b100\s?%\s+of\s+(?:(?:a\s+student'?s\s+|your\s+)?(?:demonstrated|financial)\s+)*need/i.test(text);
}

export function buildGlanceTiles(rows: readonly KeyFactRow[], finance?: { feesSummary: string; fundingSummary: string; fundingPolicyNote?: string } | null): GlanceTile[] {
  const first = (id: string) => rows.find((r) => r.id === id)?.lines?.[0]?.text;
  const tiles: GlanceTile[] = [];
  const rate = first("acceptance");
  if (rate) tiles.push({ id: "acceptance", label: "Acceptance rate", value: rate });
  const verified = finance ? extractTuition(finance.feesSummary) : undefined;
  const cms = first("tuition");
  if (verified) tiles.push({ id: "tuition", label: "Tuition", value: verified.value, sub: verified.sub });
  else if (cms) tiles.push({ id: "tuition", label: "Tuition", value: cms });
  const fee = first("application-fee");
  if (fee) tiles.push({ id: "application-fee", label: "Application fee", value: fee });
  if (finance && meetsFullNeed([finance.fundingSummary, finance.fundingPolicyNote].filter(Boolean).join(" "))) tiles.push({ id: "aid", label: "Financial aid", value: "Meets 100% of need" });
  return tiles;
}

/** Legacy CMS scholarship text with the "Official Website:" label line removed; used only when there is no verified finance. */
export function buildScholarshipText(university: Partial<UniversitiesSchema>, tr: Translate): { text: string; url?: string } | undefined {
  const parts: string[] = [];
  let url: string | undefined;
  for (const s of university.scholarships ?? []) {
    const link = safeHttpUrl(s?.url);
    let name = tr(s?.name as Translatable).trim();
    if (link) name = name.split(/\r?\n/).filter((l) => !/^\s*official\s+web\s*site\s*:?\s*(https?:\/\/\S+)?\s*$/i.test(l) && l.trim() !== link).join("\n").trim();
    if (name) parts.push(name);
    url = url ?? link;
  }
  return parts.length ? { text: parts.join("\n\n"), url } : undefined;
}
