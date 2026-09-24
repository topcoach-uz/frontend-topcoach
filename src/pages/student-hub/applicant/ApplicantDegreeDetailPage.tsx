import { useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Building2 } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useGetUniversityDetailQuery } from 'src/app/services/universities';
import { useGetUndergraduateDegreeQuery, type UndergraduateDegree } from 'src/app/services/undergraduateDegreesApi';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import { QueryState, displayDate } from './ApplicantPage';
import { ApplicantMobileTrail } from './ApplicantTopBarContext';
import { universityLogoNeedsDarkBackground } from './universityLogo';
import './applicantDegreeDetail.scss';

function DegreeUniversityLogo({ url, name }: { url?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const classes = [
    'applicant-degree-page__logo',
    url && !failed && 'applicant-degree-page__logo--image',
    universityLogoNeedsDarkBackground(url) && 'applicant-degree-page__logo--dark',
    url?.includes('ucla.edu/img/logo-ucla.svg') && 'applicant-degree-page__logo--ucla',
  ].filter(Boolean).join(' ');
  return <span className={classes}>{url && !failed
    ? <img src={url} alt={name + ' logo'} onError={() => setFailed(true)} />
    : <Building2 size={28} aria-hidden="true" />}</span>;
}

function OfficialLink({ href, children }: { href?: string | null; children: ReactNode }) {
  return href ? <a href={href} target="_blank" rel="noreferrer">{children} <ArrowUpRight size={18} aria-hidden="true" /></a> : null;
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

  return <section className="applicant-page applicant-degree-page">
    <ApplicantMobileTrail><Link to="/student-hub/universities">Find universities</Link><span> / </span><Link to={universityHref}>{name}</Link><span> / </span>{degree?.name ?? 'Degree'}</ApplicantMobileTrail>
    <QueryState loading={universityQuery.isLoading || degreeQuery.isLoading} error={universityQuery.isError || (degreeQuery.isError && !degreeMissing)} retry={() => { universityQuery.refetch(); degreeQuery.refetch(); }}>
      {university && degree ? <DegreeContent
        universityName={name}
        location={[getTranslation(university.location?.region), getTranslation(university.location?.country)].filter(Boolean).join(', ')}
        logoUrl={logoUrl}
        degree={degree}
      /> : <div className="applicant-degree-page__missing"><h1>Degree not found</h1><p>This university has no published record for this degree.</p><Link to={universityHref}>Return to university <ArrowRight size={17} aria-hidden="true" /></Link></div>}
    </QueryState>
  </section>;
}

function DegreeContent({ universityName, location, logoUrl, degree }: {
  universityName: string;
  location: string;
  logoUrl?: string;
  degree: UndergraduateDegree;
}) {
  const saveHref = '/student-hub/applications/new?university=' + encodeURIComponent(degree.universityId)
    + '&undergraduateDegreeId=' + encodeURIComponent(degree.id) + '&degreeLevel=bachelor';
  return <>
    <header className="applicant-degree-page__hero">
      <div className="applicant-degree-page__university"><DegreeUniversityLogo url={logoUrl} name={universityName} /><div><strong>{universityName}</strong>{location && <p>{location}</p>}</div></div>
      <span className="applicant-degree-page__eyebrow">UNDERGRADUATE DEGREE</span>
      <h1>{degree.name}</h1>
      <p className="applicant-degree-page__degree-type">{degree.degreeType}</p>
      <div className="applicant-degree-page__facts">
        {degree.durationYears && <span>{degree.durationYears} years</span>}
        {degree.studyMode && <span>{degree.studyMode}</span>}
        {degree.courseCode && <span>{degree.courseCode}</span>}
        {!degree.durationYears && !degree.studyMode && !degree.courseCode && <span>Course details pending verification</span>}
      </div>
    </header>

    <div className="applicant-degree-page__columns">
      <div className="applicant-degree-page__main">
        <section className="applicant-degree-page__section"><h2>What you’ll study</h2>
          {degree.description && <p>{degree.description}</p>}
          {degree.curriculumSummary && <p>{degree.curriculumSummary}</p>}
          {degree.firstYearSubjects && <p className="applicant-degree-page__fact-box">{degree.firstYearSubjects}</p>}
          {!degree.description && !degree.curriculumSummary && <p>Curriculum details have not been verified in the catalogue.</p>}
          <OfficialLink href={degree.curriculumUrl ?? degree.officialDegreeUrl}>Explore the curriculum</OfficialLink>
        </section>
        <section className="applicant-degree-page__section"><h2>Entry requirements</h2>
          <p>{degree.entrySummary ?? 'Degree-specific entry requirements have not been verified in the catalogue.'}</p>
          {degree.qualificationValue && <div className="applicant-degree-page__qualification"><span>{degree.qualificationLabel}</span><strong>{degree.qualificationValue}</strong>{degree.qualificationNote && <p>{degree.qualificationNote}</p>}</div>}
          {degree.admissionsTest && <p className="applicant-degree-page__fact-box">{degree.admissionsTest}{degree.admissionsTestNote && <span>{degree.admissionsTestNote}</span>}</p>}
          <OfficialLink href={degree.requirementsUrl}>Read official requirements</OfficialLink>
        </section>
        <details className="applicant-degree-page__disclosure"><summary>Fees &amp; funding</summary><div>
          <p>{degree.feesSummary ?? 'Current fees have not been verified in the catalogue.'}</p>
          {degree.fundingSummary && <p>{degree.fundingSummary}</p>}
          {degree.fundingPolicyNote && <p>{degree.fundingPolicyNote}</p>}
          <OfficialLink href={degree.feesUrl}>Official fees</OfficialLink>
          <OfficialLink href={degree.fundingPolicyUrl}>Funding policy</OfficialLink>
        </div></details>
        <details className="applicant-degree-page__disclosure"><summary>How to apply</summary><div>
          <p>{degree.applicationSummary ?? 'Application guidance has not been verified in the catalogue.'}</p>
          <OfficialLink href={degree.applicationUrl}>Official application guide</OfficialLink>
        </div></details>
      </div>

      <aside className="applicant-degree-page__side"><div className="applicant-degree-page__save">
        <h2>Keep your options open</h2><p>Save this degree to revisit with your other choices.</p>
        <Link className="applicant-degree-page__primary" to={saveHref}>Save to College List</Link>
        <a className="applicant-degree-page__secondary" href={degree.officialDegreeUrl} target="_blank" rel="noreferrer">Official degree page <ArrowUpRight size={18} aria-hidden="true" /></a>
        <div className="applicant-degree-page__deadline"><span>APPLICATION DEADLINE</span>
          <strong>{degree.deadlineAt ? displayDate(degree.deadlineAt) : 'Not yet verified'}</strong>
          {degree.deadlineNote && <p>{degree.deadlineNote}</p>}
          <OfficialLink href={degree.applicationUrl}>Application dates</OfficialLink>
        </div>
        <Link className="applicant-degree-page__plan" to={saveHref}>Plan my application <span aria-hidden="true">+</span></Link>
      </div><p className="applicant-degree-page__source">Degree source: <a href={degree.sourceUrl} target="_blank" rel="noreferrer">{degree.sourceTitle} <ArrowUpRight size={14} aria-hidden="true" /></a><br />Checked {displayDate(degree.verifiedAt)}</p></aside>
    </div>
  </>;
}
