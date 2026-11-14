import { majorName, normalizeStudyArea, verifiedStudyAreaUrl, type Field, type Major } from "./UniversityStudyAreas";
import type { VerifiedProgramLink } from "src/app/services/universities";
import type { UndergraduateDegree } from "src/app/services/undergraduateDegreesApi";
import { withVerifiedStudyAreaContent, type VerifiedStudyAreaContent } from "./verifiedStudyAreaContent";

export interface DegreeOption {
  value: string;
  label: string;
  group: "Degrees" | "Study areas";
  /** Internal route. */
  to?: string;
  majorId?: string;
  /** Verified external official page. */
  href?: string;
  hint?: string;
  disabled?: boolean;
}

export interface DegreeInput { slug: string; name: string }

const byLabel = (a: DegreeOption, b: DegreeOption) => a.label.localeCompare(b.label, "en", { sensitivity: "base" });

function dedupe(options: DegreeOption[]): DegreeOption[] {
  const seen = new Set<string>();
  return options.filter((option) => { const key = normalizeStudyArea(option.label); if (seen.has(key)) return false; seen.add(key); return true; });
}

export function buildDegreeOptions({ universityId, degrees, fields, majors, links, selectedField }: {
  universityId: string; degrees: readonly DegreeInput[]; fields: readonly Field[]; majors: readonly Major[]; links: readonly VerifiedProgramLink[]; selectedField: string;
}): DegreeOption[] {
  const suffix = selectedField ? `?field=${encodeURIComponent(selectedField)}` : "";
  const degreeOptions = dedupe(degrees.map((degree): DegreeOption => ({
    value: `degree:${degree.slug}`, label: degree.name, group: "Degrees",
    to: `/student-hub/universities/${universityId}/degrees/${degree.slug}${suffix}`,
  })).sort(byLabel));
  const taken = new Set(degreeOptions.map((option) => normalizeStudyArea(option.label)));
  const areaOptions = dedupe(fields.filter((field) => !taken.has(normalizeStudyArea(field.label))).map((field): DegreeOption => {
    const major = majors.find((item) => item.type === "undergraduate" && normalizeStudyArea(majorName(item.name)) === normalizeStudyArea(field.value));
    const base = { value: `area:${field.value}`, label: field.label, group: "Study areas" as const };
    if (major) return { ...base, majorId: major.id, to: `/student-hub/universities/${universityId}/study-areas/${major.id}${suffix}` };
    const href = verifiedStudyAreaUrl(field.value, majors, links);
    return href ? { ...base, href, hint: "Official page ↗" } : { ...base, disabled: true, hint: "Link not yet verified" };
  }).sort(byLabel));
  return [...degreeOptions, ...areaOptions];
}

export function finderCopy(options: readonly DegreeOption[]) {
  const degrees = options.filter((o) => o.group === "Degrees").length;
  const areas = options.filter((o) => o.group === "Study areas").length;
  if (degrees && !areas) return { label: "Find a degree", placeholder: `Search ${degrees} degrees…` };
  if (!degrees && areas) return { label: "Find a study area", placeholder: `Search ${areas} study areas…` };
  return { label: "Find a degree or study area", placeholder: `Search ${degrees + areas} degrees and study areas…` };
}

export interface StudyPreview { title: string; curriculum?: string; entry?: string; url?: string; to?: string; pending: boolean }

export interface PreviewContext {
  universityId: string;
  degrees: readonly UndergraduateDegree[];
  majors: readonly Major[];
  links: readonly VerifiedProgramLink[];
  content: readonly VerifiedStudyAreaContent[];
}

const httpsOnly = (value?: string | null) => { try { const u = value ? new URL(value) : null; return u && u.protocol === "https:" ? value! : undefined; } catch { return undefined; } };
const text = (value?: string | null) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

function studyAreaBase(universityId: string, majorId: string, name: string, officialUrl: string): UndergraduateDegree {
  return {
    id: majorId, universityId, slug: majorId, name, degreeType: "Undergraduate study area",
    durationYears: null, studyMode: null, courseCode: null, description: null,
    curriculumSummary: null, firstYearSubjects: null, entrySummary: null,
    qualificationLabel: null, qualificationValue: null, qualificationNote: null,
    admissionsTest: null, admissionsTestNote: null, feesSummary: null, fundingSummary: null,
    fundingPolicyNote: null, applicationSummary: null, deadlineAt: null, deadlineNote: null,
    officialDegreeUrl: officialUrl, curriculumUrl: officialUrl || null, requirementsUrl: officialUrl || null,
    feesUrl: null, fundingPolicyUrl: null, applicationUrl: officialUrl || null,
    sourceTitle: "University course catalogue", sourceUrl: officialUrl, verifiedAt: "", fieldAliases: [name],
  } as UndergraduateDegree;
}

/** Content for the inline preview, using the same verified-content helper as the study-area page. */
export function buildPreview(option: DegreeOption, ctx: PreviewContext): StudyPreview {
  if (option.group === "Degrees") {
    const degree = ctx.degrees.find((d) => `degree:${d.slug}` === option.value);
    const curriculum = text(degree?.curriculumSummary), entry = text(degree?.entrySummary);
    return { title: option.label, curriculum, entry, url: httpsOnly(degree?.officialDegreeUrl) ?? httpsOnly(degree?.sourceUrl), to: option.to, pending: !curriculum && !entry };
  }
  const field = option.value.replace(/^area:/, "");
  const officialUrl = verifiedStudyAreaUrl(field, ctx.majors, ctx.links) ?? option.href ?? "";
  if (!option.majorId) return { title: option.label, url: httpsOnly(officialUrl), to: option.to, pending: true };
  const degree = withVerifiedStudyAreaContent(studyAreaBase(ctx.universityId, option.majorId, option.label, officialUrl), ctx.content);
  const curriculum = text(degree.curriculumSummary), entry = text(degree.entrySummary);
  return { title: option.label, curriculum, entry, url: httpsOnly(degree.officialDegreeUrl) ?? httpsOnly(officialUrl), to: option.to, pending: !curriculum && !entry };
}
