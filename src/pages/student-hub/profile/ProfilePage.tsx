import React, { useState, useEffect, useMemo } from 'react';
import { Button, Alert } from 'antd';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import { formatDateTime } from '../../../utils/dateFormatter';
import { InlineLoader, PageSkeleton } from '../../../components/loading';
// MAJOR_MATCH_V2_PLAN.md Stage 5 cutover: this card used to pull
// `useGetLatestAssessmentQuery`/`useGetRecommendationsQuery` from the legacy
// `psychometricApi` slice, part of the same runaway-refetch-prone bare-tag
// group `MAJOR_MATCH_LOADING_CAP_MS` below was originally built to defend
// against. It now reads the new, properly-scoped `majorMatchApi` status
// endpoint instead, which removes this file from that storm entirely.
import { useGetMajorMatchStatusQuery } from '../../../app/services/student-hub/majorMatchApi';
import { MM2_DIMENSION_KEYS } from '../major-match-v2/content';
import { useMajorMatchPromptState } from 'src/hooks/useMajorMatchPrompt';
import AcademicProfile from './AcademicProfile';
import PersonalProfile from './PersonalProfile';
import ActivitiesProfile from './ActivitiesProfile';
import ApplicationsPage from '../applications/ApplicationsPage';
import DocumentsPage from '../documents/DocumentsPage';
import { ApplicantPage } from '../applicant/ApplicantPage';
// import SettingsPage from '../settings/SettingsPage'; // Settings tab hidden
import './ProfilePage.scss';

// How long the card is allowed to show a loading skeleton before it just
// renders its best-effort state off whatever data has landed. Guards
// against the known app-wide runaway-refetch bug in the psychometric
// queries, where `loading` can fail to settle to false (see
// useMajorMatchPrompt.ts callers), without this cap the card could be
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
  // Keys whose pane has been opened at least once, see the render note on
  // why panes stay mounted afterwards.
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set(['personal']));
  const isReadOnly = readOnly === true;
  
  // Pass studentId to hook when in read-only mode to fetch correct student data
  const hookOptions = isReadOnly && studentId ? { studentId } : undefined;
  const { profile, isLoading, error } = useStudentProfile(hookOptions);
  const isMasters = profile?.academicProfile?.targetDegree === 'master';
  const useSeparateWorkspaces = !isReadOnly;

  // Applicant workspaces have their own routes. Keep old profile tab links useful.
  useEffect(() => {
    if (!useSeparateWorkspaces) return;
    const tab = searchParams.get('tab');
    if (tab === 'college-lists' || tab === 'documents') {
      navigate(tab === 'college-lists' ? '/student-hub/applications' : '/student-hub/documents', { replace: true });
    }
  }, [useSeparateWorkspaces, searchParams, navigate]);

  // Major Match (psychometric assessment) status card, own account only,
  // never in the counselor's read-only embed (see the `!isReadOnly` guard
  // around the card below). Reuses the same shared hook the dashboard
  // hero / prompt modal use for the taken/canStart/community-gate
  // derivation, so all three surfaces agree on when to show the
  // "unlock unlimited matches" edge, see useMajorMatchPrompt.ts.
  const mm = useMajorMatchPromptState();
  const majorMatchStudentProfileId = !isReadOnly && !isMasters ? mm.studentProfileId : undefined;

  // The CTA below navigates STRAIGHT to the assessment. The old
  // pre-assessment collect modal was removed — MM3 asks these fields itself
  // and prefills them from the profile, so the extra step was redundant.

  // Pulled independently (not just from the shared hook) because we also
  // need the actual result payload (dimension scores, primary major slug),
  // not just the taken/not-taken boolean. Same query key as the one the
  // hook already subscribes to (useMajorMatchPromptState → same
  // studentProfileId), so RTK Query serves this from the same cache entry
  // with no extra network call.
  const { data: majorMatchStatus } = useGetMajorMatchStatusQuery(majorMatchStudentProfileId ?? '', {
    skip: isReadOnly || isMasters || !majorMatchStudentProfileId,
  });

  // v2 result available → the normal "taken" display. A student who only
  // ever completed the OLD/legacy engine (hasCompletedLegacy but no v2
  // `latest`) gets a distinct, honest state instead of trying to render a
  // v1-shaped result (riasecCode) through v2's display, see the
  // `majorMatchLegacyOnly` branch below. This is a Stage 5 judgment call,
  // not a spec'd requirement: the alternative (also querying the legacy
  // `psychometricApi` here to still show the old riasecCode) would put this
  // file back on the runaway-refetch-prone tag group we just removed it
  // from, for a state that's about to be superseded by a retake anyway.
  const majorMatchHasV2Result = !!majorMatchStatus?.hasCompletedV2 && !!majorMatchStatus?.latest;
  const majorMatchLegacyOnly = !majorMatchHasV2Result && !!majorMatchStatus?.hasCompletedLegacy;

  const topDimensionLabels = useMemo(() => {
    const indices = majorMatchStatus?.latest?.topDimensions;
    if (!indices?.length) return null;
    const labels = indices
      .map((i) => MM2_DIMENSION_KEYS[i])
      .filter((key): key is (typeof MM2_DIMENSION_KEYS)[number] => !!key)
      .map((key) => t(`majorMatch.dimension.${key}.label`));
    return labels.length > 0 ? labels.join(' · ') : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [majorMatchStatus?.latest?.topDimensions, t]);

  const majorMatchShowUnlockCta = !mm.canStart && mm.requiresCommunityEnrollment;

  // Only meaningful while genuinely nothing has landed yet, capped by a
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
    const allowedTabs = useSeparateWorkspaces
      ? ['personal', 'academic', 'activities']
      : ['personal', 'academic', 'activities', 'college-lists', 'documents'];
    const next = tabFromUrl && allowedTabs.includes(tabFromUrl) ? tabFromUrl : 'personal';
    setActiveTab(next);
    setVisitedTabs((prev) => (prev.has(next) ? prev : new Set(prev).add(next)));
  }, [searchParams, useSeparateWorkspaces]);

  // Handle tab changes, merge into the existing params so shell params
  // like ?section=others&target=profile survive the tab switch
  const handleTabChange = (key: string) => {
    if (useSeparateWorkspaces && (key === 'college-lists' || key === 'documents')) {
      navigate(key === 'college-lists' ? '/student-hub/applications' : '/student-hub/documents');
      return;
    }
    setActiveTab(key);
    setVisitedTabs((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
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
      <div className="applicant-page applicant-profile-page profile-loading-content">
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
        completed: profile?.academicProfile?.targetDegree === 'master'
          ? !!(profile.academicProfile.educationStatus && profile.academicProfile.previousInstitution && profile.academicProfile.previousDegree && profile.academicProfile.previousField && profile.academicProfile.bachelorGraduationYear)
          : !!(profile?.academicProfile?.targetDegree && profile.academicProfile.curriculum && profile.academicProfile.graduationYear),
        percentage: profile?.academicProfile?.targetDegree === 'master'
          ? [profile.academicProfile.educationStatus, profile.academicProfile.previousInstitution, profile.academicProfile.previousDegree, profile.academicProfile.previousField, profile.academicProfile.bachelorGraduationYear].filter(Boolean).length * 20
          : Math.round([profile?.academicProfile?.targetDegree, profile?.academicProfile?.curriculum, profile?.academicProfile?.graduationYear].filter(Boolean).length / 3 * 100),
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

  // Tab labels are typographic, no icons. The strip is navigation, so it
  // stays quiet; what's missing inside a section is already signalled by
  // the required-field markers on the form itself.
  //
  // Roadmap tab removed, it now lives inline on the Major Match v2
  // results screen (`MM2Results`), where it's generated/regenerated the
  // moment a Major Match is submitted. See `RoadmapTab`'s doc comment.
  const tabItems = [
    {
      key: 'personal',
      label: t('studentHub.profile.personalProfile'),
      children: <PersonalProfile data={profileData.sections.personal} readOnly={isReadOnly} studentId={studentId} />,
    },
    {
      key: 'academic',
      label: t('studentHub.profile.academicProfile'),
      children: <AcademicProfile data={profileData.sections.academic} readOnly={isReadOnly} studentId={studentId} />,
    },
    {
      key: 'activities',
      label: t('studentHub.profile.activitiesAchievements'),
      children: <ActivitiesProfile data={profileData.sections.activities} readOnly={isReadOnly} studentId={studentId} />,
    },
    ...(!useSeparateWorkspaces ? [{
      key: 'college-lists',
      label: isMasters ? 'Programs' : t('studentHub.hub.collegeLists', 'College Lists'),
      children: <ApplicationsPage readOnly={isReadOnly} studentId={studentId} />,
    },
    {
      key: 'documents',
      label: t('studentHub.hub.documentsLabel', 'Documents'),
      children: <DocumentsPage readOnly={isReadOnly} studentId={studentId} />,
    }] : []),
  ];

  const activeTabItem = tabItems.find((tab) => tab.key === activeTab) ?? tabItems[0];
  const isApplicationFlow = activeTab === 'college-lists' && ['new', 'edit'].includes(searchParams.get('applicationFlow') ?? '');
  const pageTitle = isReadOnly
    ? t('studentHub.profile.counselorTitle')
    : isMasters
      ? t('studentHub.profile.myGraduateProfile', 'My Graduate Profile')
      : t('studentHub.profile.myStudentProfile');
  const pageSubtitle = isReadOnly
    ? t('studentHub.profile.counselorSubtitle')
    : t(isMasters
      ? 'studentHub.profile.completeMastersProfileMessage'
      : 'studentHub.profile.completeProfileMessage');

  return (
    <ApplicantPage title={pageTitle} subtitle={pageSubtitle}>
    <div className="student-profile-page applicant-profile-page student-hub-page">
      {/* Editorial masthead, serif title, standfirst, then a status line
          carrying the two facts worth carrying: how complete the profile
          is, and when it last changed. No eyebrow: the sibling Settings
          page doesn't use one, and "My Journey" would only repeat the
          nav item that's already highlighted. */}
      {!isApplicationFlow && <header className="pf-masthead applicant-profile-page__meta">
        <div className="pf-statusline">
          <span className={`pf-status pf-status--${getStatusColor(profileData.status)}`}>
            <span className="pf-status__dot" aria-hidden />
            {getStatusText(profileData.status)}
          </span>
          {profileData.lastUpdated && (
            <span className="pf-status__meta">
              {t('studentHub.profile.lastUpdatedAt', 'Updated {{date}}', {
                date: profileData.lastUpdated,
              })}
            </span>
          )}
        </div>
      </header>}

      {/* Major Match status for undergraduate applicants only, hidden in the
          counselor's read-only embed. Always renders something: a
          skeleton while genuinely loading, a pitch+CTA when not taken, a
          dimension + primary-major summary when a v2 result exists, a
          distinct notice for a legacy-only completer (Stage 5 cutover,
          see the `majorMatchLegacyOnly` comment above), and never a blank
          box (see states 1-5 in the task spec this card was originally
          built for). */}
      {!isReadOnly && !isMasters && !isApplicationFlow && (
        <aside className="pf-rail">
          <div className="profile-major-match-card__body">
            <div className="profile-major-match-card__text">
              <span className="profile-major-match-card__title">
                <UnifiedIcon name="major-match" size="sm" color="primary" />
                {t('studentHub.profile.majorMatch.cardTitle', 'Major Match')}
              </span>

              {majorMatchInitializing ? (
                // A single muted line, deliberately the same shape as the
                // loaded state. The old InlineLoader was a centred block
                // with 24px of padding whose spinner tip wrapped one word
                // per line inside this narrow column, so the rail grew to
                // roughly three times its settled height and then snapped
                // back the moment the status arrived.
                <span className="profile-major-match-card__desc profile-major-match-card__desc--loading">
                  {t('studentHub.profile.majorMatch.loading', 'Checking your major match status…')}
                </span>
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
                  <Button type="primary" onClick={() => navigate(mm.destination)}>
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
        </aside>
      )}

      {/* Section navigation. A plain underline strip rather than AntD's
          Tabs: no ink bar to fight, no boxed pills, and the labels can
          carry the page's serif. */}
      {!isApplicationFlow && <nav className="pf-tabs" role="tablist" aria-label={t('studentHub.profile.sectionsNav', 'Profile sections')}>
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`pf-tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`pf-panel-${tab.key}`}
            className={`pf-tab ${activeTab === tab.key ? 'pf-tab--active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>}

      {/* Panes mount lazily on first visit and stay mounted after, which
          is what AntD's Tabs did: a half-filled form survives a trip to
          another tab, but College Lists / Documents don't fire their
          queries until someone actually opens them. */}
      {tabItems.map((tab) => {
        const isActive = tab.key === activeTabItem.key;
        if (!visitedTabs.has(tab.key)) return null;
        return (
          <div
            key={tab.key}
            className="pf-panel"
            role="tabpanel"
            id={`pf-panel-${tab.key}`}
            aria-labelledby={`pf-tab-${tab.key}`}
            hidden={!isActive}
          >
            {tab.children}
          </div>
        );
      })}
    </div>
    </ApplicantPage>
  );
};

export default ProfilePage;
