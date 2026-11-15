import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { displayDate } from "./ApplicantPage";

export interface StudyAreaProgrammes {
  field: string;
  openToInternationalFirstYear: boolean | null;
  conditions: string[];
  programmes: Array<{ programmeName: string; award?: string | null; url: string; sourceTitle?: string | null; language?: string | null; durationYears?: number | null }>;
}
interface UniversityProgrammes { schemaVersion: 1; universityId: string; checkedAt?: string; areas: Record<string, StudyAreaProgrammes> }

const isProgrammes = (value: unknown, universityId: string): value is UniversityProgrammes =>
  !!value && typeof value === "object" && (value as { schemaVersion?: unknown }).schemaVersion === 1
  && (value as { universityId?: unknown }).universityId === universityId && typeof (value as { areas?: unknown }).areas === "object";

// Pilot fixtures only exist in builds with the flag on, so production bundles never include them.
const pilotLoaders: Record<string, () => Promise<unknown>> = import.meta.env.VITE_STRUCTURED_PILOT === "true"
  ? import.meta.glob("./pilot/programmes/*.json", { import: "default" }) as Record<string, () => Promise<unknown>>
  : {};

export type ProgrammesResult = { area: StudyAreaProgrammes; checkedAt?: string } | undefined;

export function useStudyAreaProgrammes(universityId: string, majorId: string): ProgrammesResult {
  const [state, setState] = useState<{ key: string; value: ProgrammesResult }>();
  const key = `${universityId}:${majorId}`;
  useEffect(() => {
    const load = pilotLoaders[`./pilot/programmes/${universityId}.json`];
    if (!load || !majorId) return;
    let cancelled = false;
    load().then((data) => {
      if (cancelled) return;
      const area = isProgrammes(data, universityId) ? data.areas[majorId] : undefined;
      setState({ key, value: area ? { area, checkedAt: (data as UniversityProgrammes).checkedAt } : undefined });
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [key, universityId, majorId]);
  return state && state.key === key ? state.value : undefined;
}

/** The actual degrees a university offers in this study area: award, language, official link. */
export function ProgrammeList({ data }: { data: NonNullable<ProgrammesResult> }) {
  const { area, checkedAt } = data;
  const intl = area.openToInternationalFirstYear === true ? "Open to international first-year applicants" : area.openToInternationalFirstYear === false ? "Not open to international first-year applicants" : undefined;
  return <div className="applicant-degree-page__programmes">
    <h3 className="applicant-university-detail__list-title">Degrees in this study area</h3>
    <ul>{area.programmes.map((p) => <li key={p.url + p.programmeName}>
      <a href={p.url} target="_blank" rel="noopener noreferrer"><strong>{p.programmeName}</strong><ArrowUpRight size={14} aria-hidden="true" /></a>
      <small>{[p.award, p.language ? `Taught in ${p.language}` : "", p.durationYears ? `${p.durationYears} years` : ""].filter(Boolean).join(" · ")}</small>
    </li>)}</ul>
    {(intl || area.conditions.length > 0) && <p className="applicant-degree-page__programmes-note">{[intl, ...area.conditions].filter(Boolean).join(". ")}</p>}
    {checkedAt && Number.isFinite(Date.parse(checkedAt)) && <p className="applicant-university-detail__checked">From the university's official programme pages · Checked {displayDate(checkedAt)}</p>}
  </div>;
}
