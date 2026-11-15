import { useEffect, useState } from "react";
import { displayDate } from "./ApplicantPage";

export interface ProgrammeCurriculum {
  majorIds: string[];
  studyArea: string;
  award?: string;
  length?: string;
  units?: string;
  overview?: string;
  core: Array<{ title: string; detail?: string }>;
  tracks: string[];
  capstone?: string;
  /** What Stanford says to take before or early in the major. */
  preparation?: string[];
  sampleCourses: Array<{ code?: string; title: string }>;
  sourceUrl: string;
  sourceTitle: string;
}

export interface UniversityCurricula {
  schemaVersion: 1;
  universityId: string;
  verifiedAt: string;
  academicYear?: string;
  programmes: ProgrammeCurriculum[];
}

const isCurricula = (value: unknown, universityId: string): value is UniversityCurricula =>
  !!value && typeof value === "object" && (value as { schemaVersion?: unknown }).schemaVersion === 1
  && (value as { universityId?: unknown }).universityId === universityId && Array.isArray((value as { programmes?: unknown }).programmes);

// Pilot fixtures only exist in builds with the flag on, so production bundles never include them.
const pilotLoaders: Record<string, () => Promise<unknown>> = import.meta.env.VITE_STRUCTURED_PILOT === "true"
  ? import.meta.glob("./pilot/curricula/*.json", { import: "default" }) as Record<string, () => Promise<unknown>>
  : {};

export async function getProgrammeCurriculum(university: { id: string; curricula?: unknown }, majorId: string): Promise<{ programme: ProgrammeCurriculum; verifiedAt: string; academicYear?: string } | undefined> {
  let data: unknown = university.curricula;
  if (!isCurricula(data, university.id)) {
    const load = pilotLoaders[`./pilot/curricula/${university.id}.json`];
    if (!load) return undefined;
    try { data = await load(); } catch { return undefined; }
  }
  if (!isCurricula(data, university.id)) return undefined;
  const programme = data.programmes.find((item) => item.majorIds.includes(majorId));
  return programme ? { programme, verifiedAt: data.verifiedAt, academicYear: data.academicYear } : undefined;
}

export type CurriculumResult = Awaited<ReturnType<typeof getProgrammeCurriculum>>;

export function useProgrammeCurriculum(university: { id: string; curricula?: unknown } | null | undefined, majorId: string): CurriculumResult {
  const [state, setState] = useState<{ key: string; value: CurriculumResult }>();
  const key = `${university?.id ?? ""}:${majorId}`;
  useEffect(() => {
    if (!university || !majorId) return;
    let cancelled = false;
    getProgrammeCurriculum(university, majorId).then((value) => { if (!cancelled) setState({ key, value }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state && state.key === key ? state.value : undefined;
}

/** Lists for "What you'll study": core subjects, tracks, example courses, capstone. */
export function CurriculumBlock({ data }: { data: NonNullable<CurriculumResult> }) {
  const { programme, verifiedAt, academicYear } = data;
  const facts = [programme.award, programme.length, programme.units].filter(Boolean).join(" · ");
  return <div className="applicant-degree-page__curriculum">
    {programme.overview && <p className="applicant-degree-page__curriculum-overview">{programme.overview}</p>}
    {facts && <p className="applicant-degree-page__curriculum-facts">{facts}</p>}
    {(programme.preparation?.length ?? 0) > 0 && <div>
      <h3 className="applicant-university-detail__list-title">Prepare for this major</h3>
      <ul className="applicant-degree-page__prep">{programme.preparation!.map((line) => <li key={line}>{line}</li>)}</ul>
    </div>}
    {programme.core.length > 0 && <div>
      <h3 className="applicant-university-detail__list-title">Core subjects</h3>
      <ul className="applicant-degree-page__core">{programme.core.map((item) => <li key={item.title}><strong>{item.title}</strong>{item.detail && <span>{item.detail}</span>}</li>)}</ul>
    </div>}
    {programme.tracks.length > 0 && <div>
      <h3 className="applicant-university-detail__list-title">Tracks you can choose</h3>
      <ul className="applicant-degree-page__tracks">{programme.tracks.map((track) => <li key={track}>{track}</li>)}</ul>
    </div>}
    {programme.sampleCourses.length > 0 && <div>
      <h3 className="applicant-university-detail__list-title">Example courses</h3>
      <ul className="applicant-degree-page__courses">{programme.sampleCourses.map((course) => <li key={`${course.code ?? ""}${course.title}`}>{course.code && <code>{course.code}</code>}<span>{course.title}</span></li>)}</ul>
    </div>}
    {programme.capstone && <p className="applicant-degree-page__curriculum-capstone"><strong>Final project: </strong>{programme.capstone}</p>}
    <p className="applicant-university-detail__checked">Source: <a href={programme.sourceUrl} target="_blank" rel="noopener noreferrer">{programme.sourceTitle}</a>{academicYear ? ` · ${academicYear}` : ""}{Number.isFinite(Date.parse(verifiedAt)) && ` · Checked ${displayDate(verifiedAt)}`}</p>
  </div>;
}
