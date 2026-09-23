import { useState } from "react";
import { Alert, Button, Input, Tag } from "antd";
import { ArrowLeft, ArrowRight, Building2, Search } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGetGraduateProgramQuery, useGetGraduateProgramsQuery, type GraduateProgram, type GraduateProgramFact } from "src/app/services/graduateProgramsApi";
import { useGetUniversitiesQuery, useGetUniversityDetailQuery } from "src/app/services/universities";
import { useGetCollegeApplicationsQuery } from "src/app/services/student-hub/applicationTrackingApi";
import { getTranslation } from "src/lib/i18n/translationUtils";
import { ApplicantPage, Breadcrumb, QueryState, UniversityIdentity, displayDate } from "./ApplicantPage";
import { useApplicantOverview } from "./ApplicantOverviewContext";

const factValue = (value: GraduateProgramFact) => !value || !Object.keys(value).length
  ? "Verification needed"
  : Object.entries(value).map(([key, item]) => `${key.replace(/([A-Z])/g, " $1")}: ${Array.isArray(item) ? item.join(", ") : String(item)}`).join(" · ");

export default function ApplicantUniversitiesPage() {
  const isMasters = useApplicantOverview().currentData?.profile?.targetDegree === "master";
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [value, setValue] = useState(search);
  const universityQuery = useGetUniversitiesQuery({ page, limit: 40, search: search || undefined }, { skip: isMasters });
  const programsQuery = useGetGraduateProgramsQuery({ q: search || undefined, page, limit: 20 }, { skip: !isMasters });
  const applications = useGetCollegeApplicationsQuery({ page: 1, limit: 100 });
  const masterPrograms = programsQuery.data?.data ?? [];
  const universities = universityQuery.data?.data ?? [];
  const isLoading = isMasters ? programsQuery.isLoading : universityQuery.isLoading;
  const isError = isMasters ? programsQuery.isError : universityQuery.isError;
  const total = isMasters ? programsQuery.data?.total ?? 0 : universityQuery.data?.total ?? 0;
  const perPage = isMasters ? programsQuery.data?.limit ?? 20 : 40;
  const setPage = (nextPage: number) => { const next = new URLSearchParams(params); next.set("page", String(nextPage)); setParams(next); };
  return <ApplicantPage title={isMasters ? "Explore graduate study options" : "Explore universities"} subtitle={isMasters ? "Search verified graduate programs by program name or university." : "Search the verified TopCoach university catalogue."} actions={<Link to="/student-hub/applications">View your applications →</Link>}>
    <Breadcrumb>{isMasters ? "Graduate study options" : "Explore universities"}</Breadcrumb>
    <form className="applicant-search" onSubmit={(event) => { event.preventDefault(); const next = new URLSearchParams(params); value.trim() ? next.set("q", value.trim()) : next.delete("q"); next.delete("page"); setParams(next); }}>
      <Input prefix={<Search size={18} />} value={value} onChange={(event) => setValue(event.target.value)} placeholder={isMasters ? "Search programs or universities" : "Search by university name"} allowClear />
      <Button type="primary" htmlType="submit">Search</Button>
    </form>
    <QueryState loading={isLoading} error={isError} retry={isMasters ? programsQuery.refetch : universityQuery.refetch}>
      {isMasters ? <ProgramResults programs={masterPrograms} savedIds={new Set((applications.data?.data ?? []).map((app) => app.programId).filter((id): id is string => Boolean(id)))} /> : <UniversityResults universities={universities} savedIds={new Set((applications.data?.data ?? []).map((app) => app.universityId).filter((id): id is string => Boolean(id)))} />}
      {total > perPage && <div className="applicant-actions applicant-actions--end"><Button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {Math.ceil(total / perPage)}</span><Button disabled={page >= Math.ceil(total / perPage)} onClick={() => setPage(page + 1)}>Next</Button></div>}
    </QueryState>
    <p>{isMasters ? "Program requirements and funding are shown only when they are in the verified program record. Check the official source before applying." : "Confirm current programme and intake availability on each university’s official website."}</p>
  </ApplicantPage>;
}

function ProgramResults({ programs, savedIds }: { programs: GraduateProgram[]; savedIds: Set<string> }) {
  if (!programs.length) return <div className="applicant-panel applicant-empty"><Building2 size={36} /><h2>No graduate programs match these filters.</h2><p>Try another program or university name.</p></div>;
  return <div className="applicant-stack">{programs.map((program) => <div className="applicant-panel applicant-university-result" key={program.id}><div className="applicant-university"><span className="applicant-university__logo"><Building2 size={26} aria-hidden /></span><div><strong>{program.programName}</strong><p>{[getTranslation(program.university.name), program.intake ?? "Intake to verify", program.deadline ? `Deadline ${displayDate(program.deadline)}` : "Deadline to verify"].join(" · ")}</p></div></div><div className="applicant-actions">{savedIds.has(program.id) && <Tag color="green">In your list</Tag>}<Link className="ant-btn ant-btn-default" to={`/student-hub/universities/${encodeURIComponent(program.universityId)}?program=${encodeURIComponent(program.id)}`}>View program <ArrowRight size={14} /></Link></div></div>)}</div>;
}

function UniversityResults({ universities, savedIds }: { universities: Array<any>; savedIds: Set<string> }) {
  if (!universities.length) return <div className="applicant-panel applicant-empty"><Building2 size={36} /><h2>No universities match these filters.</h2><p>Try another university name.</p></div>;
  return <div className="applicant-stack">{universities.map((university) => <div className="applicant-panel applicant-university-result" key={university.id}><UniversityIdentity id={university.id} name={getTranslation(university.name)} subtitle={[getTranslation(university.location?.country), university.rankings?.[0]?.rank ? `Rank #${university.rankings[0].rank}` : ""].filter(Boolean).join(" · ")} /><div className="applicant-actions">{savedIds.has(university.id) && <Tag>In your list</Tag>}<Link className="ant-btn ant-btn-default" to={`/student-hub/universities/${university.id}`}>View university <ArrowRight size={14} /></Link></div></div>)}</div>;
}

export function ApplicantUniversityDetailPage() {
  const { universityId = "" } = useParams();
  const [params] = useSearchParams();
  const programId = params.get("program") ?? "";
  const programQuery = useGetGraduateProgramQuery(programId, { skip: !programId });
  const universityQuery = useGetUniversityDetailQuery(universityId, { skip: !universityId || Boolean(programId) });
  const applications = useGetCollegeApplicationsQuery({ page: 1, limit: 100 });
  const navigate = useNavigate();
  const program = programQuery.data;
  const university = universityQuery.data;
  const existing = programId ? applications.data?.data.find((app) => app.programId === programId) : applications.data?.data.find((app) => app.universityId === universityId);
  const loading = programId ? programQuery.isLoading : universityQuery.isLoading;
  const error = programId ? programQuery.isError || (!programQuery.isLoading && !program) : universityQuery.isError || (!universityQuery.isLoading && !university);
  return <ApplicantPage title={program?.programName ?? (university ? getTranslation(university.name) : programId ? "Graduate program" : "University overview")} actions={<Button icon={<ArrowLeft size={15} />} onClick={() => navigate("/student-hub/universities")}>Back to results</Button>}>
    <Breadcrumb><Link to="/student-hub/universities">Explore {programId ? "graduate programs" : "universities"}</Link><span>/</span>{programId ? "Program details" : "University overview"}</Breadcrumb>
    <QueryState loading={loading} error={error} retry={programId ? programQuery.refetch : universityQuery.refetch}>
      {program && <GraduateDetail program={program} existingId={existing?.id} applicationsError={applications.isError} applicationsLoading={applications.isLoading} onAdd={() => navigate(`/student-hub/applications/new?programId=${encodeURIComponent(program.id)}`)} onOpen={() => existing && navigate(`/student-hub/applications/${existing.id}`)} />}
      {university && <LegacyDetail university={university} existingId={existing?.id} onAdd={() => navigate(`/student-hub/applications/new?university=${encodeURIComponent(universityId)}`)} onOpen={() => existing && navigate(`/student-hub/applications/${existing.id}`)} />}
    </QueryState>
  </ApplicantPage>;
}

function GraduateDetail({ program, existingId, applicationsError, applicationsLoading, onAdd, onOpen }: { program: GraduateProgram; existingId?: string; applicationsError: boolean; applicationsLoading: boolean; onAdd: () => void; onOpen: () => void }) {
  return <><div className="applicant-university-hero applicant-panel"><div><span className="applicant-kicker">Graduate program · verified {program.lastVerifiedAt ? displayDate(program.lastVerifiedAt) : "date unavailable"}</span><h1>{program.programName}</h1><p>{getTranslation(program.university.name)}</p><div className="applicant-actions">{existingId && <Button type="primary" onClick={onOpen}>Open application workspace</Button>}<Button disabled={applicationsLoading || applicationsError} onClick={onAdd}>{existingId ? "Add another application" : "Add to your program list"}</Button>{program.officialSourceUrl && <Button href={program.officialSourceUrl} target="_blank" rel="noreferrer">Official source</Button>}</div>{applicationsError && <p>We could not check your saved applications. Try again before adding this program.</p>}</div></div><div className="applicant-two-columns"><div className="applicant-panel"><h2>Program requirements</h2><dl className="applicant-facts"><dt>Eligibility</dt><dd>{factValue(program.eligibility)}</dd><dt>Language evidence</dt><dd>{factValue(program.languageEvidence)}</dd><dt>Funding</dt><dd>{factValue(program.funding)}</dd></dl></div><aside className="applicant-panel"><h2>Application facts</h2><dl className="applicant-facts"><dt>Intake</dt><dd>{program.intake ?? "Verification needed"}</dd><dt>Deadline</dt><dd>{program.deadline ? displayDate(program.deadline) : "Verification needed"}</dd><dt>Last verified</dt><dd>{program.lastVerifiedAt ? displayDate(program.lastVerifiedAt) : "Verification needed"}</dd></dl></aside></div></>;
}

function LegacyDetail({ university, existingId, onAdd, onOpen }: { university: any; existingId?: string; onAdd: () => void; onOpen: () => void }) {
  return <><div className="applicant-university-hero applicant-panel">{university.media?.[0]?.url && <img src={university.media[0].url} alt="" />}<div><span className="applicant-kicker">{getTranslation(university.location?.country)}</span><h1>{getTranslation(university.name)}</h1><p>{getTranslation(university.summary) || getTranslation(university.description) || "University information is available through the verified catalogue."}</p><div className="applicant-actions">{existingId && <Button type="primary" onClick={onOpen}>Open application workspace</Button>}<Button onClick={onAdd}>{existingId ? "Add another application" : "Add application details"}</Button>{university.location?.url && <Button href={university.location.url} target="_blank" rel="noreferrer">Official website</Button>}</div></div></div><div className="applicant-two-columns"><div className="applicant-panel"><h2>Fields of study</h2>{university.majors?.length ? <div className="applicant-chip-list">{university.majors.slice(0, 24).map((item: any) => <Tag key={item.id}>{getTranslation(item.name)}</Tag>)}</div> : <Alert type="info" message="Programme details are not listed here yet." />}</div><aside className="applicant-panel"><h2>At a glance</h2><dl className="applicant-facts"><dt>Established</dt><dd>{university.establishedIn || "Not listed"}</dd><dt>Ranking</dt><dd>{university.rankings?.[0]?.rank ? `#${university.rankings[0].rank} ${university.rankings[0].type}` : "Not listed"}</dd></dl></aside></div></>;
}
