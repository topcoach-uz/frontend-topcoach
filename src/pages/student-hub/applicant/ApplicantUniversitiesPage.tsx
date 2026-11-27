import { verifiedUniversityFinance, type VerifiedUniversityFinance } from './verifiedUniversityFinance';
import type { CollegeListEntry } from "./UniversityCompare";
import { ClampedText } from './ClampedText';
import { UniversityDegreeFinder } from './UniversityDegreeFinder';
import { buildDegreeOptions, buildPreview } from './universityDegreeOptions';
import { normalizeStudyArea } from './UniversityStudyAreas';
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Input, Select, Tag } from "antd";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookmarkPlus, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGetGraduateProgramQuery, useGetGraduateProgramsQuery, type GraduateProgram, type GraduateProgramFact } from "src/app/services/graduateProgramsApi";
import { filterUniversityRows, useGetReviewedUniversitiesQuery, useGetUniversityDetailQuery, useGetUniversityFiltersQuery } from "src/app/services/universities";
import { degreeMatchesField, useGetUndergraduateDegreesQuery } from "src/app/services/undergraduateDegreesApi";
import type { UniversitiesSchema } from "src/app/api/Api";
import { useGetCollegeApplicationsQuery } from "src/app/services/student-hub/applicationTrackingApi";
import { getTranslation } from "src/lib/i18n/translationUtils";
import { ApplicantPage, Breadcrumb, QueryState, displayDate } from "./ApplicantPage";
import { useApplicantOverview } from "./ApplicantOverviewContext";
import { applicantDegree } from "./applicantOverviewModel";
import { ApplicantMobileTrail } from "./ApplicantTopBarContext";
import { getUniversityLogoUrl, universityLogoNeedsDarkBackground } from "./universityLogo";
import { buildUniversityFieldOptions, buildUniversitySubjectOptions, subjectKey } from "./universityFieldOptions";
import { hasStructuredCosts } from './structuredContent';
import { useStructuredContent } from './StructuredSections';
import { DetailHero, SaveToListButton } from "./DetailHero";
import { CostsFundingSection, UniversityAdmissions, UniversityDetailSkeleton, UniversityGlance, UniversitySectionNav } from "./UniversitySections";
import { buildComparableFacts, qsRankOf, buildGlanceTiles, buildKeyFactRows, buildScholarshipText, humanizeFacts, shortUniversityName } from "./universityKeyFactsModel";

import SearchButton from 'src/components/common/searchButton';
const UNIVERSITIES_PER_PAGE = 12;

const factValue = (value: GraduateProgramFact) => humanizeFacts(value) || "Verification needed";

export default function ApplicantUniversitiesPage() {
  const overview = useApplicantOverview();
  const isMasters = applicantDegree(overview.currentData?.profile?.targetDegree) === "master";
  // Wait for the profile so a master applicant never flashes the bachelor catalogue (unset degree falls back to bachelor).
  const degreePending = overview.isLoading && !overview.currentData;
  const degreeType = isMasters ? "graduate" : "undergraduate";
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
  // Only the text search goes to the server. Field and destination are applied to the cached
  // catalogue below, so changing them is instant and costs no request.
  const universityQuery = useGetReviewedUniversitiesQuery({ search: search || undefined }, { skip: isMasters || degreePending });
  const filtersQuery = useGetUniversityFiltersQuery(degreeType, { skip: isMasters || degreePending });
  const programsQuery = useGetGraduateProgramsQuery({ q: search || undefined, page, limit: 20 }, { skip: !isMasters || degreePending });
  const applications = useGetCollegeApplicationsQuery({ page: 1, limit: 100 });
  const masterPrograms = programsQuery.data?.data ?? [];
  const filteredUniversities = useMemo(() => filterUniversityRows(universityQuery.data?.data ?? [], { country, majorName: major, degree: degreeType }), [universityQuery.data, country, major, degreeType]);
  const universities = useMemo(() => filteredUniversities.slice((page - 1) * UNIVERSITIES_PER_PAGE, page * UNIVERSITIES_PER_PAGE), [filteredUniversities, page]);
  const isLoading = isMasters ? programsQuery.isLoading : universityQuery.isLoading;
  const isError = isMasters ? programsQuery.isError : universityQuery.isError;
  const total = isMasters ? programsQuery.data?.total ?? 0 : filteredUniversities.length;
  const perPage = isMasters ? programsQuery.data?.limit ?? 20 : UNIVERSITIES_PER_PAGE;
  const subjectOptions = useMemo(() => buildUniversitySubjectOptions(filtersQuery.data?.majors ?? [], degreeType), [filtersQuery.data, degreeType]);
  const majorKey = useMemo(() => subjectKey(major, degreeType), [major, degreeType]);
  const majorLabel = useMemo(() => subjectOptions.find((option) => option.value === majorKey)?.label ?? major, [subjectOptions, majorKey, major]);
  const countryOptions = useMemo(() => (filtersQuery.data?.countries ?? []).map((item) => ({ value: item, label: item })), [filtersQuery.data]);
  const savedUniversityIds = useMemo(() => new Set((applications.data?.data ?? []).map((app) => app.universityId).filter((id): id is string => Boolean(id))), [applications.data]);
  const setPage = (nextPage: number) => { const next = new URLSearchParams(params); next.set("page", String(nextPage)); setParams(next); };
  const setFilter = (key: "major" | "country", value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); next.delete("page"); setParams(next); };
  if (degreePending) return <ApplicantPage title="Find universities" subtitle="Loading your study goal…"><QueryState loading error={false} retry={overview.refetch}><span /></QueryState></ApplicantPage>;
  if (!isMasters) return <ApplicantPage title="Find universities" subtitle="Explore Bachelor’s options. Check course availability before adding a university to your College List.">
    <form role="search" className="applicant-find-search applicant-glass-search" onSubmit={(event) => { event.preventDefault(); const next = new URLSearchParams(params); if (value.trim()) next.set("q", value.trim()); else next.delete("q"); next.delete("page"); setParams(next); }}>
      <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Search universities" allowClear aria-label="Search universities" />
      <SearchButton type="submit" size={48} className="applicant-glass-search__btn" />
    </form>
    <div className="applicant-find-filters">
      <label className={major ? "applicant-find-filter applicant-find-filter--active" : "applicant-find-filter"}><span>Field of interest</span><Select value={majorKey || undefined} placeholder="Any field" allowClear showSearch optionFilterProp="label" onChange={(selected) => setFilter("major", selected ?? "")} loading={filtersQuery.isLoading} options={subjectOptions} aria-label="Field of interest" /></label>
      <label className={country ? "applicant-find-filter applicant-find-filter--active" : "applicant-find-filter"}><span>Destination</span><Select value={country || undefined} placeholder="Any country" allowClear showSearch optionFilterProp="label" onChange={(selected) => setFilter("country", selected ?? "")} loading={filtersQuery.isLoading} options={countryOptions} aria-label="Destination" /></label>
      <label className="applicant-find-filter applicant-find-filter--disabled" title="Intake dates are not available in the university catalogue"><span>Intake</span><Select value="Any intake" disabled options={[{ value: "Any intake", label: "Any intake" }]} aria-label="Intake unavailable" /></label>
    </div>
    {filtersQuery.isError && <Alert type="warning" message="Filters could not be loaded. Search is still available." />}
    <QueryState loading={isLoading} error={isError} retry={universityQuery.refetch}>
      <UniversityResults universities={universities} rankOffset={(page - 1) * UNIVERSITIES_PER_PAGE} selectedField={majorLabel} savedIds={savedUniversityIds} applicationsLoading={applications.isLoading} applicationsError={applications.isError} />
      {total > perPage && <ResultsPagination page={page} pageCount={Math.ceil(total / perPage)} onChange={setPage} />}
    </QueryState>
  </ApplicantPage>;
  return <ApplicantPage title={isMasters ? "Explore graduate study options" : "Explore universities"} subtitle={isMasters ? "Search verified graduate programs by program name or university." : "Search the verified TopCoach university catalogue."} actions={<Link to="/student-hub/applications">View your applications →</Link>}>
    <Breadcrumb>{isMasters ? "Graduate study options" : "Explore universities"}</Breadcrumb>
    <form role="search" className="applicant-search applicant-glass-search" onSubmit={(event) => { event.preventDefault(); const next = new URLSearchParams(params); if (value.trim()) next.set("q", value.trim()); else next.delete("q"); next.delete("page"); setParams(next); }}>
      <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder={isMasters ? "Search programs or universities" : "Search by university name"} allowClear />
      <SearchButton type="submit" size={48} className="applicant-glass-search__btn" />
    </form>
    <QueryState loading={isLoading} error={isError} retry={isMasters ? programsQuery.refetch : universityQuery.refetch}>
      <ProgramResults programs={masterPrograms} savedIds={new Set((applications.data?.data ?? []).map((app) => app.programId).filter((id): id is string => Boolean(id)))} />
      {total > perPage && <ResultsPagination page={page} pageCount={Math.ceil(total / perPage)} onChange={setPage} />}
    </QueryState>
    <p>{isMasters ? "Program requirements and funding are shown only when they are in the verified program record. Check the official source before applying." : "Confirm current programme and intake availability on each university’s official website."}</p>
  </ApplicantPage>;
}

/** Pages to show: first, last, and a window around the current one; null = gap. */
function paginationItems(page: number, pageCount: number): (number | null)[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? [null, n] : [n]));
}

function ResultsPagination({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (page: number) => void }) {
  const navRef = useRef<HTMLElement>(null);
  // Results scroll inside the workspace pane, not the window: bring the page top back into view.
  const go = (next: number) => { onChange(next); navRef.current?.closest(".applicant-page")?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
  return <nav ref={navRef} className="applicant-pager" aria-label="Results pages">
    <button type="button" className="applicant-pager__arrow" disabled={page <= 1} onClick={() => go(page - 1)} aria-label="Previous page"><ChevronLeft size={18} aria-hidden /></button>
    <ol className="applicant-pager__pages">
      {paginationItems(page, pageCount).map((item, index) => item === null
        ? <li key={`gap-${index}`} className="applicant-pager__gap" aria-hidden>…</li>
        : <li key={item}><button type="button" className={`applicant-pager__page${item === page ? " is-active" : ""}`} aria-current={item === page ? "page" : undefined} aria-label={`Page ${item}`} onClick={() => item !== page && go(item)}>{item}</button></li>)}
    </ol>
    <button type="button" className="applicant-pager__arrow" disabled={page >= pageCount} onClick={() => go(page + 1)} aria-label="Next page"><ChevronRight size={18} aria-hidden /></button>
  </nav>;
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

const UniversityResults = memo(function UniversityResults({ universities, rankOffset, selectedField, savedIds, applicationsLoading, applicationsError }: { universities: UniversitiesSchema[]; rankOffset: number; selectedField: string; savedIds: Set<string>; applicationsLoading: boolean; applicationsError: boolean }) {
  if (!universities.length) return <div className="applicant-panel applicant-empty"><Building2 size={36} /><h2>No universities match these filters.</h2><p>Try another search or adjust the field and destination filters.</p></div>;
  return <div className="applicant-find-results">{universities.map((university, index) => { const logoUrl = getUniversityLogoUrl(university); const ranking = universityRankingLabel(university, rankOffset + index + 1); return <div className="applicant-find-card" key={university.id}><div className="applicant-university"><span className={`applicant-university__logo${universityLogoNeedsDarkBackground(logoUrl) ? " applicant-university__logo--dark" : ""}${university.id === "1b921b70-2639-4d05-8559-36b77211852d" ? " applicant-university__logo--ucla" : ""}`}>{logoUrl ? <UniversityLogoImage src={logoUrl} name={getTranslation(university.name)} lazy /> : <Building2 size={28} aria-hidden />}</span><div><strong>{getTranslation(university.name)}</strong><p>{[getTranslation(university.location?.region), getTranslation(university.location?.country)].filter(Boolean).join(" · ")}</p><div className="applicant-find-tags"><span className="applicant-find-rank" title={ranking.title}>{ranking.label}</span><span className="applicant-find-degree">Bachelor’s</span></div></div></div><div className="applicant-find-card__actions"><Link to={`/student-hub/universities/${university.id}${selectedField ? `?field=${encodeURIComponent(selectedField)}` : ""}`}>View university <ArrowRight size={18} /></Link>{savedIds.has(university.id) ? <Link className="applicant-find-save" to="/student-hub/applications">In your list <ArrowRight size={17} /></Link> : <Link className={`applicant-find-save${applicationsLoading || applicationsError ? " applicant-find-save--disabled" : ""}`} aria-disabled={applicationsLoading || applicationsError} onClick={(event) => { if (applicationsLoading || applicationsError) event.preventDefault(); }} to={`/student-hub/applications/new?university=${encodeURIComponent(university.id)}`}><BookmarkPlus size={18} /> Add to list</Link>}</div></div>; })}</div>;
});

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
  const collegeList: CollegeListEntry[] = [...new Map((applications.data?.data ?? [])
    .filter((app) => app.degreeLevel === "bachelor" && app.universityId && app.universityId !== universityId && app.universityName)
    .map((app) => [app.universityId!, { universityId: app.universityId!, universityName: app.universityName! }] as const)).values()];
  const loading = programId ? programQuery.isLoading : universityQuery.isLoading;
  const error = programId ? programQuery.isError || (!programQuery.isLoading && !program) : universityQuery.isError || (!universityQuery.isLoading && !university);
  if (!programId) return <section className="applicant-page applicant-university-detail">
    <ApplicantMobileTrail><Link to={`/student-hub/universities${selectedField ? `?major=${encodeURIComponent(selectedField)}` : ""}`}>Find universities</Link><span> / </span>{university ? getTranslation(university.name) : "University"}</ApplicantMobileTrail>
    {loading ? <UniversityDetailSkeleton /> : <QueryState loading={false} error={error} retry={universityQuery.refetch}>
      {university && <BachelorUniversityDetail university={university} selectedField={selectedField} collegeList={collegeList} existingId={existing?.id} applicationsUnavailable={applications.isLoading || applications.isError} onAdd={() => navigate(`/student-hub/applications/new?university=${encodeURIComponent(universityId)}`)} onOpen={() => existing && navigate(`/student-hub/applications/${existing.id}`)} />}
    </QueryState>}
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

function UniversityLogoImage({ src, name, lazy = false }: { src: string; name: string; lazy?: boolean }) {
  const [failed, setFailed] = useState(false);
  // List logos are 64px tiles, many of them below the fold: fetch them lazily and decode off the main thread.
  return failed ? <Building2 size={30} aria-hidden="true" /> : <img src={src} alt={`${name} logo`} onError={() => setFailed(true)} {...(lazy ? { loading: "lazy" as const, decoding: "async" as const, width: 64, height: 64 } : {})} />;
}

function BachelorUniversityDetail({ university, selectedField, collegeList, existingId, applicationsUnavailable, onAdd, onOpen }: {
  university: UniversitiesSchema;
  selectedField: string;
  collegeList: CollegeListEntry[];
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
    .sort((a, b) => Number(subjectKey(b.value) === subjectKey(selectedField)) - Number(subjectKey(a.value) === subjectKey(selectedField)));
  const matchingCatalogueFieldCount = catalogueFields.filter((field) => subjectKey(field.value) === subjectKey(selectedField)).length;
  const name = getTranslation(university.name);
  const location = [getTranslation(university.location?.region), getTranslation(university.location?.country)].filter(Boolean).join(", ");
  const logoUrl = getUniversityLogoUrl(university);
  const degreeOptions = buildDegreeOptions({
    universityId: university.id, degrees, selectedField, majors: university.majors ?? [],
    links: (university as UniversityProfileContent & { verifiedProgramLinks?: import('src/app/services/universities').VerifiedProgramLink[] }).verifiedProgramLinks ?? [],
    fields: catalogueFields.filter(field => !degrees.some(degree => degreeMatchesField(degree, field.value) || normalizeStudyArea(degree.name) === normalizeStudyArea(field.value))),
  });
  const keyFacts = buildKeyFactRows(university, (value) => getTranslation(value as never));
  const qs = (university.rankings ?? []).find((item) => item?.type === "QS" && Number.isFinite(item.rank) && item.rank > 0);
  const hasVerifiedStudyAreaContent = ((university as { verifiedStudyAreaContent?: unknown[] }).verifiedStudyAreaContent?.length ?? 0) > 0;
  const structured = useStructuredContent(university);
  const glanceTiles = buildGlanceTiles(keyFacts, finance?.content, structured);
  const admissionDeadlines = keyFacts.filter((row) => row.id === "deadlines" || row.id === "deadlines-past");
  const admissionExams = keyFacts.find((row) => row.id === "exams")?.chips ?? [];
  const cmsTuition = keyFacts.find((row) => row.id === "tuition")?.lines?.map((line) => line.text).join("\n");
  const cmsScholarships = buildScholarshipText(university, (value) => getTranslation(value as never))
    ?? ((profile.fundingIntro || profile.fundingDetail) ? { text: [profile.fundingIntro, profile.fundingDetail].filter(Boolean).join("\n\n"), url: profile.fundingPolicyUrl ?? profile.fundingUrl ?? undefined } : undefined);
  const hasLife = !!(profile.studentLifeIntro || profile.studentLifeDetail);
  const showCosts = !!finance || !!cmsTuition || !!cmsScholarships || hasStructuredCosts(structured);
  const hasStructuredAdmissions = !!structured && (structured.deadlines.length > 0 || structured.entryRequirements.some((item) => item.status === "required"));

  const navItems = [
    glanceTiles.length ? { id: "ud-glance", label: "At a glance" } : null,
    { id: "ud-study-areas", label: "Study areas" },
    showCosts ? { id: "ud-costs", label: "Costs & funding" } : null,
    admissionDeadlines.length || admissionExams.length || hasStructuredAdmissions ? { id: "ud-admissions", label: "Admissions" } : null,
    hasLife ? { id: "ud-life", label: "Life" } : null,
  ].filter((item): item is { id: string; label: string } => !!item);

  return <div className="applicant-university-detail__layout">
    <DetailHero
      mark={<span className={`applicant-university-detail__mark${logoUrl ? " applicant-university-detail__mark--logo" : ""}${universityLogoNeedsDarkBackground(logoUrl) ? " applicant-university-detail__mark--dark" : ""}${university.id === "1b921b70-2639-4d05-8559-36b77211852d" ? " applicant-university-detail__mark--ucla" : ""}`}>{logoUrl ? <UniversityLogoImage src={logoUrl} name={name} /> : <Building2 size={30} aria-hidden="true" />}</span>}
      title={name} titleText={name}
      meta={<>
        {location && <span>{location}</span>}
        {qs && <span>#{qs.rank} in QS ranking</span>}
        {profile.officialWebsiteUrl && <a href={profile.officialWebsiteUrl} target="_blank" rel="noopener noreferrer">Official website <ArrowUpRight size={14} aria-hidden="true" /></a>}
      </>}
      overview={profile.profileOverview || undefined}
      action={<SaveToListButton saved={!!existingId} disabled={applicationsUnavailable} onAdd={onAdd} onOpen={onOpen} />}
      notice={applicationsUnavailable ? <p className="applicant-university-detail__notice">College List is temporarily unavailable. You can still explore this university.</p> : undefined}
    />
    <UniversitySectionNav items={navItems} />
    <UniversityGlance tiles={glanceTiles} compare={{ id: university.id, name: shortUniversityName(name), facts: buildComparableFacts(keyFacts, finance?.content, qsRankOf(university), structured), list: collegeList }} />

    <section id="ud-study-areas" className="applicant-university-detail__degrees">
      <h2>Explore undergraduate degrees</h2>
      {selectedField && degrees.length > 0 && matchingDegreeCount === 0 && <p className="applicant-university-detail__degree-note">We have not verified a degree matching {selectedField} yet. These are the other degrees currently reviewed for {name}.</p>}
      {selectedField && degrees.length === 0 && catalogueFields.length > 0 && matchingCatalogueFieldCount === 0 && <p className="applicant-university-detail__degree-note">The current catalogue does not list {selectedField} for {name}. These are its other undergraduate study areas.</p>}
      {degreesQuery.isError && <div className="applicant-university-detail__pending"><p>Degree details could not be loaded.</p><Button onClick={() => degreesQuery.refetch()}>Try again</Button></div>}
      {!degreesQuery.isError && <UniversityDegreeFinder options={degreeOptions} loading={degreesQuery.isLoading} getPreview={(option) => buildPreview(option, { universityId: university.id, degrees: degreesQuery.data ?? [], majors: university.majors ?? [], links: (university as { verifiedProgramLinks?: import("src/app/services/universities").VerifiedProgramLink[] }).verifiedProgramLinks ?? [], content: (university as { verifiedStudyAreaContent?: import("./verifiedStudyAreaContent").VerifiedStudyAreaContent[] }).verifiedStudyAreaContent ?? [] })} />}
      {profile.undergraduateCoursesUrl && <div className="applicant-university-detail__degree-tools applicant-university-detail__degree-tools--muted"><a href={profile.undergraduateCoursesUrl} target="_blank" rel="noreferrer">All undergraduate majors on the official site <ArrowUpRight size={17} aria-hidden="true" /></a></div>}
      {!degreesQuery.isLoading && !degreesQuery.isError && !degrees.length && !catalogueFields.length && <div className="applicant-university-detail__pending"><h3>Course details are being verified</h3><p>We do not have a confirmed undergraduate course list for this university yet.</p></div>}
    </section>

    {showCosts && <CostsFundingSection
      tuition={finance ? { text: finance.content.feesSummary, url: finance.content.feesUrl, linkLabel: "Official tuition and fee details" } : { text: cmsTuition, linkLabel: "" }}
      funding={finance ? { text: [finance.content.fundingSummary, finance.content.fundingPolicyNote].filter(Boolean).join("\n\n"), url: finance.content.fundingPolicyUrl, linkLabel: "Official scholarships and funding policy" } : { text: cmsScholarships?.text, url: cmsScholarships?.url, linkLabel: "Official page" }}
      checked={finance ? displayDate(finance.verifiedAt) : undefined}
      structured={structured}
    />}
    <UniversityAdmissions deadlines={admissionDeadlines} exams={admissionExams} structured={structured} />
    {hasLife && <section id="ud-life" className="applicant-university-detail__life"><h2>Life at {shortUniversityName(name)}</h2>{profile.studentLifeIntro && <p>{profile.studentLifeIntro}</p>}{profile.studentLifeHighlight && <strong>{profile.studentLifeHighlight}</strong>}{profile.studentLifeDetail && <p>{profile.studentLifeDetail}</p>}{profile.studentLifeUrl && <a href={profile.studentLifeUrl} target="_blank" rel="noopener noreferrer">Explore campus life <ArrowUpRight size={17} aria-hidden="true" /></a>}</section>}
    {(() => {
      // Latest check date among the sources this page actually shows.
      const checkedAt = [profile.profileVerifiedAt, structured?.verifiedAt].filter((value): value is string => !!value && Number.isFinite(Date.parse(value))).sort().pop();
      if (checkedAt) return <p className="applicant-university-detail__source">Information from the university's official pages · Checked {displayDate(checkedAt)}</p>;
      // Placeholder only when nothing checked is on the page.
      if (!finance && !hasVerifiedStudyAreaContent && !structured) return <p className="applicant-university-detail__source">Course, campus and funding details will appear after source review.</p>;
      return null;
    })()}
  </div>;
}
