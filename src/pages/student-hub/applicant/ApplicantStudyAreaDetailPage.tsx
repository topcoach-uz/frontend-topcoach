import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useGetUniversityDetailQuery } from 'src/app/services/universities';
import type { UndergraduateDegree } from 'src/app/services/undergraduateDegreesApi';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import { QueryState } from './ApplicantPage';
import { ApplicantMobileTrail } from './ApplicantTopBarContext';
import { DegreeContent } from './ApplicantDegreeDetailPage';
import { getUniversityLogoUrl } from './universityLogo';

export default function ApplicantStudyAreaDetailPage() {
  const { universityId = '', majorId = '' } = useParams();
  const [params] = useSearchParams();
  const query = useGetUniversityDetailQuery(universityId, { skip: !universityId });
  const university = query.data;
  const major = university?.majors?.find(item => item.id === majorId && item.type === 'undergraduate');
  const name = major ? getTranslation(major.name) : '';
  const universityName = university ? getTranslation(university.name) : 'University';
  const universityHref = '/student-hub/universities/' + universityId + (params.get('field') ? '?field=' + encodeURIComponent(params.get('field')!) : '');
  const profile = university as typeof university & { undergraduateCoursesUrl?: string | null };
  const verified = university?.verifiedProgramLinks?.find(link => link.majorId === majorId && link.degreeLevel === 'undergraduate' && /^https:\/\//i.test(link.url));
  const officialUrl = verified?.url ?? profile?.undergraduateCoursesUrl ?? '';
  const degree: UndergraduateDegree = {
    id: majorId, universityId, slug: majorId, name, degreeType: 'Undergraduate study area',
    durationYears: null, studyMode: null, courseCode: null, description: null,
    curriculumSummary: null, firstYearSubjects: null, entrySummary: null,
    qualificationLabel: null, qualificationValue: null, qualificationNote: null,
    admissionsTest: null, admissionsTestNote: null, feesSummary: null, fundingSummary: null,
    fundingPolicyNote: null, applicationSummary: null, deadlineAt: null, deadlineNote: null,
    officialDegreeUrl: officialUrl, curriculumUrl: officialUrl || null, requirementsUrl: officialUrl || null,
    feesUrl: null, fundingPolicyUrl: null, applicationUrl: officialUrl || null,
    sourceTitle: verified ? 'Official programme page' : 'University course catalogue', sourceUrl: officialUrl,
    verifiedAt: '', fieldAliases: [name],
  };
  const saveHref = '/student-hub/applications/new?' + new URLSearchParams({ university: universityId, major: name, degreeLevel: 'bachelor' });
  return <section className="applicant-page applicant-degree-page">
    <ApplicantMobileTrail><Link to="/student-hub/universities">Find universities</Link><span> / </span><Link to={universityHref}>{universityName}</Link><span> / </span>{name || 'Study area'}</ApplicantMobileTrail>
    <QueryState loading={query.isLoading} error={query.isError} retry={() => query.refetch()}>
      {university && major ? <DegreeContent key={universityId + majorId} degree={degree} studyArea universityName={universityName} location={[getTranslation(university.location?.region), getTranslation(university.location?.country)].filter(Boolean).join(', ')} logoUrl={getUniversityLogoUrl(university)} saveHrefOverride={saveHref} /> : <div className="applicant-degree-page__missing"><h1>Study area not found</h1><p>This study area is not listed for this university.</p><Link to={universityHref}>Return to university</Link></div>}
    </QueryState>
  </section>;
}
