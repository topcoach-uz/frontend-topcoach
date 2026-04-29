import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { useGetEnrollmentMeQuery } from 'src/app/services/fullSupportApi';
import ResearchPrepPage from 'src/pages/student-hub/research/ResearchPrepPage';
import { canUseResearchPrepLive } from 'src/lib/researchPrepAccess';
import { useMentorConsole } from '../MentorConsoleContext';

function ResearchPrepMentorComingSoon() {
  const navigate = useNavigate();
  return (
    <Result
      status="info"
      title="Research Prep — coming soon"
      subTitle="We are finishing the curriculum for all students. Internal preview only for now."
      extra={
        <Button type="primary" onClick={() => navigate('/mentor/dashboard')}>
          Back to dashboard
        </Button>
      }
    />
  );
}

/**
 * Research Prep learner experience inside the mentor console (mentors granted
 * program access cannot use `/student-hub` — see StudentHubGate).
 */
export default function MentorResearchPrepLearnerPage() {
  const navigate = useNavigate();
  const { email, managementRole } = useMentorConsole();

  if (!canUseResearchPrepLive(email, managementRole)) {
    return <ResearchPrepMentorComingSoon />;
  }

  const { data: enrollmentMe } = useGetEnrollmentMeQuery();
  const isFullSupport = Boolean((enrollmentMe as { data?: { enrolled?: boolean } })?.data?.enrolled);

  return (
    <ResearchPrepPage
      isFullSupport={isFullSupport}
      onExit={() => navigate('/mentor/dashboard')}
    />
  );
}
