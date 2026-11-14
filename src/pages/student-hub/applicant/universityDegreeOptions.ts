import { majorName, normalizeStudyArea, verifiedStudyAreaUrl, type Field, type Major } from "./UniversityStudyAreas";
import type { VerifiedProgramLink } from "src/app/services/universities";

export interface DegreeOption {
  value: string;
  label: string;
  group: "Degrees" | "Study areas";
  /** Internal route. */
  to?: string;
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
    if (major) return { ...base, to: `/student-hub/universities/${universityId}/study-areas/${major.id}${suffix}` };
    const href = verifiedStudyAreaUrl(field.value, majors, links);
    return href ? { ...base, href, hint: "Official page ↗" } : { ...base, disabled: true, hint: "Link not yet verified" };
  }).sort(byLabel));
  return [...degreeOptions, ...areaOptions];
}
