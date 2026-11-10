import { useState, type ReactNode } from 'react';
import { Select } from 'antd';
import { applicationPlanHref, planningSteps, qualificationOptions, selectedQualification, type PlanningStepId } from './degreePlanning';
import { ArrowRight, ArrowUpRight, Building2 } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useGetUniversityDetailQuery } from 'src/app/services/universities';
import { useGetUndergraduateDegreeQuery, type UndergraduateDegree } from 'src/app/services/undergraduateDegreesApi';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import { QueryState, displayDate } from './ApplicantPage';
import { ApplicantMobileTrail } from './ApplicantTopBarContext';
import { universityLogoNeedsDarkBackground } from './universityLogo';
import { withVerifiedUniversityFinance } from './verifiedUniversityFinance';
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
      {university && degree ? <DegreeContent key={degree.id}
        universityName={name}
        location={[getTranslation(university.location?.region), getTranslation(university.location?.country)].filter(Boolean).join(', ')}
        logoUrl={logoUrl}
        degree={withVerifiedUniversityFinance(degree, university.undergraduateFinanceContent)}
      /> : <div className="applicant-degree-page__missing"><h1>Degree not found</h1><p>This university has no published record for this degree.</p><Link to={universityHref}>Return to university <ArrowRight size={17} aria-hidden="true" /></Link></div>}
    </QueryState>
  </section>;
}

export function DegreeContent({ universityName, location, logoUrl, degree, saveHrefOverride, studyArea = false }: {
  universityName: string;
  location: string;
  logoUrl?: string;
  degree: UndergraduateDegree;
  saveHrefOverride?: string;
  studyArea?: boolean;
}) {
  const [qualification, setQualification] = useState(() => qualificationOptions(degree)[0].value);
  const [completedSteps, setCompletedSteps] = useState<PlanningStepId[]>([]);
  const publishedQualification = selectedQualification(degree, qualification);
  const saveHref = saveHrefOverride ?? '/student-hub/applications/new?university=' + encodeURIComponent(degree.universityId)
    + '&undergraduateDegreeId=' + encodeURIComponent(degree.id) + '&degreeLevel=bachelor';
  return <>
    <header className="applicant-degree-page__hero">
      <div className="applicant-degree-page__university"><DegreeUniversityLogo url={logoUrl} name={universityName} /><div><strong>{universityName}</strong>{location && <p>{location}</p>}</div></div>
      <span className="applicant-degree-page__eyebrow">{studyArea ? 'UNDERGRADUATE STUDY AREA' : 'UNDERGRADUATE DEGREE'}</span>
      <h1>{degree.name}</h1>
      <p className="applicant-degree-page__degree-type">{degree.degreeType}</p>
      <div className="applicant-degree-page__facts">
        {degree.durationYears && <span>{degree.durationYears} years</span>}
        {degree.studyMode && <span>{degree.studyMode}</span>}
        {degree.courseCode && <span>{degree.courseCode}</span>}
        {!degree.durationYears && !degree.studyMode && !degree.courseCode && !degree.description && !degree.curriculumSummary && <span>Course details pending verification</span>}
      </div>
    </header>

    <div className="applicant-degree-page__columns">
      <div className="applicant-degree-page__main">
        <section className="applicant-degree-page__section"><h2>What you’ll study</h2>
          {degree.description && <p>{degree.description}</p>}
          {degree.curriculumSummary && <p>{degree.curriculumSummary}</p>}
          {degree.firstYearSubjects && <p className="applicant-degree-page__fact-box">{degree.firstYearSubjects}</p>}
          {!degree.description && !degree.curriculumSummary && <p>Curriculum details have not been verified in the catalogue.</p>}
          <OfficialLink href={degree.curriculumUrl ?? degree.officialDegreeUrl}>{degree.description || degree.curriculumSummary ? 'Official curriculum source' : 'Explore the curriculum'}</OfficialLink>
        </section>
        <section className="applicant-degree-page__section"><h2>Entry requirements</h2>
          <p>{degree.entrySummary ?? 'Degree-specific entry requirements have not been verified in the catalogue.'}</p>
          <div className="applicant-degree-page__qualification">
            <div className="applicant-degree-page__qualification-control"><label htmlFor="degree-qualification">Published qualification</label><Select id="degree-qualification" aria-label="Published qualification" value={qualification} onChange={setQualification} options={qualificationOptions(degree)} /></div>
            {publishedQualification ? <><strong>{publishedQualification.value}</strong>{publishedQualification.note && <p>{publishedQualification.note}</p>}{publishedQualification.scope && <p className="applicant-degree-page__note">{publishedQualification.scope}</p>}{publishedQualification.sourceUrl && <><OfficialLink href={publishedQualification.sourceUrl}>{publishedQualification.sourceTitle}</OfficialLink><p className="applicant-degree-page__note">Requirements checked {displayDate(publishedQualification.verifiedAt)}</p></>}</> : <p className="applicant-degree-page__note">{qualification} requirements have not been verified in this catalogue. Check the university’s official requirements for your qualification.</p>}
            <p className="applicant-degree-page__note">Published requirements—not a personal eligibility result.</p>
          </div>
          {degree.admissionsTest && <p className="applicant-degree-page__fact-box">{degree.admissionsTest}{degree.admissionsTestNote && <span>{degree.admissionsTestNote}</span>}</p>}
          <OfficialLink href={degree.requirementsUrl}>{degree.entrySummary ? 'Official entry requirements' : 'Read official requirements'}</OfficialLink>
        </section>
        <details className="applicant-degree-page__disclosure"><summary>Fees &amp; funding</summary><div>
          <section><h3>Tuition and fees</h3>
            <p>{degree.feesSummary ?? 'Current fees have not been verified in the catalogue.'}</p>
            <OfficialLink href={degree.feesUrl}>Official tuition and fee details</OfficialLink>
          </section>
          <section><h3>Scholarships and financial support</h3>
            <p>{degree.fundingSummary ?? 'International undergraduate funding details have not been verified in the catalogue.'}</p>
            {degree.fundingPolicyNote && <p>{degree.fundingPolicyNote}</p>}
            <OfficialLink href={degree.fundingPolicyUrl}>Official scholarships and funding policy</OfficialLink>
          </section>
        </div></details>
        <details className="applicant-degree-page__disclosure"><summary>How to apply</summary><div>
          <p>{degree.applicationSummary ?? 'Application guidance has not been verified in the catalogue.'}</p>
          <OfficialLink href={degree.applicationUrl}>Official application guide</OfficialLink>
        </div></details>
      </div>

      <aside className="applicant-degree-page__side"><div className="applicant-degree-page__save">
        <h2>Keep your options open</h2><p>Save this degree to revisit with your other choices.</p>
        <Link className="applicant-degree-page__primary" to={saveHref}>Save to College List</Link>
        {degree.officialDegreeUrl && <a className="applicant-degree-page__secondary" href={degree.officialDegreeUrl} target="_blank" rel="noreferrer">{studyArea ? 'Official programme information' : 'Official degree page'} <ArrowUpRight size={18} aria-hidden="true" /></a>}
        <div className="applicant-degree-page__deadline"><span>APPLICATION DEADLINE</span>
          <strong>{degree.deadlineAt ? displayDate(degree.deadlineAt) : 'Not yet verified'}</strong>
          {degree.deadlineNote && <p>{degree.deadlineNote}</p>}
          <OfficialLink href={degree.applicationUrl}>Application dates</OfficialLink>
        </div>
        <details className="applicant-degree-page__planning">
          <summary className="applicant-degree-page__plan">Plan my application</summary>
          <div className="applicant-degree-page__planning-body">
            <fieldset><legend className="applicant-sr-only">Application planning checklist</legend>{planningSteps.map(step => <label key={step.id}><input type="checkbox" checked={completedSteps.includes(step.id)} onChange={event => setCompletedSteps(current => event.target.checked ? [...current, step.id] : current.filter(id => id !== step.id))} />{step.title}</label>)}</fieldset>
            <p>{completedSteps.length} of {planningSteps.length} planning steps complete</p>
            <p className="applicant-degree-page__note">Your checklist is a preview until you save the application. Submit through the university’s official platform.</p>
            <Link className="applicant-degree-page__primary" to={applicationPlanHref(saveHref, completedSteps)}>Continue with this plan</Link>
          </div>
        </details>
      </div><p className="applicant-degree-page__source">{degree.sourceUrl ? <a href={degree.sourceUrl} target="_blank" rel="noreferrer">{degree.sourceTitle} <ArrowUpRight size={14} aria-hidden="true" /></a> : 'Official programme source has not yet been verified.'}{degree.verifiedAt && <><br />Checked {displayDate(degree.verifiedAt)}</>}</p></aside>
    </div>
  </>;
}
