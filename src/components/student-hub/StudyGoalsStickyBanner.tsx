import { useMemo } from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useJourneyExperience } from 'src/contexts/JourneyExperienceContext';
import { useGetUserPreferencesQuery } from 'src/app/services/student-hub/dashboardApi';
import { hasStudyBuddyGoalsSet } from 'src/constants/studyBuddyInterests';

/**
 * Full-width pale banner below the global site header (sticky within hub scroll).
 * Shown for Community students who have not saved Study Buddy interests in Settings.
 */
export default function StudyGoalsStickyBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCommunityEnrolled } = useJourneyExperience();
  const { data: rawPreferences } = useGetUserPreferencesQuery();
  const preferences = ((rawPreferences as any)?.data ?? rawPreferences ?? null) as any;

  const goalsSet = useMemo(
    () => hasStudyBuddyGoalsSet(preferences?.applicationSettings?.studyBuddyInterests),
    [preferences?.applicationSettings?.studyBuddyInterests],
  );

  const show =
    location.pathname.startsWith('/student-hub') &&
    isCommunityEnrolled &&
    rawPreferences != null &&
    !goalsSet;

  if (!show) return null;

  return (
    <div className="study-goals-sticky-banner-outer">
      <div className="study-goals-sticky-banner-inner">
        <div className="study-goals-sticky-banner-copy">
          <p className="study-goals-sticky-banner-title">
            {t('studentHub.hub.studyBuddyGoalsBannerTitle', 'Set your study goals to find a buddy')}
          </p>
          <p className="study-goals-sticky-banner-desc">
            {t(
              'studentHub.hub.studyBuddyGoalsBannerDesc',
              'Adding your exams, application regions, majors, and focus areas helps us match you with peers on similar paths. It only takes a minute.',
            )}
          </p>
        </div>
        <Button
          type="default"
          className="study-goals-sticky-banner-cta"
          onClick={() => navigate('/student-hub?section=buddies', { replace: true })}
        >
          {t('studentHub.hub.studyBuddyGoalsBannerCta', 'Find a study buddy')}
        </Button>
      </div>
    </div>
  );
}
