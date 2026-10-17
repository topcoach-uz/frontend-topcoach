import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  Compass,
  User,
  Home,
  Trophy,
  PlayCircle,
  UserPlus,
  GraduationCap,
  Settings,
  Lock,
  FlaskConical,
  Presentation,
  Coins,
  MessageCircle,
  Play,
  Shield,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useJourneyExperience } from 'src/contexts/JourneyExperienceContext';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import MyProgressEditorialView from '../MyProgressEditorialView';
import styles from './communityHubMock.module.scss';
import { ENABLE_COMMUNITY_FEED } from './communityFeedFlags';
import CommunityFeedEditorialView from './CommunityFeedEditorialView';
import FullSupportStudentPage from '../full-support/FullSupportStudentPage';
import ResearchPrepPage from '../research/ResearchPrepPage';
import CoursePreview from 'src/pages/learning/CoursePreview';
// ResearchPrepLockedPreview is now imported by StudentHubRoutes for the
// standalone /student-hub/research-prep surface (non-community users).
// The in-hub branch no longer renders the blurred preview.
import { useGetEnrollmentMeQuery } from '../../../app/services/fullSupportApi';
import { useGetCoinBalanceQuery } from '../../../app/services/coinsApi';
import { useStudentProfile } from '../../../hooks/useStudentHub';
// Major Match v2 (MAJOR_MATCH_V2_PLAN.md Stage 5 cutover) — replaces the
// legacy PsychometricAssessmentPage at both mounts in this file. Same prop
// contract (readOnly/studentId/onExit), so it's a drop-in swap.
import MajorMatchV2Page from '../major-match-v2/MajorMatchV2Page';
import OpportunitiesPage from '../opportunities/OpportunitiesPage';
import EssaysPage from '../essays/EssaysPage';
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
import { useStudyBuddyConsentStatusQuery } from 'src/app/services/student-hub/studyBuddyApi';
import MessengerExperience from '../../../components/chat/MessengerExperience';
import {
  ADMISSIONS_YOUTUBE_PREVIEW_SPECS,
  admissionsPreviewEmbedUrl,
  type AdmissionsYoutubePreviewSpec,
} from 'src/constants/admissionsPreviewVideos';
import { useTypedSelector } from 'src/app/store';
import { canUseResearchPrepLive } from 'src/lib/researchPrepAccess';
import { canUseSatPrep } from 'src/lib/satPrepAccess';
import { canUseMyRewards } from 'src/lib/myRewardsAccess';
import MyRewardsEditorialView, { MyRewardsComingSoon } from '../MyRewardsEditorialView';
import OrgMembershipSidebar from '../components/OrgMembershipSidebar';
import { getLatestCreatedImg } from 'src/utils';
import { displayName, sanitizeName } from 'src/utils/displayName';
import CommunityMentorsView from './CommunityMentorsView';

type CommunitySectionKey =
  | 'feed'
  | 'messages'
  | 'buddies'
  | 'more'
  | 'others'
  | 'account'
  | 'dashboard'
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
type CommunityNavItem = {
  key: CommunitySectionKey;
  label: string;
  icon: React.ReactNode;
};

const MOCK_COUNTS = {
  feed: 0,
  buddies: 0,
  mentors: 0,
  admissions: 6,
};

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

export default function CommunityHubMockPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCommunityEnrolled, unlockPremiumJourney, isEntitlementLoading } = useJourneyExperience();
  const profile = useTypedSelector((s) => s.auth.profile);
  // Coin balance for the sidebar card. The profile card (and its coin
  // chip) now renders for every student, not just community-enrolled
  // ones, so this query always runs for any authenticated user.
  const { data: coinBalance } = useGetCoinBalanceQuery();
  // Profile-completion percentage for the sidebar card's progress bar.
  // Reuses the same student-profile query the profile/dashboard pages
  // already subscribe to (see Dashboard.tsx / MyProgressEditorialView.tsx),
  // so this is a cache hit, not an extra request, once either page has loaded.
  const { profile: studentProfileForCard, isLoading: studentProfileCardLoading } =
    useStudentProfile();
  const profileCompletionPercentage = studentProfileForCard?.completionPercentage;
  const researchPrepLive = useMemo(
    () =>
      canUseResearchPrepLive(
        profile?.email,
        profile?.managementRole as string | undefined,
        isCommunityEnrolled,
      ),
    [profile?.email, profile?.managementRole, isCommunityEnrolled],
  );
  const satPrepLive = useMemo(
    () =>
      canUseSatPrep(
        profile?.managementRole as string | undefined,
        profile?.email,
      ) || isCommunityEnrolled,
    [profile?.managementRole, profile?.email, isCommunityEnrolled],
  );
  // My Rewards editorial UI is gated to SuperAdmin/Owner during the
  // internal preview (see MY_REWARDS_SHOW_ALL). Everyone else sees the
  // "Coming soon" placeholder so the page stops feeling broken.
  const myRewardsLive = useMemo(
    () => canUseMyRewards(profile?.managementRole as string | undefined),
    [profile?.managementRole],
  );
  const currentProfile = useMemo(() => {
    // displayName/sanitizeName keep legacy "Asila undefined" profile names —
    // and the "@asilaundefined" handle derived from them — off the card.
    const fullName = displayName(
      profile?.profile?.name,
      profile?.email,
      t('common.user', 'User'),
    );
    const username =
      sanitizeName((profile?.profile as any)?.username) ||
      `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}`;
    return {
      name: fullName,
      username: username.startsWith('@') ? username : `@${username}`,
      avatar: getLatestCreatedImg(profile?.profile?.media || []),
    };
  }, [profile?.profile, profile?.email, t]);

  // Feed-allowed users (community-enrolled + staff) land on `feed` by
  // default. Everyone else lands on the existing "My progress" panel,
  // so the page always has content. Profile is hydrated by the parent
  // layout before this component mounts, so the check is synchronous
  // in practice.
  const [activeSection, setActiveSection] = useState<CommunitySectionKey>(() => {
    // Start embedded panes on the requested section, without mounting an
    // unrelated dashboard (and its data/video requests) for the first render.
    if (embedded) {
      const section = new URLSearchParams(location.search).get('section');
      const aliases: Record<string, CommunitySectionKey> = {
        'my-learning': 'myLearning', 'ai-major-match': 'aiMajorMatch',
        'admissions-program': 'admissionsProgram', 'sat-course': 'satCourse',
        'research-program': 'researchProgram', 'placement-profile': 'placementProfile',
        'placement-roadmap': 'placementRoadmap',
      };
      if (section && aliases[section]) return aliases[section];
      if (section && ['feed', 'messages', 'buddies', 'more', 'others', 'account', 'dashboard', 'mentors'].includes(section)) return section as CommunitySectionKey;
    }
    if (ENABLE_COMMUNITY_FEED) return 'feed';
    return 'myLearning';
  });
  const [othersTarget, setOthersTarget] = useState<string | null>(() => embedded ? new URLSearchParams(location.search).get('target') : null);
  const [accountTarget, setAccountTarget] = useState<string | null>(() => embedded ? new URLSearchParams(location.search).get('target') : null);
  // Study Buddy is free; the editorial header shows once the user has accepted
  // the community guidelines (the consent gate renders the standalone intro
  // until then). Only fetched while on the buddies section.
  const { data: buddyConsent } = useStudyBuddyConsentStatusQuery(undefined, {
    skip: activeSection !== 'buddies',
  });
  const buddyConsented = !!buddyConsent?.consented;
  const [satSampleQuizChoice, setSatSampleQuizChoice] = useState<string | null>(null);
  const [admissionsVideoModal, setAdmissionsVideoModal] = useState<AdmissionsYoutubePreviewSpec | null>(null);
  // Ad-hoc CommunityLockedPage variant — set when a CTA needs to surface
  // the unlock modal on-demand (e.g. "Go to admissions lessons" while not
  // community-enrolled). Distinct from `communityLockVariant`, which is
  // derived from section state and auto-renders for whole-section locks.
  const [adHocLockVariant, setAdHocLockVariant] = useState<CommunityLockVariant | null>(null);
  const [messagesConversationId, setMessagesConversationId] = useState<string | null>(null);
  const [messagesThreadId, setMessagesThreadId] = useState<string | null>(null);
  const defaultHubSectionPath = isCommunityEnrolled
    ? ENABLE_COMMUNITY_FEED
      ? '/student-hub?section=feed'
      : '/student-hub?section=my-learning'
    : '/student-hub?section=dashboard';

  /** Default landing: dashboard when not enrolled; feed/my-progress when enrolled. */
  useEffect(() => {
    if (location.pathname !== '/student-hub' && location.pathname !== '/student-hub/') return;
    if (location.search && location.search.length > 1) return;
    // Don't commit to the not-enrolled default while entitlement is still
    // resolving on a fresh device — otherwise an enrolled user lands on the
    // dashboard upsell and then gets yanked to Feed a beat later.
    if (isEntitlementLoading) return;
    navigate(defaultHubSectionPath, { replace: true });
  }, [location.pathname, location.search, defaultHubSectionPath, navigate, isEntitlementLoading]);

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

  // `?section=dashboard` used to bounce community-enrolled users back to
  // the feed/my-progress default — that redirect is gone. Enrolled users
  // can now reach Dashboard via the nav item below; the DEFAULT landing
  // for them is still the feed (see `defaultHubSectionPath` above and the
  // effect at the top of this file), this only affects reachability once
  // they're already in the hub.

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
    else navigate(defaultHubSectionPath, { replace: true });
  }, [location.search, navigate, defaultHubSectionPath]);

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

  

  // Support simple deep-linking inside this mock:
  // /student-hub?section=more|others|account|dashboard|buddies|messages|ai-major-match|…
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    const target = params.get('target');

    // "College Lists" and "Documents" used to be standalone others-targets;
    // they now live as tabs inside the Profile hub. Redirect old deep-links
    // (bookmarks, StudentHubRoutes legacy-route redirects, in-app CTAs that
    // haven't been repointed) instead of rendering an empty pane. Preserves
    // any other params (e.g. applicationFlow=new) via the copied URLSearchParams.
    if (section === 'others' && (target === 'college-lists' || target === 'documents')) {
      const next = new URLSearchParams(params);
      next.set('target', 'profile');
      next.set('tab', target);
      navigate(`/student-hub?${next.toString()}`, { replace: true });
      return;
    }

    if (
      section === 'feed' ||
      section === 'messages' ||
      section === 'buddies' ||
      section === 'more' ||
      section === 'others' ||
      section === 'account' ||
      section === 'dashboard' ||
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

  const navItems: CommunityNavItem[] = useMemo(
    () => [
      ...(isFeedAllowed
        ? [{ key: 'feed' as const, label: 'Feed', icon: <Compass size={16} color="#fff" /> }]
        : []),
      { key: 'messages', label: 'Messages', icon: <MessageCircle size={16} color="#fff" /> },
      { key: 'buddies', label: 'Find Study Buddy', icon: <User size={16} color="#fff" /> },
    ],
    [isFeedAllowed]
  );

  const dashboardNav = useMemo(
    () => ({
      label: 'Dashboard',
      route: '/student-hub/dashboard',
      icon: <UnifiedIcon name="dashboard" size="sm" color="#fff" />,
      bg: '#8b0000',
    }),
    []
  );

  const yourJourneyOthersNav = useMemo(
    () => [
      { label: 'Full Support', route: '/student-hub/full-support', icon: <UnifiedIcon name="full-support" size="sm" color="#fff" />, bg: '#8b0000' },
      { label: 'College Lists', route: '/student-hub/applications', icon: <UnifiedIcon name="applications" size="sm" color="#fff" />, bg: '#8b0000' },
      { label: 'Major Match', route: '/student-hub/psychometric-assessment', icon: <UnifiedIcon name="major-match" size="sm" color="#fff" />, bg: '#8b0000' },
      { label: 'Opportunities', route: '/student-hub/opportunities', icon: <UnifiedIcon name="opportunities" size="sm" color="#fff" />, bg: '#8b0000' },
      { label: 'Essays', route: '/student-hub/essays', icon: <UnifiedIcon name="essays" size="sm" color="#fff" />, bg: '#8b0000' },
      { label: 'Documents', route: '/student-hub/documents', icon: <UnifiedIcon name="documents" size="sm" color="#fff" />, bg: '#8b0000' },
      { label: 'My Profile', route: '/student-hub/profile', icon: <UnifiedIcon name="profile" size="sm" color="#fff" />, bg: '#8b0000' },
    ],
    []
  );

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
        // switch + Back to main menu). Suppress the generic hub header here.
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

  const hideHubChrome = true;

  const needsExtraSubtitleGap =
    activeSection === 'satCourse' ||
    activeSection === 'admissionsProgram' ||
    (activeSection === 'account' && (accountTarget === 'rewards' || accountTarget === 'settings'));
  const needsSettingsSubtitleGap = activeSection === 'account' && accountTarget === 'settings';

  // Research Prep takes over the page once it opens — no community sidebar,
  // no max-width clamp. The page itself supplies a top bar with breadcrumb,
  // an Overview/Module switch, and a "Back to main menu" button.
  const isResearchFullBleed =
    activeSection === 'researchProgram' && isCommunityEnrolled && researchPrepLive;
  // Admissions Program also goes full-bleed for the editorial layout —
  // a breadcrumb at the top + cream-toned cards underneath.
  const isAdmissionsFullBleed = activeSection === 'admissionsProgram';
  const isFullBleed = isResearchFullBleed || isAdmissionsFullBleed;

  return (
    <div
      className={`${styles.hubPageOuter} ${embedded ? styles.hubEmbedded : ''} ${
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
      {!embedded && <div
        className={`${styles.leftCol} ${isFullBleed ? styles.leftColHidden : ''}`}
      >
        <div className={styles.leftColInner}>
        <Card
          className={styles.profileCard}
          bordered={false}
          role="button"
          tabIndex={0}
          aria-label="View my profile"
          onClick={() => navigate('/student-hub?section=others&target=profile')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/student-hub?section=others&target=profile');
            }
          }}
        >
          {/* Compact row + coin chip layout (Option B from the design
              explorations). Avatar + identity on one row, coin chip +
              "View profile" CTA on the next. Drops the hero photo band
              and shadow that the old single-column layout used. Renders
              for every student, not just community-enrolled ones — the
              coin balance and completion bar are both real, per-user
              data that any student has. */}
          <div className={styles.profileTopRow}>
            <div className={styles.profilePhoto}>
              {currentProfile.avatar ? (
                <img
                  src={currentProfile.avatar}
                  alt={currentProfile.name}
                  className={styles.profilePhotoImg}
                />
              ) : (
                <div className={styles.profilePhotoFallback} aria-hidden>
                  <User size={28} />
                </div>
              )}
            </div>
            <div className={styles.profileMeta}>
              <div className={styles.profileName} title={currentProfile.name}>
                {currentProfile.name}
              </div>
              <div className={styles.profileHandle} title={currentProfile.username}>
                {currentProfile.username}
              </div>
            </div>
          </div>
          {!studentProfileCardLoading && typeof profileCompletionPercentage === 'number' && (
            profileCompletionPercentage >= 100 ? (
              <button
                type="button"
                className={styles.profileCompletionDone}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/student-hub/profile');
                }}
              >
                {t('studentHub.profileCard.complete', 'Profile complete ✓')}
              </button>
            ) : (
              <button
                type="button"
                className={styles.profileCompletion}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/student-hub/profile');
                }}
                aria-label={t(
                  'studentHub.profileCard.completionAria',
                  'Profile {{percent}}% complete — go to profile',
                  { percent: profileCompletionPercentage },
                )}
              >
                <span className={styles.profileCompletionLabel}>
                  {t('studentHub.profileCard.completion', 'Profile {{percent}}% complete', {
                    percent: profileCompletionPercentage,
                  })}
                </span>
                <span className={styles.profileCompletionTrack}>
                  <span
                    className={styles.profileCompletionFill}
                    style={{ width: `${Math.min(100, Math.max(0, profileCompletionPercentage))}%` }}
                  />
                </span>
              </button>
            )
          )}
          <div className={styles.profileBottomRow}>
            <button
              type="button"
              className={styles.profileCoinsInline}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/student-hub?section=account&target=rewards');
              }}
              aria-label={`View ${coinBalance?.balance ?? 0} TopCoach coins`}
            >
              <Coins size={13} aria-hidden />
              <span className={styles.profileCoinsValue}>
                {(coinBalance?.balance ?? 0).toLocaleString()}
              </span>
            </button>
            <div className={styles.profileFooter}>
              <span>{t('studentHub.hub.viewProfile', 'View profile')}</span>
              <span className={styles.profileFooterArrow} aria-hidden>→</span>
            </div>
          </div>
        </Card>

        {/* Organization membership. Lives here rather than on a single page so
            it is visible throughout the hub: its previous mount point was the
            legacy Dashboard, which no longer renders, so students in an org
            were never told they were in one. */}
        <OrgMembershipSidebar />

        <div className={styles.leftNav}>
          {/* Dashboard is reachable for every student, enrolled or not —
              it renders the same MyProgressEditorialView as "My progress"
              below (see the isCommunityEnrolled branch inside that
              component for what each cohort actually sees). */}
          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'dashboard' ? styles.navItemActive : ''}`}
            onClick={() => {
              setActiveSection('dashboard');
              navigate('/student-hub?section=dashboard', { replace: true });
            }}
          >
            <span className={styles.navIconCircle}><Home size={20} color="#8b0000" /></span>
            <span className={styles.navLabel}>{t('studentHub.nav.dashboard', 'Dashboard')}</span>
          </button>

          {/* ISC Reviewer link removed from the sidebar. The console itself is
              untouched and still reachable at /isc-2026/review; only the nav
              entry is gone, so restoring it is a small revert. */}

          {/* Feed is now ALWAYS shown when the feature flag is on — even to
              students who aren't community-enrolled. Non-enrolled users get
              the lock icon + tooltip and land on CommunityLockedPage (see
              `communityLockVariant`) when they click it, same pattern as
              SAT/Admissions/Research/My Rewards below. This mirrors the
              mobile drawer (CommunityHubMobileDrawerNav) so the Feed
              nav item is no longer invisible to the exact audience the
              pitch page is written for. `isFeedAllowed` (enrolled OR
              staff) still gates the real feed CONTENT render further
              down — that backend-matching gate is untouched. */}
          {ENABLE_COMMUNITY_FEED && (
            <button
              type="button"
              className={`${styles.navItem} ${activeSection === 'feed' ? styles.navItemActive : ''}`}
              onClick={() => {
                setActiveSection('feed');
                navigate('/student-hub?section=feed', { replace: true });
              }}
            >
              <span className={styles.navIconCircle}>
                <Compass size={20} color="#8b0000" />
              </span>
              <span className={styles.navLabel}>{t('studentHub.hub.feed', 'Feed')}</span>
              {/* Match the shared lock-icon pattern used by SAT/Admissions/
                  Research/My Rewards so the Feed row reads as part of the
                  same locked-items family — same size, same SCSS class. */}
            </button>
          )}

          <div className={styles.leftNavHeader}>{t('studentHub.hub.navCommunity', 'COMMUNITY')}</div>
          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'buddies' ? styles.navItemActive : ''}`}
            onClick={() => {
              setActiveSection('buddies');
              navigate('/student-hub?section=buddies', { replace: true });
            }}
          >
            <span className={styles.navIconCircle}>
              <UserPlus size={20} color="#8b0000" />
            </span>
            <span className={styles.navLabel}>{t('studentHub.hub.findStudyBuddy', 'Find study buddy')}</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'mentors' ? styles.navItemActive : ''}`}
            onClick={() => {
              setActiveSection('mentors');
              navigate('/student-hub?section=mentors', { replace: true });
            }}
          >
            <span className={styles.navIconCircle}><UnifiedIcon name="mentors" size="md" color="primary" /></span>
            <span className={styles.navLabel}>{t('studentHub.hub.mentors', 'Mentors')}</span>
          </button>

          <div className={styles.leftNavHeader}>{t('studentHub.hub.navLearning', 'LEARNING')}</div>

          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'myLearning' ? styles.navItemActive : ''}`}
            onClick={() => {
              setActiveSection('myLearning');
              navigate('/student-hub?section=my-learning', { replace: true });
            }}
          >
            <span className={styles.navIconCircle}><PlayCircle size={18} color="#8b0000" /></span>
            <span className={styles.navLabel}>{t('studentHub.hub.myProgress', 'My progress')}</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'others' && othersTarget === 'full-support' ? styles.navItemActive : ''}`}
            onClick={() => {
              setOthersTarget('full-support');
              setActiveSection('others');
              navigate('/student-hub?section=others&target=full-support', { replace: true });
            }}
          >
            <span className={styles.navIconCircle}><UnifiedIcon name="full-support" size="md" color="primary" /></span>
            <span className={styles.navLabel}>{t('fullSupport.navLabel', 'Full Support')}</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'aiMajorMatch' ? styles.navItemActive : ''}`}
            onClick={() => {
              setActiveSection('aiMajorMatch');
              navigate('/student-hub?section=ai-major-match', { replace: true });
            }}
          >
            <span className={styles.navIconCircle}>
              <UnifiedIcon name="major-match" size="md" color="primary" />
            </span>
            <span className={styles.navLabel}>{t('studentHub.hub.aiMajorMatch', 'AI Major Match')}</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'others' && othersTarget === 'profile' && new URLSearchParams(location.search).get('tab') === 'college-lists' ? styles.navItemActive : ''}`}
            onClick={() => {
              setOthersTarget('profile');
              setActiveSection('others');
              navigate('/student-hub?section=others&target=profile&tab=college-lists', { replace: true });
            }}
          >
            <span className={styles.navIconCircle}><UnifiedIcon name="applications" size="md" color="primary" /></span>
            <span className={styles.navLabel}>{t('studentHub.nav.applications', 'Applications')}</span>
          </button>

          <button type="button" className={styles.navItem} onClick={() => navigate('/student-hub/ielts-prep')}>
            <span className={styles.navIconCircle}><UnifiedIcon name="language" size="md" color="primary" /></span>
            <span className={styles.navLabel}>{t('studentHub.hub.ieltsTestPrep', 'IELTS test prep')}</span>
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() => navigate('/student-hub/sat-prep')}
          >
            <span className={styles.navIconCircle}>
              <UnifiedIcon name="sat" size="md" color="primary" />
            </span>
            <span className={styles.navLabel}>{t('studentHub.hub.satTestPrep', 'SAT test prep')}</span>
            {!satPrepLive && <Lock size={14} className={styles.navLockIcon} />}
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'admissionsProgram' ? styles.navItemActive : ''}`}
            onClick={() => {
              // Community-enrolled users skip the marketing landing
              // page and jump straight into the lesson player. Non-
              // enrolled users still see the landing page (with the
              // free preview videos); the "Go to admissions lessons"
              // button on that page triggers the unlock popup.
              if (isCommunityEnrolled) {
                navigate('/learning?course=admissions');
                return;
              }
              setActiveSection('admissionsProgram');
              navigate('/student-hub?section=admissions-program', { replace: true });
            }}
          >
            <span className={styles.navIconCircle}>
              <UnifiedIcon name="admissions" size="md" color="primary" />
            </span>
            <span className={styles.navLabel}>{t('studentHub.hub.admissionsCourse', 'Admissions course')}</span>
            {!isCommunityEnrolled && <Lock size={14} className={styles.navLockIcon} />}
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'researchProgram' ? styles.navItemActive : ''}`}
            onClick={() => {
              // Non-community users go to the standalone, edge-to-edge
              // locked surface (blurred preview + unlock modal, no hub
              // sidebar). Community users stay in-hub on the real page.
              if (!isCommunityEnrolled) {
                navigate('/student-hub/research-prep');
                return;
              }
              setActiveSection('researchProgram');
              navigate('/student-hub?section=research-program', { replace: true });
            }}
          >
            <span className={styles.navIconCircle}>
              <FlaskConical size={20} color="#8b0000" />
            </span>
            <span className={styles.navLabel}>{t('studentHub.hub.researchPrep', 'Research Prep')}</span>
            {!isCommunityEnrolled && <Lock size={14} className={styles.navLockIcon} />}
          </button>

          {/* Opportunities entry hidden for now — feature still building.
              Restore by un-commenting when the page is ready. */}
          {false && (
            <button
              type="button"
              className={styles.navItem}
              onClick={() => navigate('/events')}
            >
              <span className={styles.navIconCircle}>
                <Presentation size={20} color="#8b0000" />
              </span>
              <span className={styles.navLabel}>{t('studentHub.hub.opportunitiesNav', 'Opportunities')}</span>
            </button>
          )}

          <div className={styles.leftNavHeader}>{t('studentHub.hub.navAccount', 'ACCOUNT')}</div>
          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'account' && accountTarget === 'rewards' ? styles.navItemActive : ''}`}
            onClick={() => {
              setActiveSection('account');
              navigate('/student-hub?section=account&target=rewards', { replace: true });
            }}
          >
            <span className={styles.navIconCircle}><Trophy size={20} color="#8b0000" /></span>
            <span className={styles.navLabel}>{t('studentHub.hub.myRewards', 'My Rewards')}</span>
            {!isCommunityEnrolled && <Lock size={14} className={styles.navLockIcon} />}
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'account' && accountTarget === 'settings' ? styles.navItemActive : ''}`}
            onClick={() => {
              setActiveSection('account');
              navigate('/student-hub?section=account&target=settings', { replace: true });
            }}
          >
            <span className={styles.navIconCircle}><Settings size={20} color="#8b0000" /></span>
            <span className={styles.navLabel}>{t('studentHub.nav.settings', 'Settings')}</span>
          </button>

          {((profile as { managementRole?: string } | null | undefined)?.managementRole === 'SuperAdmin' ||
            (profile as { managementRole?: string } | null | undefined)?.managementRole === 'Owner') && (
            <button
              type="button"
              className={styles.navItem}
              onClick={() => navigate('/new-admin/dashboard')}
            >
              <span className={styles.navIconCircle}><Shield size={20} color="#8b0000" /></span>
              <span className={styles.navLabel}>{t('studentHub.nav.adminConsole', 'Admin console')}</span>
            </button>
          )}
        </div>
        </div>
      </div>}

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
            {activeSection === 'buddies' && buddyConsented && (
              <header className={styles.editorialHeader}>
                <div className={styles.editorialEyebrow}>
                  {t('studentHub.hub.studyBuddiesEyebrow', 'Study buddies')}
                  <span className={styles.editorialEyebrowSep}>·</span>
                  <span className={styles.editorialEyebrowAccent}>
                    {t('studentHub.hub.matchByGoal', 'match by goal')}
                  </span>
                </div>
                <h1 className={styles.editorialTitle}>
                  {t('studentHub.hub.findSomeoneTitle', 'Find someone on the same path.')}
                </h1>
                <p className={styles.editorialDesc}>
                  {t(
                    'studentHub.hub.findSomeoneDesc',
                    'Connect with peers who share your goals, prep schedules, and target schools. Match scores are based on overlap in exam prep, destination goals, intended majors, and focus areas.',
                  )}
                </p>
              </header>
            )}

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
                  <div className={styles.admissionsCrumb}>
                    <span className={styles.admissionsCrumbBadge}>
                      <BookOpen size={13} /> {t('studentHub.hub.admissionsPageTitle', 'Admissions Program')}
                    </span>
                    <span className={styles.admissionsCrumbSep}>›</span>
                    <span className={styles.admissionsCrumbCurrent}>
                      {t('studentHub.hub.lessonsCatalog', 'Lessons catalog')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.admissionsBackBtn}
                    onClick={() => navigate(defaultHubSectionPath)}
                  >
                    <ArrowLeft size={13} />
                    {t('studentHub.hub.backToMainMenu', 'Back to main menu')}
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
                    count: MOCK_COUNTS.buddies,
                    preview: t('studentHub.hub.buddiesPreview', 'Accountability: SAT Math 3x/week'),
                    accent: '#b91c1c',
                  },
                  {
                    key: 'mentors' as const,
                    label: t('studentHub.hub.mentors', 'Mentors'),
                    icon: <GraduationCap size={18} color="#8b0000" />,
                    count: MOCK_COUNTS.mentors,
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
                        {c.count}
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
                  {othersTarget === 'essays' && <EssaysPage />}
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

          {activeSection === 'dashboard' && (
            <div className={styles.hubDashEmbed}>
              {/* Non-community (Standard) mode used to render the legacy
                  `<Dashboard />` here, which felt out-of-place next to the
                  rest of the editorial pages. Both modes now share the
                  same editorial My Progress view so Standard ≠ visually
                  stale. */}
              <MyProgressEditorialView />
            </div>
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
            <div className={styles.messengerHubWrap}>
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
