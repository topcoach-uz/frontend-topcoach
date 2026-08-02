import React, { useState, useEffect, useMemo } from 'react';
import { Card, Tabs, Progress, Button, Statistic, Badge, Alert } from 'antd';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import { STATUS_ICONS, ACTION_ICONS, PROFILE_ICONS } from '../../../constants/icons';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import { formatDateTime } from '../../../utils/dateFormatter';
import { InlineLoader, PageSkeleton } from '../../../components/loading';
// MAJOR_MATCH_V2_PLAN.md Stage 5 cutover: this card used to pull
// `useGetLatestAssessmentQuery`/`useGetRecommendationsQuery` from the legacy
// `psychometricApi` slice — part of the same runaway-refetch-prone bare-tag
// group `MAJOR_MATCH_LOADING_CAP_MS` below was originally built to defend
// against. It now reads the new, properly-scoped `majorMatchApi` status
// endpoint instead, which removes this file from that storm entirely.
import { useGetMajorMatchStatusQuery } from '../../../app/services/student-hub/majorMatchApi';
import { MM2_DIMENSION_KEYS } from '../major-match-v2/content';
import { useMajorMatchPromptState } from 'src/hooks/useMajorMatchPrompt';
import MajorMatchCollectModal from '../components/MajorMatchCollectModal';
import AcademicProfile from './AcademicProfile';
import PersonalProfile from './PersonalProfile';
import ActivitiesProfile from './ActivitiesProfile';
import ApplicationsPage from '../applications/ApplicationsPage';
import DocumentsPage from '../documents/DocumentsPage';
// import SettingsPage from '../settings/SettingsPage'; // Settings tab hidden
import './ProfilePage.scss';

const { TabPane } = Tabs;

// How long the card is allowed to show a loading skeleton before it just
// renders its best-effort state off whatever data has landed. Guards
// against the known app-wide runaway-refetch bug in the psychometric
// queries, where `loading` can fail to settle to false (see
// useMajorMatchPrompt.ts callers) — without this cap the card could be
// stuck in a skeleton forever.
const MAJOR_MATCH_LOADING_CAP_MS = 4000;

// Props interface for ProfilePage - supports both normal and read-only mode
export interface ProfilePageProps {
  readOnly?: boolean;
  studentId?: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ readOnly = false, studentId }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const isReadOnly = readOnly === true;
  
  // Pass studentId to hook when in read-only mode to fetch correct student data
  const hookOptions = isReadOnly && studentId ? { studentId } : undefined;
  const { profile, isLoading, error, isProfileComplete, profileStatus } = useStudentProfile(hookOptions);

  // Major Match (psychometric assessment) status card — own account only,
  // never in the counselor's read-only embed (see the `!isReadOnly` guard
  // around the card below). Reuses the same shared hook the dashboard
  // hero / prompt modal use for the taken/canStart/community-gate
  // derivation, so all three surfaces agree on when to show the
  // "unlock unlimited matches" edge — see useMajorMatchPrompt.ts.
  const mm = useMajorMatchPromptState();
  const majorMatchStudentProfileId = !isReadOnly ? mm.studentProfileId : undefined;

  // Opened by the not-taken CTA below instead of navigating straight to the
  // assessment — same pre-assessment profile-field collection step as the
  // dashboard hero (MyProgressEditorialView's setMmCollectOpen). The modal
  // handles the used-attempt/community-unlock swap internally.
  const [mmCollectOpen, setMmCollectOpen] = useState(false);

  // Pulled independently (not just from the shared hook) because we also
  // need the actual result payload (dimension scores, primary major slug),
  // not just the taken/not-taken boolean. Same query key as the one the
  // hook already subscribes to (useMajorMatchPromptState → same
  // studentProfileId), so RTK Query serves this from the same cache entry
  // — no extra network call.
  const { data: majorMatchStatus } = useGetMajorMatchStatusQuery(majorMatchStudentProfileId ?? '', {
    skip: isReadOnly || !majorMatchStudentProfileId,
  });

  // v2 result available → the normal "taken" display. A student who only
  // ever completed the OLD/legacy engine (hasCompletedLegacy but no v2
  // `latest`) gets a distinct, honest state instead of trying to render a
  // v1-shaped result (riasecCode) through v2's display — see the
  // `majorMatchLegacyOnly` branch below. This is a Stage 5 judgment call,
  // not a spec'd requirement: the alternative (also querying the legacy
  // `psychometricApi` here to still show the old riasecCode) would put this
  // file back on the runaway-refetch-prone tag group we just removed it
  // from, for a state that's about to be superseded by a retake anyway.
  const majorMatchHasV2Result = !!majorMatchStatus?.hasCompletedV2 && !!majorMatchStatus?.latest;
  const majorMatchLegacyOnly = !majorMatchHasV2Result && !!majorMatchStatus?.hasCompletedLegacy;

  const topDimensionLabels = useMemo(() => {
    const indices = majorMatchStatus?.latest?.topDimensions;
    if (!indices || indices.length === 0) return null;
    const labels = indices
      .map((i) => MM2_DIMENSION_KEYS[i])
      .filter((key): key is (typeof MM2_DIMENSION_KEYS)[number] => !!key)
      .map((key) => t(`majorMatch.dimension.${key}.label`));
    return labels.length > 0 ? labels.join(' · ') : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [majorMatchStatus?.latest?.topDimensions, t]);

  const majorMatchShowUnlockCta = !mm.canStart && mm.requiresCommunityEnrollment;

  // Only meaningful while genuinely nothing has landed yet — capped by a
  // timer so the runaway-refetch bug (loading never settling) can never
  // pin the card in a skeleton state forever. Once we've shown real
  // content once we never go back to the skeleton.
  const [majorMatchInitializing, setMajorMatchInitializing] = useState(!isReadOnly);
  useEffect(() => {
    if (isReadOnly || !mm.loading) {
      setMajorMatchInitializing(false);
      return undefined;
    }
    const timer = setTimeout(() => setMajorMatchInitializing(false), MAJOR_MATCH_LOADING_CAP_MS);
    return () => clearTimeout(timer);
  }, [isReadOnly, mm.loading]);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const allowedTabs = ['personal', 'academic', 'activities', 'college-lists', 'documents'];
    if (tabFromUrl && allowedTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab('personal');
    }
  }, [searchParams]);

  // Handle tab changes — merge into the existing params so shell params
  // like ?section=others&target=profile survive the tab switch
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', key);
        return next;
      },
      { replace: true },
    );
  };

  // Show loading state with unified skeleton
  if (isLoading) {
    return (
      <div className="profile-loading-content">
        <PageSkeleton 
          rows={6} 
          showTitle={true}
          showAvatar={false}
        />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert
        message={t('studentHub.profile.error')}
        description={t('studentHub.profile.errorDescription')}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => window.location.reload()}>
            {t('studentHub.profile.retry')}
          </Button>
        }
      />
    );
  }

  // Use real data from API
  const profileData = {
    status: profile?.profileStatus || 'incomplete',
    lastUpdated: formatDateTime(profile?.updatedAt || ''),
    sections: {
      personal: {
        completed: !!profile?.personalProfile,
        percentage: profile?.personalProfile ? 100 : 0,
        lastUpdated: formatDateTime(profile?.personalProfile?.updatedAt || ''),
      },
      academic: {
        completed: !!profile?.academicProfile,
        percentage: profile?.academicProfile ? 100 : 0,
        lastUpdated: formatDateTime(profile?.academicProfile?.updatedAt || ''),
      },
      activities: {
        completed: !!profile?.activitiesProfile,
        percentage: profile?.activitiesProfile ? 100 : 0,
        lastUpdated: formatDateTime(profile?.activitiesProfile?.updatedAt || ''),
      },
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'success';
      case 'in_progress':
        return 'processing';
      case 'incomplete':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return t('studentHub.profile.status.complete');
      case 'in_progress':
        return t('studentHub.profile.status.inProgress');
      case 'incomplete':
        return t('studentHub.profile.status.incomplete');
      default:
        return t('studentHub.profile.status.unknown');
    }
  };

  const tabItems = [
    {
      key: 'personal',
      label: (
        <div className="tab-label">
          <UnifiedIcon name="user" size="sm" color="primary" />
          <span>{t('studentHub.profile.personalProfile')}</span>
        </div>
      ),
      children: <PersonalProfile data={profileData.sections.personal} readOnly={isReadOnly} studentId={studentId} />,
    },
    {
      key: 'academic',
      label: (
        <div className="tab-label">
          <UnifiedIcon name={PROFILE_ICONS.ACADEMIC} size="sm" color="primary" />
          <span>{t('studentHub.profile.academicProfile')}</span>
        </div>
      ),
      children: <AcademicProfile data={profileData.sections.academic} readOnly={isReadOnly} studentId={studentId} />,
    },
    {
      key: 'activities',
      label: (
        <div className="tab-label">
          <UnifiedIcon name="award" size="sm" color="primary" />
          <span>{t('studentHub.profile.activitiesAchievements')}</span>
        </div>
      ),
      children: <ActivitiesProfile data={profileData.sections.activities} readOnly={isReadOnly} studentId={studentId} />,
    },
    {
      key: 'college-lists',
      label: (
        <div className="tab-label">
          <UnifiedIcon name="applications" size="sm" color="primary" />
          <span>{t('studentHub.hub.collegeLists', 'College Lists')}</span>
        </div>
      ),
      children: <ApplicationsPage readOnly={isReadOnly} studentId={studentId} />,
    },
    {
      key: 'documents',
      label: (
        <div className="tab-label">
          <UnifiedIcon name="documents" size="sm" color="primary" />
          <span>{t('studentHub.hub.documentsLabel', 'Documents')}</span>
        </div>
      ),
      children: <DocumentsPage readOnly={isReadOnly} studentId={studentId} />,
    },
    // Roadmap tab removed — it now lives inline on the Major Match v2
    // results screen (`MM2Results`), where it's generated/regenerated the
    // moment a Major Match is submitted. See `RoadmapTab`'s doc comment.
    // Settings tab hidden for now
    // {
    //   key: 'settings',
    //   label: (
    //     <div className="tab-label">
    //       <UnifiedIcon name="settings" size="sm" color="primary" />
    //       <span>Settings</span>
    //     </div>
    //   ),
    //   children: <SettingsPage />,
    // },
  ];

  return (
    <div className="student-profile-page student-hub-page">
      {/* Profile Header - same content start as other My Journey pages */}
      <div style={{ marginBottom: 24 }}>
        <div className="profile-header-content">
          <h1 className="profile-title student-hub-page-title">
            {isReadOnly ? t('studentHub.profile.counselorTitle') : t('studentHub.profile.myStudentProfile')}
          </h1>
          <p className="profile-subtitle student-hub-page-subtitle" style={{ marginTop: 8 }}>
            {isReadOnly ? t('studentHub.profile.counselorSubtitle') : t('studentHub.profile.completeProfileMessage')}
          </p>
          <div className="profile-status">
            <Badge
              status={getStatusColor(profileData.status)}
              text={getStatusText(profileData.status)}
            />
          </div>
        </div>
      </div>

      {/* Major Match status — own account only, hidden in the counselor's
          read-only embed of this page. Always renders something: a
          skeleton while genuinely loading, a pitch+CTA when not taken, a
          dimension + primary-major summary when a v2 result exists, a
          distinct notice for a legacy-only completer (Stage 5 cutover —
          see the `majorMatchLegacyOnly` comment above), and never a blank
          box (see states 1-5 in the task spec this card was originally
          built for). */}
      {!isReadOnly && (
        <Card className="profile-major-match-card">
          <div className="profile-major-match-card__body">
            <div className="profile-major-match-card__text">
              <span className="profile-major-match-card__title">
                <UnifiedIcon name="major-match" size="sm" color="primary" />
                {t('studentHub.profile.majorMatch.cardTitle', 'Major Match')}
              </span>

              {majorMatchInitializing ? (
                <InlineLoader
                  size="small"
                  text={t('studentHub.profile.majorMatch.loading', 'Checking your major match status…')}
                />
              ) : majorMatchHasV2Result ? (
                <div className="profile-major-match-card__result">
                  {topDimensionLabels && (
                    <span className="profile-major-match-card__desc">
                      {t('studentHub.profile.majorMatch.topDimensionsLabel', 'Your top strengths')}:{' '}
                      <strong>{topDimensionLabels}</strong>
                    </span>
                  )}
                  <div className="profile-major-match-card__majors">
                    <span className="profile-major-match-card__majors-label">
                      {t('studentHub.profile.majorMatch.topMajorsLabel', 'Top matches')}
                    </span>
                    <ul className="profile-major-match-card__majors-list">
                      <li className="profile-major-match-card__major-chip">
                        {t(`majorMatch.major.${majorMatchStatus?.latest?.primaryMajorSlug}.name`)}
                      </li>
                    </ul>
                  </div>
                </div>
              ) : majorMatchLegacyOnly ? (
                <span className="profile-major-match-card__desc">
                  {t(
                    'studentHub.profile.majorMatch.legacyNotice',
                    'You completed a previous version of this assessment. Retake it for updated results.',
                  )}
                </span>
              ) : (
                <span className="profile-major-match-card__desc">
                  {t(
                    'studentHub.profile.majorMatch.notTakenText',
                    'Find out which majors fit you best with a short AI-powered assessment.',
                  )}
                </span>
              )}
            </div>
            <div className="profile-major-match-card__action">
              {!majorMatchInitializing &&
                (majorMatchHasV2Result ? (
                  <Button onClick={() => navigate('/student-hub?section=ai-major-match')}>
                    {t('studentHub.profile.majorMatch.viewResults', 'View full results')}
                  </Button>
                ) : (
                  <Button type="primary" onClick={() => setMmCollectOpen(true)}>
                    {majorMatchShowUnlockCta && <Lock size={14} style={{ marginRight: 6 }} />}
                    {majorMatchShowUnlockCta
                      ? t('studentHub.majorMatchPrompt.unlockCta', 'Unlock unlimited matches')
                      : majorMatchLegacyOnly
                        ? t('majorMatch.results.retakeCta', 'Retake the assessment')
                        : t('studentHub.profile.majorMatch.tryButton', 'Try the AI Major Match')}
                  </Button>
                ))}
            </div>
          </div>
        </Card>
      )}

      {/* Profile Tabs */}
      <Card className="profile-tabs-card">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          className="profile-tabs"
        />
      </Card>

      {!isReadOnly && (
        <MajorMatchCollectModal open={mmCollectOpen} onClose={() => setMmCollectOpen(false)} />
      )}
    </div>
  );
};

export default ProfilePage;