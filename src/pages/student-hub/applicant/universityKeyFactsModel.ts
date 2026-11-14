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

const urlKey = (url: string) => { try { const u = new URL(url); return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}${u.search}`.toLowerCase(); } catch { return url; } };

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

export interface KeyFactOptions { hasVerifiedFinance?: boolean; now?: Date }

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

  const tuition = options.hasVerifiedFinance ? [] : (university.tuitionFees ?? []).map((fee): KeyFactLine | undefined => {
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

  const seenUrls = new Set<string>();
  const scholarshipHosts = new Set<string>();
  const scholarships = (university.scholarships ?? []).map((s): KeyFactLine | undefined => {
    const url = safeHttpUrl(s?.url);
    let name = tr(s?.name as Translatable).trim();
    if (url) name = name.split(/\r?\n/).filter((l) => !/^\s*official\s+web\s*site\s*:?\s*(https?:\/\/\S+)?\s*$/i.test(l) && l.trim() !== url).join("\n").trim();
    if (!name && !url) return;
    if (url) { if (seenUrls.has(urlKey(url))) return { text: name }; seenUrls.add(urlKey(url)); scholarshipHosts.add(linkHost(url)); }
    return name || url ? { text: name || linkHost(url as string), link: url ? { label: "Official page", url } : undefined } : undefined;
  }).filter((x): x is KeyFactLine => !!x && !!x.text);
  if (scholarships.length) rows.push({ id: "scholarships", label: "Scholarships", lines: scholarships });

  const links = (university.links ?? []).map((l): KeyFactLink | undefined => {
    const url = safeHttpUrl(l?.url);
    if (!url || seenUrls.has(urlKey(url))) return;
    const label = clean(l?.name) || linkHost(url);
    if (/official\s*web\s*site/i.test(label) && scholarshipHosts.has(linkHost(url))) return;
    seenUrls.add(urlKey(url));
    return { label, url };
  }).filter((x): x is KeyFactLink => !!x);
  if (links.length) rows.push({ id: "links", label: "Links", links });

  return rows;
}
