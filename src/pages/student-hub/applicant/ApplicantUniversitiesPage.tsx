import { verifiedUniversityFinance, type VerifiedUniversityFinance } from './verifiedUniversityFinance';
import { UniversityStudyAreas, normalizeStudyArea } from './UniversityStudyAreas';
import { useEffect, useState } from "react";
import { Alert, Button, Input, Select, Tag } from "antd";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookmarkPlus, Building2, Search } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGetGraduateProgramQuery, useGetGraduateProgramsQuery, type GraduateProgram, type GraduateProgramFact } from "src/app/services/graduateProgramsApi";
import { useGetReviewedUniversitiesQuery, useGetUniversityDetailQuery, useGetUniversityFiltersQuery } from "src/app/services/universities";
import { degreeMatchesField, useGetUndergraduateDegreesQuery } from "src/app/services/undergraduateDegreesApi";
import type { UniversitiesSchema } from "src/app/api/Api";
import { useGetCollegeApplicationsQuery } from "src/app/services/student-hub/applicationTrackingApi";
import { getTranslation } from "src/lib/i18n/translationUtils";
import { ApplicantPage, Breadcrumb, QueryState, displayDate } from "./ApplicantPage";
import { useApplicantOverview } from "./ApplicantOverviewContext";
import { ApplicantMobileTrail } from "./ApplicantTopBarContext";
import { getUniversityLogoUrl, universityLogoNeedsDarkBackground } from "./universityLogo";
import { buildUniversityFieldOptions } from "./universityFieldOptions";

const factValue = (value: GraduateProgramFact) => !value || !Object.keys(value).length
  ? "Verification needed"
  : Object.entries(value).map(([key, item]) => `${key.replace(/([A-Z])/g, " $1")}: ${Array.isArray(item) ? item.join(", ") : String(item)}`).join(" · ");

export default function ApplicantUniversitiesPage() {
  const isMasters = useApplicantOverview().currentData?.profile?.targetDegree === "master";
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const major = params.get("major") ?? "";
  const country = params.get("country") ?? "";
  const requestedPage = Number(params.get("page"));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [value, setValue] = useState(search);
  // Back/forward navigation changes the URL without remounting this page.
  useEffect(() => setValue(search), [search]);
  // Subject coverage is incomplete; only require an undergraduate subject when
  // the applicant explicitly chooses a field, rather than hiding universities.
  const universityQuery = useGetReviewedUniversitiesQuery({ search: search || undefined, majorName: major || undefined, country: country || undefined, majorType: major ? "undergraduate" : undefined }, { skip: isMasters });
  const filtersQuery = useGetUniversityFiltersQuery(undefined, { skip: isMasters });
  const programsQuery = useGetGraduateProgramsQuery({ q: search || undefined, page, limit: 20 }, { skip: !isMasters });
  const applications = useGetCollegeApplicationsQuery({ page: 1, limit: 100 });
  const masterPrograms = programsQuery.data?.data ?? [];
  const universities = (universityQuery.data?.data ?? []).slice((page - 1) * 40, page * 40);
  const isLoading = isMasters ? programsQuery.isLoading : universityQuery.isLoading;
  const isError = isMasters ? programsQuery.isError : universityQuery.isError;
  const total = isMasters ? programsQuery.data?.total ?? 0 : universityQuery.data?.total ?? 0;
  const perPage = isMasters ? programsQuery.data?.limit ?? 20 : 40;
  const subjectOptions = buildUniversityFieldOptions(filtersQuery.data?.majors ?? []);
  const setPage = (nextPage: number) => { const next = new URLSearchParams(params); next.set("page", String(nextPage)); setParams(next); };
  const setFilter = (key: "major" | "country", value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); next.delete("page"); setParams(next); };
  if (!isMasters) return <ApplicantPage title="Find universities" subtitle="Explore Bachelor’s options. Check course availability before adding a university to your College List.">
    <form className="applicant-find-search" onSubmit={(event) => { event.preventDefault(); const next = new URLSearchParams(params); if (value.trim()) next.set("q", value.trim()); else next.delete("q"); next.delete("page"); setParams(next); }}>
      <Input prefix={<Search size={21} />} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Search universities" allowClear aria-label="Search universities" />
      <Button type="primary" htmlType="submit">Search</Button>
    </form>
    <div className="applicant-find-filters">
      <label className={major ? "applicant-find-filter applicant-find-filter--active" : "applicant-find-filter"}><span>Field of interest</span><Select value={major || undefined} placeholder="Any field" allowClear showSearch optionFilterProp="label" onChange={(selected) => setFilter("major", selected ?? "")} loading={filtersQuery.isLoading} options={subjectOptions} aria-label="Field of interest" /></label>
      <label className={country ? "applicant-find-filter applicant-find-filter--active" : "applicant-find-filter"}><span>Destination</span><Select value={country || undefined} placeholder="Any country" allowClear showSearch optionFilterProp="label" onChange={(selected) => setFilter("country", selected ?? "")} loading={filtersQuery.isLoading} options={(filtersQuery.data?.countries ?? []).map((item) => ({ value: item, label: item }))} aria-label="Destination" /></label>
      <label className="applicant-find-filter applicant-find-filter--disabled" title="Intake dates are not available in the university catalogue"><span>Intake</span><Select value="Any intake" disabled options={[{ value: "Any intake", label: "Any intake" }]} aria-label="Intake unavailable" /></label>
    </div>
    {filtersQuery.isError && <Alert type="warning" message="Filters could not be loaded. Search is still available." />}
    <QueryState loading={isLoading} error={isError} retry={universityQuery.refetch}>
      <UniversityResults universities={universities} rankOffset={(page - 1) * 40} selectedField={major} savedIds={new Set((applications.data?.data ?? []).map((app) => app.universityId).filter((id): id is string => Boolean(id)))} applicationsLoading={applications.isLoading} applicationsError={applications.isError} />
      {total > perPage && <div className="applicant-actions applicant-actions--end"><Button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {Math.ceil(total / perPage)}</span><Button disabled={page >= Math.ceil(total / perPage)} onClick={() => setPage(page + 1)}>Next</Button></div>}
    </QueryState>
    <Link className="applicant-find-open-list" to="/student-hub/applications">Open College List <ArrowRight size={21} /></Link>
  </ApplicantPage>;
  return <ApplicantPage title={isMasters ? "Explore graduate study options" : "Explore universities"} subtitle={isMasters ? "Search verified graduate programs by program name or university." : "Search the verified TopCoach university catalogue."} actions={<Link to="/student-hub/applications">View your applications →</Link>}>
    <Breadcrumb>{isMasters ? "Graduate study options" : "Explore universities"}</Breadcrumb>
    <form className="applicant-search" onSubmit={(event) => { event.preventDefault(); const next = new URLSearchParams(params); if (value.trim()) next.set("q", value.trim()); else next.delete("q"); next.delete("page"); setParams(next); }}>
      <Input prefix={<Search size={18} />} value={value} onChange={(event) => setValue(event.target.value)} placeholder={isMasters ? "Search programs or universities" : "Search by university name"} allowClear />
      <Button type="primary" htmlType="submit">Search</Button>
    </form>
    <QueryState loading={isLoading} error={isError} retry={isMasters ? programsQuery.refetch : universityQuery.refetch}>
      <ProgramResults programs={masterPrograms} savedIds={new Set((applications.data?.data ?? []).map((app) => app.programId).filter((id): id is string => Boolean(id)))} />
      {total > perPage && <div className="applicant-actions applicant-actions--end"><Button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {Math.ceil(total / perPage)}</span><Button disabled={page >= Math.ceil(total / perPage)} onClick={() => setPage(page + 1)}>Next</Button></div>}
    </QueryState>
    <p>{isMasters ? "Program requirements and funding are shown only when they are in the verified program record. Check the official source before applying." : "Confirm current programme and intake availability on each university’s official website."}</p>
  </ApplicantPage>;
}

function ProgramResults({ programs, savedIds }: { programs: GraduateProgram[]; savedIds: Set<string> }) {
  if (!programs.length) return <div className="applicant-panel applicant-empty"><Building2 size={36} /><h2>No graduate programs match these filters.</h2><p>Try another program or university name.</p></div>;
  return <div className="applicant-stack">{programs.map((program) => <div className="applicant-panel applicant-university-result" key={program.id}><div className="applicant-university"><span className="applicant-university__logo"><Building2 size={26} aria-hidden /></span><div><strong>{program.programName}</strong><p>{[getTranslation(program.university.name), program.intake ?? "Intake to verify", program.deadline ? `Deadline ${displayDate(program.deadline)}` : "Deadline to verify"].join(" · ")}</p></div></div><div className="applicant-actions">{savedIds.has(program.id) && <Tag color="green">In your list</Tag>}<Link className="ant-btn ant-btn-default" to={`/student-hub/universities/${encodeURIComponent(program.universityId)}?program=${encodeURIComponent(program.id)}`}>View program <ArrowRight size={14} /></Link></div></div>)}</div>;
}

const RANKING_NAMES: Partial<Record<string, string>> = { USNWR: "US News", ARWU: "ARWU", THE: "THE", QS: "QS", CWUR: "CWUR" };

// Prefer the QS world ranking the catalogue is sorted by; fall back to the
// university's place in this ranking-sorted list when no ranking is stored.
function universityRankingLabel(university: UniversitiesSchema, position: number) {
  const rankings = (university.rankings ?? []).filter((item) => Number.isFinite(item?.rank) && item.rank > 0);
  const ranking = rankings.find((item) => item.type === "QS") ?? rankings[0];
  if (!ranking) return { label: `#${position}`, title: `Position ${position} in this list` };
  const source = RANKING_NAMES[ranking.type] ?? ranking.type;
  return { label: `${source} #${ranking.rank}`, title: `${source} world ranking: #${ranking.rank}` };
}

function UniversityResults({ universities, rankOffset, selectedField, savedIds, applicationsLoading, applicationsError }: { universities: UniversitiesSchema[]; rankOffset: number; selectedField: string; savedIds: Set<string>; applicationsLoading: boolean; applicationsError: boolean }) {
  if (!universities.length) return <div className="applicant-panel applicant-empty"><Building2 size={36} /><h2>No universities match these filters.</h2><p>Try another search or adjust the field and destination filters.</p></div>;
  return <div className="applicant-find-results">{universities.map((university, index) => { const logoUrl = getUniversityLogoUrl(university); const ranking = universityRankingLabel(university, rankOffset + index + 1); return <div className="applicant-find-card" key={university.id}><div className="applicant-university"><span className={`applicant-university__logo${universityLogoNeedsDarkBackground(logoUrl) ? " applicant-university__logo--dark" : ""}${university.id === "1b921b70-2639-4d05-8559-36b77211852d" ? " applicant-university__logo--ucla" : ""}`}>{logoUrl ? <UniversityLogoImage src={logoUrl} name={getTranslation(university.name)} /> : <Building2 size={28} aria-hidden />}</span><div><strong>{getTranslation(university.name)}</strong><p>{[getTranslation(university.location?.region), getTranslation(university.location?.country)].filter(Boolean).join(" · ")}</p><div className="applicant-find-tags"><span className="applicant-find-rank" title={ranking.title}>{ranking.label}</span><span className="applicant-find-degree">Bachelor’s</span></div></div></div><div className="applicant-find-card__actions"><Link to={`/student-hub/universities/${university.id}${selectedField ? `?field=${encodeURIComponent(selectedField)}` : ""}`}>View university <ArrowRight size={18} /></Link>{savedIds.has(university.id) ? <Link className="applicant-find-save" to="/student-hub/applications">In your list <ArrowRight size={17} /></Link> : <Link className={`applicant-find-save${applicationsLoading || applicationsError ? " applicant-find-save--disabled" : ""}`} aria-disabled={applicationsLoading || applicationsError} onClick={(event) => { if (applicationsLoading || applicationsError) event.preventDefault(); }} to={`/student-hub/applications/new?university=${encodeURIComponent(university.id)}`}><BookmarkPlus size={18} /> Add to list</Link>}</div></div>; })}</div>;
}

export function ApplicantUniversityDetailPage() {
  const { universityId = "" } = useParams();
  const [params] = useSearchParams();
  const programId = params.get("program") ?? "";
  const selectedField = params.get("field")?.trim() ?? "";
  const programQuery = useGetGraduateProgramQuery(programId, { skip: !programId });
  const universityQuery = useGetUniversityDetailQuery(universityId, { skip: !universityId || Boolean(programId) });
  const applications = useGetCollegeApplicationsQuery({ page: 1, limit: 100 });
  const navigate = useNavigate();
  const program = programQuery.data;
  const university = universityQuery.data;
  const existing = programId ? applications.data?.data.find((app) => app.programId === programId) : applications.data?.data.find((app) => app.universityId === universityId);
  const loading = programId ? programQuery.isLoading : universityQuery.isLoading;
  const error = programId ? programQuery.isError || (!programQuery.isLoading && !program) : universityQuery.isError || (!universityQuery.isLoading && !university);
  if (!programId) return <section className="applicant-page applicant-university-detail">
    <ApplicantMobileTrail><Link to={`/student-hub/universities${selectedField ? `?major=${encodeURIComponent(selectedField)}` : ""}`}>Find universities</Link><span> / </span>{university ? getTranslation(university.name) : "University"}</ApplicantMobileTrail>
    <QueryState loading={loading} error={error} retry={universityQuery.refetch}>
      {university && <BachelorUniversityDetail university={university} selectedField={selectedField} existingId={existing?.id} applicationsUnavailable={applications.isLoading || applications.isError} onAdd={() => navigate(`/student-hub/applications/new?university=${encodeURIComponent(universityId)}`)} onOpen={() => existing && navigate(`/student-hub/applications/${existing.id}`)} />}
    </QueryState>
  </section>;
  return <ApplicantPage title={program?.programName ?? (university ? getTranslation(university.name) : programId ? "Graduate program" : "University overview")} actions={<Button icon={<ArrowLeft size={15} />} onClick={() => navigate("/student-hub/universities")}>Back to results</Button>}>
    <Breadcrumb><Link to="/student-hub/universities">Explore {programId ? "graduate programs" : "universities"}</Link><span>/</span>{programId ? "Program details" : "University overview"}</Breadcrumb>
    <QueryState loading={loading} error={error} retry={programId ? programQuery.refetch : universityQuery.refetch}>
      {program && <GraduateDetail program={program} existingId={existing?.id} applicationsError={applications.isError} applicationsLoading={applications.isLoading} onAdd={() => navigate(`/student-hub/applications/new?programId=${encodeURIComponent(program.id)}`)} onOpen={() => existing && navigate(`/student-hub/applications/${existing.id}`)} />}
    </QueryState>
  </ApplicantPage>;
}

function GraduateDetail({ program, existingId, applicationsError, applicationsLoading, onAdd, onOpen }: { program: GraduateProgram; existingId?: string; applicationsError: boolean; applicationsLoading: boolean; onAdd: () => void; onOpen: () => void }) {
  return <><div className="applicant-university-hero applicant-panel"><div><span className="applicant-kicker">Graduate program · verified {program.lastVerifiedAt ? displayDate(program.lastVerifiedAt) : "date unavailable"}</span><h1>{program.programName}</h1><p>{getTranslation(program.university.name)}</p><div className="applicant-actions">{existingId && <Button type="primary" onClick={onOpen}>Open application workspace</Button>}<Button disabled={applicationsLoading || applicationsError} onClick={onAdd}>{existingId ? "Add another application" : "Add to your program list"}</Button>{program.officialSourceUrl && <Button href={program.officialSourceUrl} target="_blank" rel="noreferrer">Official source</Button>}</div>{applicationsError && <p>We could not check your saved applications. Try again before adding this program.</p>}</div></div><div className="applicant-two-columns"><div className="applicant-panel"><h2>Program requirements</h2><dl className="applicant-facts"><dt>Eligibility</dt><dd>{factValue(program.eligibility)}</dd><dt>Language evidence</dt><dd>{factValue(program.languageEvidence)}</dd><dt>Funding</dt><dd>{factValue(program.funding)}</dd></dl></div><aside className="applicant-panel"><h2>Application facts</h2><dl className="applicant-facts"><dt>Intake</dt><dd>{program.intake ?? "Verification needed"}</dd><dt>Deadline</dt><dd>{program.deadline ? displayDate(program.deadline) : "Verification needed"}</dd><dt>Last verified</dt><dd>{program.lastVerifiedAt ? displayDate(program.lastVerifiedAt) : "Verification needed"}</dd></dl></aside></div></>;
}

type UniversityProfileContent = UniversitiesSchema & {
  undergraduateFinanceContent?: VerifiedUniversityFinance | null;
  profileOverview?: string | null;
  officialWebsiteUrl?: string | null;
  undergraduateCoursesUrl?: string | null;
  studentLifeIntro?: string | null;
  studentLifeHighlight?: string | null;
  studentLifeDetail?: string | null;
  studentLifeUrl?: string | null;
  fundingIntro?: string | null;
  fundingDetail?: string | null;
  fundingUrl?: string | null;
  fundingPolicyUrl?: string | null;
  profileVerifiedAt?: string | null;
};

function UniversityLogoImage({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? <Building2 size={30} aria-hidden="true" /> : <img src={src} alt={`${name} logo`} onError={() => setFailed(true)} />;
}

function BachelorUniversityDetail({ university, selectedField, existingId, applicationsUnavailable, onAdd, onOpen }: {
  university: UniversitiesSchema;
  selectedField: string;
  existingId?: string;
  applicationsUnavailable: boolean;
  onAdd: () => void;
  onOpen: () => void;
}) {
  const profile = university as UniversityProfileContent;
  const finance = verifiedUniversityFinance(university.id, profile.undergraduateFinanceContent);
  const degreesQuery = useGetUndergraduateDegreesQuery(university.id);
  const degrees = [...(degreesQuery.data ?? [])].sort((a, b) => Number(degreeMatchesField(b, selectedField)) - Number(degreeMatchesField(a, selectedField)));
  const matchingDegreeCount = degrees.filter((degree) => degreeMatchesField(degree, selectedField)).length;
  const catalogueFields = buildUniversityFieldOptions(university.majors ?? [])
    .sort((a, b) => Number(b.value.toLocaleLowerCase() === selectedField.toLocaleLowerCase()) - Number(a.value.toLocaleLowerCase() === selectedField.toLocaleLowerCase()));
  const matchingCatalogueFieldCount = catalogueFields.filter((field) => field.value.toLocaleLowerCase() === selectedField.toLocaleLowerCase()).length;
  const name = getTranslation(university.name);
  const location = [getTranslation(university.location?.region), getTranslation(university.location?.country)].filter(Boolean).join(", ");
  const logoUrl = getUniversityLogoUrl(university);

  return <>
    <section className="applicant-university-detail__hero">
      <div className="applicant-university-detail__identity">
        <span className={`applicant-university-detail__mark${logoUrl ? " applicant-university-detail__mark--logo" : ""}${universityLogoNeedsDarkBackground(logoUrl) ? " applicant-university-detail__mark--dark" : ""}${university.id === "1b921b70-2639-4d05-8559-36b77211852d" ? " applicant-university-detail__mark--ucla" : ""}`}>{logoUrl ? <UniversityLogoImage src={logoUrl} name={name} /> : <Building2 size={30} aria-hidden="true" />}</span>
        <div><h1>{name}</h1>{location && <p>{location}</p>}</div>
      </div>
      <p className="applicant-university-detail__overview">{profile.profileOverview ?? "Explore this university's undergraduate options and check current course information before adding it to your College List."}</p>
      <div className="applicant-university-detail__hero-actions">
        <Button disabled={applicationsUnavailable} onClick={existingId ? onOpen : onAdd}>{existingId ? "Open College List" : "Save to College List"}</Button>
        {profile.officialWebsiteUrl && <a href={profile.officialWebsiteUrl} target="_blank" rel="noreferrer">Official website <ArrowUpRight size={18} aria-hidden="true" /></a>}
      </div>
      {applicationsUnavailable && <p className="applicant-university-detail__notice">College List is temporarily unavailable. You can still explore this university.</p>}
    </section>

    <section className="applicant-university-detail__degrees">
      <h2>Explore undergraduate degrees</h2>
      <p>Start with your field of interest, then look at the course in detail.</p>
      <div className="applicant-university-detail__degree-tools">
        {degrees.length > 0
          ? <span>{selectedField ? `${matchingDegreeCount} match${matchingDegreeCount === 1 ? "" : "es"} for ${selectedField} · ${degrees.length} degrees shown` : `${degrees.length} verified degrees`}</span>
          : catalogueFields.length > 0 && <span>{selectedField ? `${matchingCatalogueFieldCount} match${matchingCatalogueFieldCount === 1 ? "" : "es"} for ${selectedField} · ${catalogueFields.length} study areas shown` : `${catalogueFields.length} undergraduate study areas listed`}</span>}
        {profile.undergraduateCoursesUrl && <a href={profile.undergraduateCoursesUrl} target="_blank" rel="noreferrer">All undergraduate majors on the official site <ArrowUpRight size={17} aria-hidden="true" /></a>}
      </div>
      {selectedField && degrees.length > 0 && matchingDegreeCount === 0 && <p className="applicant-university-detail__degree-note">We have not verified a degree matching {selectedField} yet. These are the other degrees currently reviewed for {name}.</p>}
      {selectedField && degrees.length === 0 && catalogueFields.length > 0 && matchingCatalogueFieldCount === 0 && <p className="applicant-university-detail__degree-note">The current catalogue does not list {selectedField} for {name}. These are its other undergraduate study areas.</p>}
      {degreesQuery.isLoading && <div className="applicant-university-detail__pending"><p>Loading undergraduate degrees…</p></div>}
      {degreesQuery.isError && <div className="applicant-university-detail__pending"><p>Degree details could not be loaded.</p><Button onClick={() => degreesQuery.refetch()}>Try again</Button></div>}
      {!degreesQuery.isLoading && !degreesQuery.isError && degrees.length > 0 && <div className="applicant-university-detail__degree-list">{degrees.map((degree) => <article className="applicant-university-detail__degree-card" key={degree.slug}><div>{degreeMatchesField(degree, selectedField) && <span className="applicant-university-detail__match">Matches selected field</span>}<h3>{degree.name}</h3><p>{degree.degreeType} · Undergraduate degree</p><p>{degree.description}</p><small>Verified {displayDate(degree.verifiedAt)} · <a href={degree.sourceUrl} target="_blank" rel="noreferrer">Official source <ArrowUpRight size={14} aria-hidden="true" /></a></small></div><Link className="applicant-university-detail__degree-button" to={`/student-hub/universities/${university.id}/degrees/${degree.slug}${selectedField ? `?field=${encodeURIComponent(selectedField)}` : ""}`}>View degree <ArrowRight size={19} aria-hidden="true" /></Link></article>)}</div>}
      {!degreesQuery.isLoading && !degreesQuery.isError && <UniversityStudyAreas universityId={university.id} fields={catalogueFields.filter(field => !degrees.some(degree => degreeMatchesField(degree, field.value) || normalizeStudyArea(degree.name) === normalizeStudyArea(field.value)))} majors={university.majors ?? []} links={(university as UniversityProfileContent & { verifiedProgramLinks?: import('src/app/services/universities').VerifiedProgramLink[] }).verifiedProgramLinks} selectedField={selectedField} />}
      {!degreesQuery.isLoading && !degreesQuery.isError && !degrees.length && !catalogueFields.length && <div className="applicant-university-detail__pending"><h3>Course details are being verified</h3><p>We do not have a confirmed undergraduate course list for this university yet.</p></div>}
    </section>

    <div className="applicant-university-detail__lower">
      <section className="applicant-university-detail__life"><h2>Life at {name}</h2>{profile.studentLifeIntro || profile.studentLifeDetail ? <><p>{profile.studentLifeIntro}</p>{profile.studentLifeHighlight && <strong>{profile.studentLifeHighlight}</strong>}<p>{profile.studentLifeDetail}</p>{profile.studentLifeUrl && <a href={profile.studentLifeUrl} target="_blank" rel="noreferrer">Explore campus life <ArrowUpRight size={17} aria-hidden="true" /></a>}</> : <p>Student-life information is being checked against official university sources.</p>}</section>
      <section className="applicant-university-detail__funding"><h2>Fees &amp; financial support</h2>{finance ? <>
        <h3>Tuition and fees</h3><p>{finance.content.feesSummary}</p>
        <a href={finance.content.feesUrl} target="_blank" rel="noreferrer">Official tuition and fee details <ArrowUpRight size={17} aria-hidden="true" /></a>
        <h3>Scholarships and financial support</h3><p>{finance.content.fundingSummary}</p>
        {finance.content.fundingPolicyNote && <p>{finance.content.fundingPolicyNote}</p>}
        <a href={finance.content.fundingPolicyUrl} target="_blank" rel="noreferrer">Official scholarships and funding policy <ArrowUpRight size={17} aria-hidden="true" /></a>
        <p>Checked {displayDate(finance.verifiedAt)}</p>
      </> : profile.fundingIntro || profile.fundingDetail ? <><p>{profile.fundingIntro}</p><p>{profile.fundingDetail} {profile.fundingPolicyUrl && <a href={profile.fundingPolicyUrl} target="_blank" rel="noreferrer">International applicant policy <ArrowUpRight size={17} aria-hidden="true" /></a>}</p>{profile.fundingUrl && <a href={profile.fundingUrl} target="_blank" rel="noreferrer">Explore funding <ArrowUpRight size={17} aria-hidden="true" /></a>}</> : <p>Current tuition and funding details are being checked against official university sources.</p>}</section>
    </div>
    <p className="applicant-university-detail__source">{profile.profileVerifiedAt ? `Information from the university's official pages · Checked ${displayDate(profile.profileVerifiedAt)}` : "Course, campus and funding details will appear after source review."}</p>
  </>;
}
