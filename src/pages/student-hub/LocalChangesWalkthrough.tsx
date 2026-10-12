import { Alert, Button } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { LocalFreeJourneyPreview } from 'src/contexts/JourneyExperienceContext';
import { useTypedSelector } from 'src/app/store';
import { useGetStudentEssaysQuery } from 'src/app/services/student-hub/essayManagementApi';
import { useGetDocumentsQuery } from 'src/app/services/student-hub/documentManagementApi';
import { TopCoachPrograms } from './major-match-v2/components/MM3Results';
import MajorMatchV2Page from './major-match-v2/MajorMatchV2Page';
import CommunityFeedEditorialView from './community/CommunityFeedEditorialView';
import StudyBuddyHubSection from './community/StudyBuddyHubSection';
import CoursePreview from '../learning/CoursePreview';
import ResearchIntroPreview from './research/ResearchIntroPreview';
import MajorIllustration from './major-match-v2/components/MajorIllustration';
import RoadmapJourneyBoard from './major-match-v2/components/RoadmapJourneyBoard';

const steps = [
  ['mentors', '1. Major Match mentor suggestions'],
  ['roadmap', '2. Full roadmap + Community ad'],
  ['helpers', '3. Essay + document AI helpers'],
  ['feed', '4. Feed: browse, no publishing'],
  ['buddies', '5. Study Buddy: browse, no messaging'],
  ['learning', '6. Learning introductions'],
  ['programs', '7. What TopCoach includes'],
  ['visuals', '8. Subject + roadmap motifs'],
] as const;

export default function LocalChangesWalkthrough() {
  const [params, setParams] = useSearchParams();
  const item = params.get('item') ?? 'mentors';
  const profile = useTypedSelector(state => state.auth.profile);
  const essays = useGetStudentEssaysQuery({ page: 1, limit: 100 }, { skip: item !== 'helpers' });
  const documents = useGetDocumentsQuery({ page: 1, limit: 100 }, { skip: item !== 'helpers' });
  if (!import.meta.env.DEV) return null;
  const firstEssay = essays.data?.data?.[0];
  const firstDocument = documents.data?.data?.find(document => document.mimeType === 'application/pdf') ?? documents.data?.data?.[0];
  const walkthrough = <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
    <h1>Local changes walkthrough</h1>
    <Alert type="info" showIcon message="Local changes preview" description="Major Match now uses your actual saved report or assessment draft—there are no fictional results or university fixtures. Feed, buddies and learning remain free-user previews. AI helpers require an explicit action; nothing is sent to AI automatically." />
    <nav aria-label="Changes walkthrough" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '20px 0' }}>{steps.map(([key, label]) => <Button key={key} type={item === key ? 'primary' : 'default'} onClick={() => setParams({ item: key })}>{label}</Button>)}</nav>
    {(item === 'mentors' || item === 'roadmap') && <>
      <MajorMatchV2Page />
    </>}
    {item === 'programs' && <div className="mm3-results mm3-results--discovery"><TopCoachPrograms defaultOpen /></div>}
    {item === 'visuals' && <div className="mm3-results mm3-results--discovery"><h2>Subject motifs · visual QA only</h2><p>Decorative illustrations, not generated matches or saved student data.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>{['Biomedical Sciences', 'Medical Laboratory Science', 'Health Sciences', 'Neuroscience', 'Law', 'Architecture', 'Psychology', 'Environmental Science', 'Engineering', 'Mathematics', 'Music', 'Education'].map(name => <div key={name} style={{ padding: 16, border: '1px solid #e4dacf', borderRadius: 12, color: '#7b1f2f', background: '#f8f3ed' }}><MajorIllustration name={name} /><strong style={{ display: 'block', fontSize: 13 }}>{name}</strong></div>)}</div><h2 style={{ marginTop: 32 }}>Date-based roadmap · illustrative activities</h2><RoadmapJourneyBoard readOnly phases={[{ when: 'Grade 10–11', actions: ['Maintain academic results', 'Try independent research', 'Prepare for science competitions'] }, { when: 'Summer Grade 11', actions: ['Build a college list', 'Draft personal statements'] }, { when: 'Grade 12 (Fall)', actions: ['Submit applications', 'Review required documents'] }, { when: 'Spring 2027', actions: ['Review offers', 'Prepare enrollment and visa arrangements'] }]} /></div>}
    {item === 'helpers' && <div className="applicant-panel"><h2>AI helpers are separate from mentor feedback</h2><p>These links open the actual writing/file editors with the helper selected. Generating suggestions requires an explicit click; document text also requires confirmation before sending to the AI provider.</p><p>{firstEssay ? <Link to={`/student-hub/essays/${firstEssay.id}?helper=ai`}>Open essay writing helper</Link> : <Link to="/student-hub/essays">Open essays and choose a saved draft</Link>}</p><p>{firstDocument ? <Link to={`/student-hub/documents/${firstDocument.id}?helper=ai`}>Open document AI helper</Link> : <Link to="/student-hub/documents">Open documents and choose a saved file</Link>}</p></div>}
    {item === 'feed' && <CommunityFeedEditorialView readOnly currentUser={{ id: profile?.id ?? '', name: 'Local preview student', initials: 'LP', avatarColor: '#7B1F2F', canPost: false, canPin: false }} />}
    {item === 'buddies' && <StudyBuddyHubSection readOnly onOpenChat={() => {}} />}
    {item === 'learning' && <><CoursePreview course="admissions" /><CoursePreview course="sat" /><ResearchIntroPreview /></>}
    <p style={{ marginTop: 24 }}><Link to="/student-hub/overview">Return to your actual workspace</Link></p>
  </div>;
  return item === 'mentors' || item === 'roadmap' || item === 'programs' ? walkthrough : <LocalFreeJourneyPreview>{walkthrough}</LocalFreeJourneyPreview>;
}
