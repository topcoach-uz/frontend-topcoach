import type { UniversitiesSchema } from "src/app/api/Api";

type Translatable = Parameters<typeof String>[0];
export type Translate = (value: Translatable) => string;

export interface KeyFactLink { label: string; url: string }
export interface KeyFactLine { text: string; note?: string; link?: KeyFactLink }
export interface KeyFactRow { id: string; label: string; lines?: KeyFactLine[]; chips?: string[]; links?: KeyFactLink[] }

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

export function formatMoney(symbol: unknown, amount: unknown): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "";
  return `${clean(symbol)}${amount.toLocaleString("en-US")}`;
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

export function buildKeyFactRows(university: Partial<UniversitiesSchema>, tr: Translate): KeyFactRow[] {
  const rows: KeyFactRow[] = [];

  const deadlines = (university.deadlines ?? []).map((item): KeyFactLine | undefined => {
    const name = tr(item?.name as Translatable).trim();
    const date = formatFactDate(item?.date);
    const year = date.slice(-4);
    if (name && date && !name.includes(year)) return { text: name, note: date };
    return name || date ? { text: name || date } : undefined;
  }).filter((x): x is KeyFactLine => !!x);
  if (deadlines.length) rows.push({ id: "deadlines", label: "Application deadlines", lines: deadlines });

  const tuition = (university.tuitionFees ?? []).map((fee): KeyFactLine | undefined => {
    const text = formatMoney((fee?.currency as { symbol?: string } | undefined)?.symbol, fee?.fee);
    return text ? { text } : undefined;
  }).filter((x): x is KeyFactLine => !!x);
  if (tuition.length) rows.push({ id: "tuition", label: "Tuition fee", lines: tuition });

  const appFees = (university.applicationFees ?? []).map((fee): KeyFactLine | undefined => {
    const text = formatMoney(fee?.currency?.symbol, fee?.fee);
    return text ? { text } : undefined;
  }).filter((x): x is KeyFactLine => !!x);
  if (appFees.length) rows.push({ id: "application-fee", label: "Application fee", lines: appFees });

  const rates = (university.acceptanceRates ?? []).filter((r) => typeof r?.rate === "number" && Number.isFinite(r.rate))
    .map((r): KeyFactLine => ({ text: `${r.rate}%` }));
  if (rates.length) rows.push({ id: "acceptance", label: "Acceptance rate", lines: rates });

  const exams = [...new Set((university.requiredExams ?? []).map((e) => clean(e?.certification?.name)).filter(Boolean))];
  if (exams.length) rows.push({ id: "exams", label: "Required exams", chips: exams });

  const scholarships = (university.scholarships ?? []).map((s): KeyFactLine | undefined => {
    const name = tr(s?.name as Translatable).trim();
    const url = safeHttpUrl(s?.url);
    if (!name && !url) return;
    return { text: name || linkHost(url as string), link: url ? { label: "Official page", url } : undefined };
  }).filter((x): x is KeyFactLine => !!x);
  if (scholarships.length) rows.push({ id: "scholarships", label: "Scholarships", lines: scholarships });

  const links = (university.links ?? []).map((l): KeyFactLink | undefined => {
    const url = safeHttpUrl(l?.url);
    return url ? { label: clean(l?.name) || linkHost(url), url } : undefined;
  }).filter((x): x is KeyFactLink => !!x);
  if (links.length) rows.push({ id: "links", label: "Links", links });

  return rows;
}
