import React, { useEffect, useMemo, useState } from 'react';
import { useMyLearningPath } from 'src/pages/student-hub/applicant/useMyLearningPath';
import { Button, Card, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  UserPlus,
  GraduationCap,
  Play,
  ArrowLeft,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../applicant/ApplicantPage';
import { useJourneyExperience } from 'src/contexts/JourneyExperienceContext';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import MyProgressEditorialView from '../MyProgressEditorialView';
import styles from './communityHubMock.module.scss';
import { useFitToViewport } from 'src/hooks/useFitToViewport';
import { ENABLE_COMMUNITY_FEED } from './communityFeedFlags';
import CommunityFeedEditorialView from './CommunityFeedEditorialView';
import FullSupportStudentPage from '../full-support/FullSupportStudentPage';
import ResearchPrepPage from '../research/ResearchPrepPage';
import CoursePreview from 'src/pages/learning/CoursePreview';
// ResearchPrepLockedPreview is now imported by StudentHubRoutes for the
// standalone /student-hub/research-prep surface (non-community users).
// The in-hub branch no longer renders the blurred preview.
import { useGetEnrollmentMeQuery } from '../../../app/services/fullSupportApi';
// Major Match v2 (MAJOR_MATCH_V2_PLAN.md Stage 5 cutover) — replaces the
// legacy PsychometricAssessmentPage at both mounts in this file. Same prop
// contract (readOnly/studentId/onExit), so it's a drop-in swap.
import MajorMatchV2Page from '../major-match-v2/MajorMatchV2Page';
import OpportunitiesPage from '../opportunities/OpportunitiesPage';
import ProfilePage from '../profile/ProfilePage';
import MenteeSettingsPageMock from '../settings/MenteeSettingsPageMock';
// Community-membership funnel pages — mounted as internal hub sections
// so they inherit the COMMUNITY/LEARNING/ACCOUNT sidebar. The English
// placement test that used to gate this funnel has been removed; the
// profile wizard is now the first step.
import PlacementProfileWizardPage from '../../placement-test/profile';
import PlacementRoadmapPage from '../../placement-test/roadmap';
import CommunityLockedPage, { type CommunityLockVariant } from './CommunityLockedPage';
import StudyBuddyHubSection from './StudyBuddyHubSection';
import StudyBuddyConsentGate from './StudyBuddyConsentGate';
import MessengerExperience from '../../../components/chat/MessengerExperience';
import {
  ADMISSIONS_YOUTUBE_PREVIEW_SPECS,
  admissionsPreviewEmbedUrl,
  type AdmissionsYoutubePreviewSpec,
} from 'src/constants/admissionsPreviewVideos';
import { useTypedSelector } from 'src/app/store';
import { canUseResearchPrepLive } from 'src/lib/researchPrepAccess';
import { canUseMyRewards } from 'src/lib/myRewardsAccess';
import MyRewardsEditorialView, { MyRewardsComingSoon } from '../MyRewardsEditorialView';
import CommunityMentorsView from './CommunityMentorsView';
import { getLatestCreatedImg } from 'src/utils';
import { displayName } from 'src/utils/displayName';
import { applicantLinks } from 'src/lib/applicantWorkspace';

type CommunitySectionKey =
  | 'feed'
  | 'messages'
  | 'buddies'
  | 'more'
  | 'others'
  | 'account'
  | 'myLearning'
  | 'aiMajorMatch'
  | 'admissionsProgram'
  | 'satCourse'
  | 'researchProgram'
  // Ranked mentor directory (relevant to the student's own college list +
  // goals) — the COMMUNITY sidebar's "Mentors" item. Distinct from the
  // public, unranked `/mentors` page the header link still points at.
  | 'mentors'
  // Community-membership funnel — pre-subscription gate. The English
  // placement test that used to be step 1 has been removed; the
  // profile wizard is now the funnel's entry point.
  // URLs: ?section=placement-profile, ?section=placement-roadmap
  | 'placementProfile'
  | 'placementRoadmap';
/**
 * Wraps ResearchPrepPage and resolves the current user's Full Support
 * enrollment, which gates the "Book a mentor review" CTA on each
 * assignment submission card. FS students get auto-routed to their teacher;
 * non-FS students see the optional booking CTA.
 */
function ResearchPrepSection() {
  const { data: enrollmentMe } = useGetEnrollmentMeQuery();
  const isFullSupport = Boolean((enrollmentMe as any)?.data?.enrolled);
  return <ResearchPrepPage isFullSupport={isFullSupport} />;
}

export default function CommunityHubMockPage() {
  // The messenger fills exactly the space left in the window (no page scroll).
  const fitMessenger = useFitToViewport<HTMLDivElement>(320);
  const myLearningPath = useMyLearningPath();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCommunityEnrolled } = useJourneyExperience();
  const profile = useTypedSelector((s) => s.auth.profile);
  const currentProfile = {
    name: displayName(profile?.profile?.name, profile?.email, t('common.user', 'User')),
    avatar: getLatestCreatedImg(profile?.profile?.media || []),
  };
  const researchPrepLive = useMemo(
    () =>
      canUseResearchPrepLive(
        profile?.email,
        profile?.managementRole as string | undefined,
        isCommunityEnrolled,
      ),
    [profile?.email, profile?.managementRole, isCommunityEnrolled],
  );
  // My Rewards editorial UI is gated to SuperAdmin/Owner during the
  // internal preview (see MY_REWARDS_SHOW_ALL). Everyone else sees the
  // "Coming soon" placeholder so the page stops feeling broken.
  const myRewardsLive = useMemo(
    () => canUseMyRewards(profile?.managementRole as string | undefined),
    [profile?.managementRole],
  );
  const [activeSection, setActiveSection] = useState<CommunitySectionKey>(() => {
    // Start embedded panes on the requested section, without mounting an
    // unrelated dashboard (and its data/video requests) for the first render.
    {
      const section = new URLSearchParams(location.search).get('section');
      const aliases: Record<string, CommunitySectionKey> = {
        'my-learning': 'myLearning', 'ai-major-match': 'aiMajorMatch',
        'admissions-program': 'admissionsProgram', 'sat-course': 'satCourse',
        'research-program': 'researchProgram', 'placement-profile': 'placementProfile',
        'placement-roadmap': 'placementRoadmap',
      };
      if (section && aliases[section]) return aliases[section];
      if (section && ['feed', 'messages', 'buddies', 'more', 'others', 'account', 'mentors'].includes(section)) return section as CommunitySectionKey;
    }
    if (ENABLE_COMMUNITY_FEED) return 'feed';
    return 'myLearning';
  });
  const [othersTarget, setOthersTarget] = useState<string | null>(() => new URLSearchParams(location.search).get('target'));
  const [accountTarget, setAccountTarget] = useState<string | null>(() => new URLSearchParams(location.search).get('target'));
  const [admissionsVideoModal, setAdmissionsVideoModal] = useState<AdmissionsYoutubePreviewSpec | null>(null);
  // Ad-hoc CommunityLockedPage variant — set when a CTA needs to surface
  // the unlock modal on-demand (e.g. "Go to admissions lessons" while not
  // community-enrolled). Distinct from `communityLockVariant`, which is
  // derived from section state and auto-renders for whole-section locks.
  const [adHocLockVariant, setAdHocLockVariant] = useState<CommunityLockVariant | null>(null);
  const [messagesConversationId, setMessagesConversationId] = useState<string | null>(null);
  const [messagesThreadId, setMessagesThreadId] = useState<string | null>(null);
  const defaultHubSectionPath = applicantLinks.overview;

  /**
   * Scroll-to-top on in-hub section change.
   *
   * The hub keeps the same `/student-hub` pathname across all sidebar
   * tabs — what changes is the `?section=…&target=…` query string. The
   * global `RootLayout` only re-scrolls on `pathname` changes, so without
   * this effect the new page renders at whatever scroll offset the
   * previous page was at (e.g. half-cut Settings card when arriving from
   * a long-scrolled Dashboard). Re-scrolling on `search` change here
   * keeps every sidebar click landing the user at the top of the column.
   */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.search]);

  /** Rollout guard: feed UI disabled → route feed to My Progress. */
  useEffect(() => {
    if (!isCommunityEnrolled || ENABLE_COMMUNITY_FEED) return;
    const params = new URLSearchParams(location.search);
    if (params.get('section') !== 'feed') return;
    navigate('/student-hub?section=my-learning', { replace: true });
  }, [location.search, isCommunityEnrolled, navigate]);

  /** Legacy ?section=learning&learningSub=… or learningPanel=… → flat sections */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('section') !== 'learning') return;
    const sub = params.get('learningSub');
    const panel = params.get('learningPanel');
    const subMap: Record<string, string> = {
      'ai-major-match': 'ai-major-match',
      admissions: 'admissions-program',
      sat: 'sat-course',
      research: 'research-program',
    };
    if (sub && subMap[sub]) {
      navigate(`/student-hub?section=${subMap[sub]}`, { replace: true });
      return;
    }
    if (panel === 'admissions') navigate('/student-hub?section=admissions-program', { replace: true });
    else if (panel === 'sat') navigate('/student-hub?section=sat-course', { replace: true });
    else if (panel === 'ai') navigate('/student-hub?section=ai-major-match', { replace: true });
    else if (params.get('tab') === 'admissions') navigate('/student-hub?section=admissions-program', { replace: true });
    else navigate(myLearningPath, { replace: true });
  }, [location.search, navigate, myLearningPath]);

  /** Workshops → public events (no hub section) */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('section') !== 'workshops') return;
    navigate('/events', { replace: true });
  }, [location.search, navigate]);

  /** Study groups page removed — send to default hub section */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('section') !== 'studyGroups') return;
    navigate(defaultHubSectionPath, { replace: true });
  }, [location.search, navigate, defaultHubSectionPath]);

  useEffect(() => {
    if (activeSection !== 'messages') {
      setMessagesConversationId(null);
      setMessagesThreadId(null);
    }
  }, [activeSection]);

  

  // Resolve community and learning sections within ApplicantShell:
  // /student-hub?section=more|others|account|buddies|messages|ai-major-match|…
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    const target = params.get('target');

    if (
      section === 'feed' ||
      section === 'messages' ||
      section === 'buddies' ||
      section === 'more' ||
      section === 'others' ||
      section === 'account' ||
      section === 'my-learning' ||
      section === 'ai-major-match' ||
      section === 'admissions-program' ||
      section === 'sat-course' ||
      section === 'research-program' ||
      section === 'placement-profile' ||
      section === 'placement-roadmap' ||
      section === 'mentors'
    ) {
      if (section === 'my-learning') setActiveSection('myLearning');
      else if (section === 'ai-major-match') setActiveSection('aiMajorMatch');
      else if (section === 'admissions-program') setActiveSection('admissionsProgram');
      else if (section === 'sat-course') setActiveSection('satCourse');
      else if (section === 'research-program') setActiveSection('researchProgram');
      else if (section === 'messages') setActiveSection('messages');
      else if (section === 'placement-profile') setActiveSection('placementProfile');
      else if (section === 'placement-roadmap') setActiveSection('placementRoadmap');
      else setActiveSection(section as CommunitySectionKey);
    }

    // Others targets (integrated shortcuts) - used when opening old pages inside community.
    if (section === 'others' && target) {
      setOthersTarget(target);
    } else {
      setOthersTarget(null);
    }

    // Account targets (integrated rewards, settings, etc.)
    if (section === 'account') {
      setAccountTarget(target ?? null);
    } else {
      setAccountTarget(null);
    }

  }, [location.search]);

  // Everyone can read the feed; posting and interactions remain gated.
  const isFeedAllowed = ENABLE_COMMUNITY_FEED;

  const pageHeader = useMemo((): { title: string; subtitle: string } | null => {
    switch (activeSection) {
      case 'buddies':
        return {
          title: t('studentHub.hub.findStudyBuddy', 'Find Study Buddy'),
          subtitle: t('studentHub.hub.buddiesSubtitle', 'Connect with peers who share your goals, prep schedules, and target schools.'),
        };
      case 'aiMajorMatch':
        return null;
      case 'admissionsProgram':
        return {
          title: t('studentHub.hub.admissionsPageTitle', 'Admissions Program'),
          subtitle: t('studentHub.hub.admissionsSubtitle', 'Continue to your admissions lessons from the learning catalog.'),
        };
      case 'satCourse':
        return {
          title: t('studentHub.hub.satPageTitle', 'SAT Test Prep'),
          subtitle: t('studentHub.hub.satSubtitle', 'Quizzes, flashcards, and bite-sized lessons for the digital SAT.'),
        };
      case 'researchProgram':
        // Research Prep brings its own top bar (breadcrumb + Overview/Module
        // switch + Back to My learning). Suppress the generic hub header here.
        return null;
      case 'mentors':
        // CommunityMentorsView renders its own editorial header (eyebrow +
        // serif title) matching My Rewards / My Progress. Suppress the
        // generic hub header here.
        return null;
      case 'account':
        if (accountTarget === 'rewards')
          return {
            title: t('studentHub.hub.myRewards', 'My Rewards'),
            subtitle: t('studentHub.hub.rewardsSubtitle', 'Earn coins by completing tasks and redeem them for perks.'),
          };
        if (accountTarget === 'settings')
          return {
            title: t('studentHub.nav.settings', 'Settings'),
            subtitle: t('studentHub.hub.settingsSubtitle', 'Manage your profile, subscription, and preferences.'),
          };
        return null;
      default:
        return null;
    }
  }, [activeSection, accountTarget, t]);

  const communityLockVariant = useMemo((): CommunityLockVariant | null => {
    if (activeSection === 'account' && accountTarget === 'rewards' && !isCommunityEnrolled) {
      return 'my-rewards';
    }
    if (!isCommunityEnrolled) {
      switch (activeSection) {
        case 'messages':
        case 'mentors':
          return 'community';
        case 'researchProgram':
          return 'research-program';
        default:
          return null;
      }
    }
    if (activeSection === 'researchProgram' && !researchPrepLive) {
      return 'research-prep-coming-soon';
    }
    return null;
  }, [isCommunityEnrolled, activeSection, accountTarget, researchPrepLive]);


  const needsExtraSubtitleGap =
    activeSection === 'satCourse' ||
    activeSection === 'admissionsProgram' ||
    (activeSection === 'account' && (accountTarget === 'rewards' || accountTarget === 'settings'));
  const needsSettingsSubtitleGap = activeSection === 'account' && accountTarget === 'settings';

  // Research Prep takes over the page once it opens — no community sidebar,
  // no max-width clamp. The page itself supplies a top bar with breadcrumb,
  // an Overview/Module switch, and a "Back to My learning" button.
  const isResearchFullBleed =
    activeSection === 'researchProgram' && isCommunityEnrolled && researchPrepLive;
  // Admissions Program also goes full-bleed for the editorial layout —
  // a breadcrumb at the top + cream-toned cards underneath.
  const isAdmissionsFullBleed = activeSection === 'admissionsProgram';
  const isFullBleed = isResearchFullBleed || isAdmissionsFullBleed;

  return (
    <div
      className={`${styles.hubPageOuter} ${styles.hubEmbedded} ${
        activeSection === 'feed' && ENABLE_COMMUNITY_FEED
          ? styles.hubPageOuterFeedCream
          : ''
      } ${
        isFullBleed ? styles.hubPageOuterFullBleed : ''
      } ${isAdmissionsFullBleed ? styles.admissionsShellOuter : ''}`}
    >
      <div
        className={`${styles.hub} ${
          isFullBleed ? styles.hubFullBleed : styles.hubNoRight
        } ${isAdmissionsFullBleed ? styles.admissionsShellHub : ''}`}
      >

      <div
        className={`${styles.centerCol} ${
          activeSection === 'messages' ? styles.centerColMessengerMode : ''
        }`}
      >
        <div
          className={`${styles.centerBody} ${
            activeSection === 'feed' && ENABLE_COMMUNITY_FEED
              ? styles.centerBodyFeedEditorial
              : ''
          } ${activeSection === 'messages' ? styles.centerBodyMessenger : ''}`}
        >
          <div
            key={`${activeSection}-${othersTarget ?? 'none'}-${accountTarget ?? 'none'}`}
            className={`${styles.sectionSwap} ${
              !(activeSection === 'feed' && ENABLE_COMMUNITY_FEED) &&
              !isResearchFullBleed
                ? styles.sectionSwapHubPad
                : ''
            }`}
          >
            {/* Editorial-style header for the magazine-themed sections
                (Messages, Find Study Buddy). Reuses the brand-red eyebrow
                + serif title pattern from SAT Prep / Admissions. */}
            {activeSection === 'messages' && (
              <header className={styles.editorialHeader}>
                <div className={styles.editorialEyebrow}>
                  {t('studentHub.hub.inbox', 'Inbox')}
                  <span className={styles.editorialEyebrowSep}>·</span>
                  <span className={styles.editorialEyebrowAccent}>
                    {t('studentHub.hub.inboxAccent', 'mentors, peers, support')}
                  </span>
                </div>
                <h1 className={styles.editorialTitle}>{t('studentHub.hub.messagesTitle', 'Messages')}</h1>
                <p className={styles.editorialDesc}>
                  {t(
                    'studentHub.hub.messagesDesc',
                    "All your conversations in one place — chat with your mentors, study buddies you've connected with, and the Top Coach team.",
                  )}
                </p>
              </header>
            )}
            {/* Study buddies: StudyBuddyHubSection renders its own page header. */}

            {/* Generic page header — skipped for sections that have their
                own editorial header above. My Rewards (both the editorial
                and the coming-soon view) bring their own hero header so we
                also suppress this generic title when the user is on the
                rewards target. */}
            {pageHeader &&
              !communityLockVariant &&
              !isAdmissionsFullBleed &&
              activeSection !== 'messages' &&
              activeSection !== 'buddies' &&
              !(activeSection === 'account' && accountTarget === 'rewards') &&
              !(activeSection === 'account' && accountTarget === 'settings') && (
              <div
                className={`${styles.pageHeader} ${needsExtraSubtitleGap ? styles.pageHeaderSpacious : ''} ${needsSettingsSubtitleGap ? styles.pageHeaderSettingsSpacious : ''} student-hub-page`}
              >
                <h1 className="student-hub-page-title">{pageHeader.title}</h1>
                <p className="student-hub-page-subtitle" style={{ marginTop: 8 }}>
                  {pageHeader.subtitle}
                </p>
                {activeSection === 'account' && accountTarget === 'rewards' && (
                  <div className={styles.comingSoonNote}>
                    {t('studentHub.hub.rewardsComingSoon', 'My Rewards modules are coming soon.')}
                  </div>
                )}
                {activeSection === 'satCourse' && (
                  <div className={styles.comingSoonNote}>
                    {t('studentHub.hub.satComingSoon', 'SAT Prep modules are coming soon.')}
                  </div>
                )}
              </div>
            )}

            {isAdmissionsFullBleed && (
              <header className={styles.admissionsShellHeader}>
                <div className={styles.admissionsShellInner}>
                  <Breadcrumb>
                    <Link to={myLearningPath}>{t('studentHub.hub.myLearning', 'My learning')}</Link>
                    <span>/</span>
                    {t('studentHub.hub.admissionsPageTitle', 'Admissions Program')}
                  </Breadcrumb>
                  <button
                    type="button"
                    className={styles.admissionsBackBtn}
                    onClick={() => navigate(myLearningPath)}
                  >
                    <ArrowLeft size={13} />
                    {t('studentHub.hub.backToMainMenu', 'Back to My learning')}
                  </button>
                </div>
                <div className={styles.admissionsHero}>
                  <div className={styles.admissionsEyebrow}>
                    {t('studentHub.hub.admissionsTrackEyebrow', 'Top Coach · Admissions track')}
                  </div>
                  <h1 className={styles.admissionsTitle}>
                    {t(
                      'studentHub.hub.admissionsHeroTitle',
                      'Get into your dream school — one lesson at a time.',
                    )}
                  </h1>
                  <p className={styles.admissionsSub}>
                    {t(
                      'studentHub.hub.admissionsHeroDesc',
                      'Continue your admissions lessons from the learning catalog. Bite-sized videos from mentors at Harvard, Oxford, Yale, Babson, and beyond.',
                    )}
                  </p>
                </div>
              </header>
            )}
            {communityLockVariant && (
              <div className={styles.feedLockedWrap}>
                <CommunityLockedPage variant={communityLockVariant} />
              </div>
            )}
            {adHocLockVariant && (
              <CommunityLockedPage
                variant={adHocLockVariant}
                onClose={() => setAdHocLockVariant(null)}
              />
            )}

            {activeSection === 'feed' && ENABLE_COMMUNITY_FEED && isFeedAllowed && (
              <CommunityFeedEditorialView
                readOnly={!isCommunityEnrolled}
                currentUser={{
                  id: profile?.id ?? '',
                  name: currentProfile.name,
                  initials: (currentProfile.name || 'U')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase() ?? '')
                    .join(''),
                  avatarColor: '#7B1F2F',
                  avatarUrl: currentProfile.avatar ?? null,
                  canPost:
                    profile?.managementRole === 'SuperAdmin' ||
                    profile?.managementRole === 'Admin' ||
                    (profile?.managementRole as string) === 'Owner',
                  canPin: profile?.managementRole === 'SuperAdmin',
                }}
                showUpcomingSessions
              />
            )}


          {activeSection === 'more' && (
            <Card className={styles.sectionCard} bordered={false}>
              <div className={styles.sectionSubHeader}>{t('studentHub.hub.browse', 'Browse')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                {[
                  {
                    key: 'buddies' as const,
                    label: t('studentHub.hub.findStudyBuddy', 'Find Study Buddy'),
                    icon: <UserPlus size={18} color="#8b0000" />,
                    preview: t('studentHub.hub.buddiesPreview', 'Accountability: SAT Math 3x/week'),
                    accent: '#b91c1c',
                  },
                  {
                    key: 'mentors' as const,
                    label: t('studentHub.hub.mentors', 'Mentors'),
                    icon: <GraduationCap size={18} color="#8b0000" />,
                    preview: t('studentHub.hub.mentorsPreview', 'Admissions + Research'),
                    accent: '#b91c1c',
                  },
                ].map((c) => (
                  <div key={c.key} className={styles.groupCard} style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1 }}>
                          <span style={{ display: 'flex', alignItems: 'center', lineHeight: 0 }}>{c.icon}</span>
                          {c.label}
                        </div>
                        <div style={{ color: '#64748b', fontWeight: 700, fontSize: 12, marginTop: 4 }}>
                          {c.preview}
                        </div>
                      </div>
                      <div className={styles.moreCountBadge} style={{ backgroundColor: 'rgba(139, 0, 0, 0.06)', borderColor: 'rgba(139, 0, 0, 0.25)' }}>
                        0
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 14 }}>
                      <Button
                        type="primary"
                        onClick={() => {
                          if (c.key === 'mentors') {
                            navigate('/mentors');
                            return;
                          }
                          setActiveSection(c.key);
                          navigate(`/student-hub?section=${c.key}`, { replace: true });
                        }}
                      >
                        {t('studentHub.hub.open', 'Open')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === 'others' && (
            <>
              {othersTarget ? (
                <div>
                  {othersTarget === 'full-support' && (
                    <div className={styles.hubDashEmbed}>
                      <FullSupportStudentPage />
                    </div>
                  )}
                  {othersTarget === 'major-match' && (
                    <div className={styles.hubDashEmbed}>
                      <MajorMatchV2Page />
                    </div>
                  )}
                  {othersTarget === 'opportunities' && <OpportunitiesPage />}
                  {othersTarget === 'profile' && <ProfilePage />}
                </div>
              ) : (
                <Card className={styles.sectionCard} bordered={false}>
                  <div className={styles.sectionSubHeader}>
                    {t('studentHub.hub.yourJourneyShortcuts', 'Your Journey shortcuts')}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                    {[
                      { label: t('fullSupport.navLabel', 'Full Support'), description: t('studentHub.hub.fullSupportDesc', 'Work with your dedicated mentor'), route: '/student-hub?section=others&target=full-support', icon: 'full-support' },
                      { label: t('studentHub.hub.majorMatchLabel', 'Major Match'), description: t('studentHub.hub.majorMatchDesc', 'Discover your best-fit major'), route: '/student-hub?section=others&target=major-match', icon: 'major-match' },
                      { label: t('studentHub.hub.opportunitiesLabel', 'Opportunities'), description: t('studentHub.hub.opportunitiesDesc', 'Find programs and competitions'), route: '/student-hub?section=others&target=opportunities', icon: 'opportunities' },
                      { label: t('studentHub.hub.essaysLabel', 'Essays'), description: t('studentHub.hub.essaysDesc', 'Draft and refine your essays'), route: '/student-hub?section=others&target=essays', icon: 'essays' },
                      { label: t('studentHub.hub.myProfileLabel', 'My Profile'), description: t('studentHub.hub.myProfileDesc', 'Your personal, academic and activities profile'), route: '/student-hub?section=others&target=profile', icon: 'profile' },
                    ].map((item) => (
                      <div key={item.route} className={styles.groupCard} style={{ padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span className={styles.navIconCircle}><UnifiedIcon name={item.icon as any} size="md" color="primary" /></span>
                            <div style={{ fontWeight: 900, color: '#0f172a' }}>{item.label}</div>
                          </div>
                          <Button type="primary" onClick={() => navigate(item.route)}>
                            {t('studentHub.hub.open', 'Open')}
                          </Button>
                        </div>
                        <div style={{ color: '#64748b', fontWeight: 700, fontSize: 12, marginTop: 8 }}>
                          {item.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {activeSection === 'account' && (
            <>
              {accountTarget === 'rewards' && isCommunityEnrolled && (
                <div className={styles.hubDashEmbed}>
                  {myRewardsLive ? <MyRewardsEditorialView /> : <MyRewardsComingSoon />}
                </div>
              )}
              {accountTarget === 'settings' && (
                // Same wrapper as every other in-hub page (Dashboard,
                // My Rewards, AI Major Match, Full Support, …) so the
                // title row lines up at the same y as My Progress.
                // Previously this used `.settingsSectionOffset` with a
                // bonus 18px top margin which made Settings visibly
                // drift below the other tabs.
                <div className={styles.hubDashEmbed}>
                  <MenteeSettingsPageMock embeddedInHub />
                </div>
              )}
              {accountTarget !== 'rewards' && accountTarget !== 'settings' && (
                <Card className={styles.sectionCard} bordered={false}>
                  <div className={styles.sectionSubHeader}>
                    {t('studentHub.hub.myRewards', 'My Rewards')}
                  </div>
                  <div style={{ color: '#64748b', fontWeight: 700 }}>
                    {t(
                      'studentHub.hub.selectRewardsOrSettings',
                      'Select "My Rewards" or "Settings" in the sidebar.',
                    )}
                  </div>
                </Card>
              )}
            </>
          )}

          {activeSection === 'myLearning' && (
            <div className={styles.hubDashEmbed}>
              <MyProgressEditorialView />
            </div>
          )}

          {activeSection === 'researchProgram' && isCommunityEnrolled && researchPrepLive && (
            <div className={styles.hubDashEmbed}>
              <ResearchPrepSection />
            </div>
          )}

          {/* Community Mentors — ranked directory, open to every student
              regardless of community enrollment (mirrors the ungated
              sidebar button, same as Find Study Buddy). */}
          {activeSection === 'mentors' && isCommunityEnrolled && (
            <div className={styles.hubDashEmbed}>
              <CommunityMentorsView />
            </div>
          )}

          {/* Non-community users never land in this in-hub branch for
              `researchProgram` anymore — the sidebar button routes them
              to the standalone `/student-hub/research-prep` surface
              (edge-to-edge, no hub sidebar, full-width blurred preview
              behind the unlock modal — same shape as SAT Prep). */}

          {activeSection === 'messages' && isCommunityEnrolled && (
            <div ref={fitMessenger} className={styles.messengerHubWrap}>
              <MessengerExperience
                embedded
                conversationId={messagesConversationId}
                threadId={messagesThreadId}
                onConversationChange={setMessagesConversationId}
                onThreadChange={setMessagesThreadId}
              />
            </div>
          )}

          {/* Funnel — Step 1: admissions profile wizard. The English
              placement test that used to gate this funnel has been
              removed; the profile wizard is now the entry point. */}
          {activeSection === 'placementProfile' && (
            <div className={styles.hubDashEmbed}>
              <PlacementProfileWizardPage />
            </div>
          )}

          {/* Funnel — Step 3: roadmap preview (or unlocked content if
              subscribed). The plan picker on the preview routes to the
              subscription tab. */}
          {activeSection === 'placementRoadmap' && (
            <div className={styles.hubDashEmbed}>
              <PlacementRoadmapPage />
            </div>
          )}

            {activeSection === 'buddies' && (
              <StudyBuddyConsentGate browseOnly={!isCommunityEnrolled}>
                <StudyBuddyHubSection
                  readOnly={!isCommunityEnrolled}
                  onOpenChat={(conversationId) => {
                    setMessagesConversationId(conversationId);
                    setActiveSection('messages');
                    navigate('/student-hub?section=messages', { replace: true });
                  }}
                />
              </StudyBuddyConsentGate>
            )}

            {/* Major Match only. The "College lists" tab that used to sit
                beside it was removed — college lists now live in the profile
                hub (?section=others&target=profile&tab=college-lists), and
                keeping a second copy here meant the same feature rendered in
                three places with three different chromes. With one panel left
                there is nothing for a Tabs shell to switch between. */}
            {activeSection === 'aiMajorMatch' && (
              <div className={styles.hubDashEmbed}>
                <div className={styles.embedTabPanel}>
                  <MajorMatchV2Page />
                </div>
              </div>
            )}

            {activeSection === 'admissionsProgram' && (
              <div className={styles.admissionsBody}>
                <div className={styles.admissionsListHeader}>
                  <div>
                    <h2 className={styles.admissionsListTitle}>
                      {t('studentHub.hub.featuredLessons', 'Featured lessons')}
                    </h2>
                    <div className={styles.admissionsListMeta}>
                      {t('studentHub.hub.videosMinTotal', '{{count}} videos · ~{{minutes}} min total', {
                        count: ADMISSIONS_YOUTUBE_PREVIEW_SPECS.length,
                        minutes: ADMISSIONS_YOUTUBE_PREVIEW_SPECS.reduce((n, s) => {
                          const [m, sec] = s.duration.split(':').map(Number);
                          return n + (m || 0) + (sec || 0) / 60;
                        }, 0).toFixed(0),
                      })}
                    </div>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    className={styles.programShortcutCta}
                    onClick={() => {
                      if (isCommunityEnrolled) {
                        navigate('/learning?course=admissions');
                      } else {
                        // Show the admissions-tailored unlock modal
                        // instead of bouncing through /learning, which
                        // would only surface a generic "enroll first" toast.
                        setAdHocLockVariant('admissions-program');
                      }
                    }}
                  >
                    {isCommunityEnrolled
                      ? t('studentHub.hub.goToAdmissionsLessons', 'Go to admissions lessons')
                      : 'Unlock all admissions lessons'}
                  </Button>
                </div>

                <div className={styles.admissionsVideoGrid}>
                  {ADMISSIONS_YOUTUBE_PREVIEW_SPECS.map((spec) => (
                    <button
                      key={spec.id}
                      type="button"
                      className={styles.admissionsVideoCard}
                      onClick={() => setAdmissionsVideoModal(spec)}
                    >
                      <div className={styles.admissionsVideoThumb}>
                        <img
                          src={spec.thumbnail}
                          alt=""
                          className={styles.admissionsVideoThumbImg}
                          loading="lazy"
                        />
                        <span className={styles.videoPlayFab}>
                          <Play size={22} color="#8b0000" />
                        </span>
                        <span className={styles.admissionsVideoDurChip}>{spec.duration}</span>
                      </div>
                      <div className={styles.admissionsVideoMeta}>
                        <div className={styles.admissionsVideoTitle}>{t(spec.titleKey)}</div>
                        <div className={styles.admissionsVideoDesc}>{t(spec.descriptionKey)}</div>
                        <div className={styles.admissionsVideoDur}>{spec.duration}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <Modal
                  open={admissionsVideoModal !== null}
                  onCancel={() => setAdmissionsVideoModal(null)}
                  footer={null}
                  width={920}
                  centered
                  destroyOnClose
                  title={admissionsVideoModal ? t(admissionsVideoModal.titleKey) : undefined}
                >
                  {admissionsVideoModal && (
                    <>
                      <div className={styles.admissionsEmbedFrame}>
                        <iframe
                          title={t(admissionsVideoModal.titleKey)}
                          src={admissionsPreviewEmbedUrl(admissionsVideoModal.youtubeId, true)}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className={styles.admissionsEmbedIframe}
                        />
                      </div>
                      <p className={styles.admissionsEmbedDesc}>{t(admissionsVideoModal.descriptionKey)}</p>
                    </>
                  )}
                </Modal>
              </div>
            )}

            {activeSection === 'satCourse' && <CoursePreview course="sat" />}

            {activeSection === 'researchProgram' && isCommunityEnrolled && null}
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}
