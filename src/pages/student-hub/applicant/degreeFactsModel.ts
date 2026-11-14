import type { UniversitiesSchema } from "src/app/api/Api";
import type { UndergraduateDegree } from "src/app/services/undergraduateDegreesApi";
import { extractTuition, formatFactDate, hasMonthDay, parseDatesWithYear, stripGraduateParagraph, type GlanceTile, type Translate } from "./universityKeyFactsModel";

const GENERIC_TYPES = /^undergraduate (study area|degree)$/i;

/** Short form only when the data states it explicitly, e.g. a trailing "(SB)"; never guessed from the long name. */
export function shortQualification(...texts: (string | null | undefined)[]): string | undefined {
  for (const raw of texts) {
    const text = (raw ?? "").trim();
    if (!text || GENERIC_TYPES.test(text)) continue;
    const paren = text.match(/\(([A-Z][A-Za-z.]{1,5})\)\s*$/);
    if (paren) return paren[1].replace(/\./g, "");
  }
  return undefined;
}

/** Awarded qualification line for the hero, hiding the generic placeholder used for study areas. */
export const awardedQualification = (degreeType: string | null | undefined) => {
  const type = (degreeType ?? "").trim();
  return type && !GENERIC_TYPES.test(type) ? type : undefined;
};

/** Only when a sentence clearly says the major is chosen/declared at a stated time; otherwise undefined. */
export function majorChoiceTiming(...texts: (string | null | undefined)[]): string | undefined {
  for (const text of texts) {
    for (const sentence of (text ?? "").split(/(?<=[.!?])\s+|\n+/)) {
      if (!/\b(declare|declared|choose|chosen|select|selected|decide|decided)\b/i.test(sentence) || !/\bmajors?\b/i.test(sentence)) continue;
      const m = sentence.match(/\b(?:end of|after|by the end of) (?:the )?(first|second|freshman|sophomore) year\b|\b(?:in|during|at the start of) (?:the )?(second|sophomore) year\b/i);
      if (!m) continue;
      const year = (m[1] ?? m[2]).toLowerCase();
      const word = year === "freshman" ? "first" : year === "sophomore" ? "second" : year;
      return /^(in|during|at the start of)/i.test(m[0]) ? `Start of ${word} year` : `End of ${word} year`;
    }
  }
  return undefined;
}

const longDate = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** One application-deadline tile: the programme's own deadline, else the latest dated university deadline, labelled "Last cycle" when past. */
export function deadlineTile(degree: Pick<UndergraduateDegree, "deadlineAt">, deadlines: NonNullable<UniversitiesSchema["deadlines"]>, tr: Translate, now: Date): { value: string; sub?: string } | undefined {
  const candidates: Date[] = [];
  const own = formatFactDate(degree.deadlineAt) ? new Date(String(degree.deadlineAt)) : undefined;
  if (own) candidates.push(own);
  else for (const item of deadlines) {
    const name = stripGraduateParagraph(tr(item?.name as never).trim());
    const dates = parseDatesWithYear(name);
    if (dates.length) candidates.push(...dates);
    else if (item?.date && (!name || hasMonthDay(name)) && formatFactDate(item.date)) candidates.push(new Date(String(item.date)));
  }
  if (!candidates.length) return undefined;
  const upcoming = candidates.filter((d) => d.getTime() >= now.getTime()).sort((a, b) => a.getTime() - b.getTime());
  if (upcoming.length) return { value: longDate(upcoming[0]) };
  const latest = candidates.sort((a, b) => b.getTime() - a.getTime())[0];
  return { value: longDate(latest), sub: "Last cycle" };
}

export function buildDegreeGlance(degree: UndergraduateDegree, deadlines: NonNullable<UniversitiesSchema["deadlines"]>, tr: Translate, now: Date = new Date()): GlanceTile[] {
  const tiles: GlanceTile[] = [];
  const qualification = shortQualification(degree.degreeType, degree.name);
  if (qualification) tiles.push({ id: "qualification", label: "Qualification", value: qualification });
  const timing = majorChoiceTiming(degree.entrySummary, degree.description, degree.curriculumSummary, degree.applicationSummary, degree.firstYearSubjects);
  if (timing) tiles.push({ id: "choose-major", label: "Choose major", value: timing });
  const deadline = deadlineTile(degree, deadlines, tr, now);
  if (deadline) tiles.push({ id: "deadline", label: "Application deadline", value: deadline.value, sub: deadline.sub });
  const tuition = extractTuition((degree.feesSummary ?? "").replace(/^University guidance:\s*/i, ""));
  if (tuition) tiles.push({ id: "tuition", label: "Tuition", value: tuition.value, sub: tuition.sub });
  return tiles;
}
