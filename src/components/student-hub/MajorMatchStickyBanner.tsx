import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { useMajorMatchPromptState } from 'src/hooks/useMajorMatchPrompt';
import './MajorMatchStickyBanner.scss';

/**
 * Full-width sticky banner below the global site header — mirrors
 * StudyGoalsStickyBanner.tsx exactly (condition-only, no dismiss button, no
 * storage: it disappears the moment the student completes the assessment,
 * not before). Shown for any student who hasn't completed Major Match yet.
 *
 * StudentHubLayout renders this ahead of StudyGoalsStickyBanner and gives
 * Major Match priority when both would apply simultaneously (see the
 * layout's render logic) rather than stacking two independently-sticky
 * bars, which would fight over the same `top: 0`.
 */
export default function MajorMatchStickyBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { shouldPrompt, destination } = useMajorMatchPromptState();

  const isExcludedPath =
    location.pathname.startsWith('/student-hub/psychometric-assessment') ||
    location.pathname.startsWith('/student-hub/sat-prep');

  const show = location.pathname.startsWith('/student-hub') && shouldPrompt && !isExcludedPath;

  if (!show) return null;

  return (
    <div className="major-match-sticky-banner-outer">
      <div className="major-match-sticky-banner-inner">
        <div className="major-match-sticky-banner-copy">
          <p className="major-match-sticky-banner-title">
            {t('studentHub.hub.majorMatchBannerTitle', 'Find your best-fit major')}
          </p>
          <p className="major-match-sticky-banner-desc">
            {t(
              'studentHub.hub.majorMatchBannerDesc',
              'Take the free AI-powered assessment to see majors that fit your interests, values, and strengths.',
            )}
          </p>
        </div>
        <Button
          type="default"
          className="major-match-sticky-banner-cta"
          onClick={() => navigate(destination)}
        >
          {t('studentHub.hub.majorMatchBannerCta', 'Take the assessment')}
        </Button>
      </div>
    </div>
  );
}
