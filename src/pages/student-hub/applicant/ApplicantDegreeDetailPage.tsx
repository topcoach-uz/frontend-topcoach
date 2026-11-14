import { useState, type ReactNode } from 'react';
import { Select } from 'antd';
import { applicationPlanHref, qualificationOptions, selectedQualification } from './degreePlanning';
import { ArrowRight, ArrowUpRight, Building2 } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { UniversitiesSchema } from 'src/app/api/Api';
import { useGetUniversityDetailQuery } from 'src/app/services/universities';
import { useGetCollegeApplicationsQuery } from 'src/app/services/student-hub/applicationTrackingApi';
import { useGetUndergraduateDegreeQuery, type UndergraduateDegree } from 'src/app/services/undergraduateDegreesApi';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import { QueryState, displayDate } from './ApplicantPage';
import { ApplicantMobileTrail } from './ApplicantTopBarContext';
import { ClampedText } from './ClampedText';
import { DetailHero, SaveToListButton } from './DetailHero';
import { awardedQualification, buildDegreeGlance } from './degreeFactsModel';
import { CostsFundingSection, UniversityDetailSkeleton, UniversityGlance, UniversitySectionNav } from './UniversitySections';
import { shortUniversityName } from './universityKeyFactsModel';
import { universityLogoNeedsDarkBackground } from './universityLogo';
import { withVerifiedUniversityFinance } from './verifiedUniversityFinance';
import './applicantDegreeDetail.scss';

function DegreeUniversityLogo({ url, name }: { url?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const classes = [
    'applicant-university-detail__mark',
    url && !failed && 'applicant-university-detail__mark--logo',
    universityLogoNeedsDarkBackground(url) && 'applicant-university-detail__mark--dark',
    url?.includes('ucla.edu/img/logo-ucla.svg') && 'applicant-university-detail__mark--ucla',
  ].filter(Boolean).join(' ');
  return <span className={classes}>{url && !failed
    ? <img src={url} alt={name + ' logo'} onError={() => setFailed(true)} />
    : <Building2 size={28} aria-hidden="true" />}</span>;
}

function OfficialLink({ href, children }: { href?: string | null; children: ReactNode }) {
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">{children} <ArrowUpRight size={17} aria-hidden="true" /></a> : null;
}

export default function ApplicantDegreeDetailPage() {
  const { universityId = '', degreeSlug = '' } = useParams();
  const [params] = useSearchParams();
  const field = params.get('field')?.trim() ?? '';
  const universityQuery = useGetUniversityDetailQuery(universityId, { skip: !universityId });
  const degreeQuery = useGetUndergraduateDegreeQuery({ universityId, slug: degreeSlug }, { skip: !universityId || !degreeSlug });
  const university = universityQuery.data;
  const degree = degreeQuery.data;
  const name = university ? getTranslation(university.name) : 'University';
  const universityHref = '/student-hub/universities/' + universityId + (field ? '?field=' + encodeURIComponent(field) : '');
  const logoUrl = (university as typeof university & { logoUrl?: string | null } | undefined)?.logoUrl ?? undefined;
  const degreeMissing = degreeQuery.error && 'status' in degreeQuery.error && degreeQuery.error.status === 404;

  return <section className="applicant-page applicant-degree-page applicant-university-detail">
    <ApplicantMobileTrail><Link to="/student-hub/universities">Find universities</Link><span> / </span><Link to={universityHref}>{name}</Link><span> / </span>{degree?.name ?? 'Degree'}</ApplicantMobileTrail>
    {universityQuery.isLoading || degreeQuery.isLoading ? <UniversityDetailSkeleton /> : <QueryState loading={false} error={universityQuery.isError || (degreeQuery.isError && !degreeMissing)} retry={() => { universityQuery.refetch(); degreeQuery.refetch(); }}>
      {university && degree ? <DegreeContent key={degree.id}
        universityName={name}
        location={[getTranslation(university.location?.region), getTranslation(university.location?.country)].filter(Boolean).join(', ')}
        logoUrl={logoUrl}
        universityHref={universityHref}
        deadlines={university.deadlines ?? []}
        degree={withVerifiedUniversityFinance(degree, university.undergraduateFinanceContent)}
      /> : <div className="applicant-degree-page__missing"><h1>Degree not found</h1><p>This university has no published record for this degree.</p><Link to={universityHref}>Return to university <ArrowRight size={17} aria-hidden="true" /></Link></div>}
    </QueryState>}
  </section>;
}

const GUIDANCE_PREFIX = /^University guidance:\s*/i;

export function DegreeContent({ universityName, location, logoUrl, degree, saveHrefOverride, studyArea = false, universityHref, deadlines = [] }: {
  universityName: string;
  location: string;
  logoUrl?: string;
  degree: UndergraduateDegree;
  saveHrefOverride?: string;
  studyArea?: boolean;
  universityHref?: string;
  deadlines?: UniversitiesSchema['deadlines'];
}) {
  const navigate = useNavigate();
  const applications = useGetCollegeApplicationsQuery({ page: 1, limit: 100 });
  const [qualification, setQualification] = useState(() => qualificationOptions(degree)[0].value);
  const publishedQualification = selectedQualification(degree, qualification);
  const saveHref = saveHrefOverride ?? '/student-hub/applications/new?university=' + encodeURIComponent(degree.universityId)
    + '&undergraduateDegreeId=' + encodeURIComponent(degree.id) + '&degreeLevel=bachelor';
  const existing = applications.data?.data.find(app => app.universityId === degree.universityId
    && (studyArea ? !app.undergraduateDegreeId && app.major === degree.name : app.undergraduateDegreeId === degree.id));
  const shortName = shortUniversityName(universityName);
  const tiles = buildDegreeGlance(degree, deadlines ?? [], value => getTranslation(value as never));
  const studyText = [degree.description, degree.curriculumSummary].filter(Boolean).join('\n\n');
  const feesText = degree.feesSummary?.replace(GUIDANCE_PREFIX, '');
  const fundingText = [degree.fundingSummary?.replace(GUIDANCE_PREFIX, ''), degree.fundingPolicyNote].filter(Boolean).join('\n\n');
  const showCosts = !!(feesText || fundingText);
  const curriculumHref = degree.curriculumUrl ?? degree.officialDegreeUrl;
  const checked = Number.isFinite(Date.parse(degree.verifiedAt)) ? displayDate(degree.verifiedAt) : undefined;
  const awarded = awardedQualification(degree.degreeType);
  const navItems = [
    { id: 'ud-study', label: 'What you’ll study' },
    { id: 'ud-entry', label: 'Entry requirements' },
    showCosts ? { id: 'ud-costs', label: 'Costs & funding' } : null,
    { id: 'ud-apply', label: 'How to apply' },
  ].filter((item): item is { id: string; label: string } => !!item);

  return <div className="applicant-university-detail__layout">
    <DetailHero
      mark={<DegreeUniversityLogo url={logoUrl} name={universityName} />}
      title={degree.name} titleText={degree.name}
      subtitle={awarded}
      meta={<>
        <span>{universityHref ? <Link to={universityHref}>{shortName}</Link> : shortName}</span>
        {location && <span>{location}</span>}
      </>}
      action={<SaveToListButton saved={!!existing} disabled={applications.isLoading} onAdd={() => navigate(saveHref)} onOpen={() => existing && navigate('/student-hub/applications/' + existing.id)} />}
    />
    <UniversitySectionNav items={navItems} />
    <UniversityGlance tiles={tiles} />

    <section id="ud-study" className="applicant-university-detail__card"><h2>What you’ll study</h2>
      {studyText ? <ClampedText text={studyText} /> : <p>Curriculum details have not been verified in the catalogue.</p>}
      {degree.firstYearSubjects && <p className="applicant-degree-page__plain">{degree.firstYearSubjects}</p>}
      <div className="applicant-degree-page__links">
        <OfficialLink href={curriculumHref}>{studyText ? 'Official curriculum source' : 'Explore the curriculum'}</OfficialLink>
        {degree.officialDegreeUrl && degree.officialDegreeUrl !== curriculumHref && <OfficialLink href={degree.officialDegreeUrl}>{studyArea ? 'Official programme information' : 'Official degree page'}</OfficialLink>}
      </div>
    </section>

    <section id="ud-entry" className="applicant-university-detail__card"><h2>Entry requirements</h2>
      {degree.entrySummary ? <ClampedText text={degree.entrySummary} /> : <p>Degree-specific entry requirements have not been verified in the catalogue.</p>}
      <div className="applicant-degree-page__qualification">
        <div className="applicant-degree-page__qualification-control"><label htmlFor="degree-qualification">Published qualification</label><Select id="degree-qualification" aria-label="Published qualification" value={qualification} onChange={setQualification} options={qualificationOptions(degree)} popupClassName="applicant-university-detail__finder-popup" /></div>
        {publishedQualification ? <>
          <p className="applicant-degree-page__plain">{publishedQualification.value}{publishedQualification.note && ` — ${publishedQualification.note}`}</p>
          {publishedQualification.sourceUrl && <p className="applicant-university-detail__checked"><a href={publishedQualification.sourceUrl} target="_blank" rel="noopener noreferrer">{publishedQualification.sourceTitle || 'Official source'}</a>{publishedQualification.verifiedAt && ` · Checked ${displayDate(publishedQualification.verifiedAt)}`}</p>}
        </> : <p className="applicant-university-detail__checked">{qualification} requirements have not been verified in this catalogue. Check the university’s official requirements for your qualification.</p>}
        <p className="applicant-degree-page__disclaimer">Published requirements—not a personal eligibility result.</p>
      </div>
      {degree.admissionsTest && <p className="applicant-degree-page__plain">{degree.admissionsTest}{degree.admissionsTestNote && ` — ${degree.admissionsTestNote}`}</p>}
      <div className="applicant-degree-page__links"><OfficialLink href={degree.requirementsUrl}>{degree.entrySummary ? 'Official entry requirements' : 'Read official requirements'}</OfficialLink></div>
    </section>

    {showCosts && <CostsFundingSection
      tuition={{ text: feesText, url: degree.feesUrl ?? undefined, linkLabel: 'Official tuition and fee details' }}
      funding={{ text: fundingText, url: degree.fundingPolicyUrl ?? undefined, linkLabel: 'Official scholarships and funding policy' }}
      checked={checked}
    />}

    <section id="ud-apply" className="applicant-university-detail__card"><h2>How to apply</h2>
      {degree.applicationSummary ? <ClampedText text={degree.applicationSummary} /> : <p>Application guidance has not been verified in the catalogue.</p>}
      {degree.deadlineNote && <p className="applicant-university-detail__checked">{degree.deadlineNote}</p>}
      <div className="applicant-degree-page__links">
        <OfficialLink href={degree.applicationUrl}>Official application guide</OfficialLink>
      </div>
      <div className="applicant-degree-page__cta"><button type="button" className="applicant-university-detail__save" onClick={() => navigate(applicationPlanHref(saveHref, []))}>Plan my application</button></div>
    </section>

    <p className="applicant-university-detail__source">{degree.sourceUrl ? <a href={degree.sourceUrl} target="_blank" rel="noopener noreferrer">{degree.sourceTitle} <ArrowUpRight size={14} aria-hidden="true" /></a> : 'Official programme source has not yet been verified.'}</p>
  </div>;
}
