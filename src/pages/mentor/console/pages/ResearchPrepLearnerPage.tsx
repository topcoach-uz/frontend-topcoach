import { useNavigate } from 'react-router-dom';
import { useGetEnrollmentMeQuery } from 'src/app/services/fullSupportApi';
import ResearchPrepPage from 'src/pages/student-hub/research/ResearchPrepPage';

/**
 * Research Prep learner experience inside the mentor console (mentors granted
 * program access cannot use `/student-hub` — see StudentHubGate).
 */
export default function MentorResearchPrepLearnerPage() {
  const navigate = useNavigate();
  const { data: enrollmentMe } = useGetEnrollmentMeQuery();
  const isFullSupport = Boolean((enrollmentMe as { data?: { enrolled?: boolean } })?.data?.enrolled);

  return (
    <ResearchPrepPage
      isFullSupport={isFullSupport}
      onExit={() => navigate('/mentor/dashboard')}
    />
  );
}
