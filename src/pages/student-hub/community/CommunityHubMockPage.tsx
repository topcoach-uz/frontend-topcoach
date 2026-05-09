import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Input, Modal, Radio, Select, Space, Tag, Tabs, message } from 'antd';
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
  Camera,
  Paperclip,
  BarChart3,
  Coins,
  Type,
  MessageCircle,
  Play,
  Layers,
  FlipHorizontal,
  Heart,
  Bookmark,
  MessageSquare,
  Share2,
  MoreHorizontal,
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
import FullSupportStudentPage from '../full-support/FullSupportStudentPage';
import ResearchPrepPage from '../research/ResearchPrepPage';
import { useGetEnrollmentMeQuery } from '../../../app/services/fullSupportApi';
import ApplicationsPage from '../applications/ApplicationsPage';
import PsychometricAssessmentPage from '../psychometric-assessment/PsychometricAssessmentPage';
import OpportunitiesPage from '../opportunities/OpportunitiesPage';
import EssaysPage from '../essays/EssaysPage';
import DocumentsPage from '../documents/DocumentsPage';
import ProfilePage from '../profile/ProfilePage';
import MenteeSettingsPageMock from '../settings/MenteeSettingsPageMock';
import CommunityLockedPage, { type CommunityLockVariant } from './CommunityLockedPage';
import StudyBuddyHubSection from './StudyBuddyHubSection';
import MessengerExperience from '../../../components/chat/MessengerExperience';
import {
  ADMISSIONS_YOUTUBE_PREVIEW_SPECS,
  admissionsPreviewEmbedUrl,
  type AdmissionsYoutubePreviewSpec,
} from 'src/constants/admissionsPreviewVideos';
import { type StudyBuddyInterestProfile } from 'src/constants/studyBuddyInterests';
import { useTypedSelector } from 'src/app/store';
import { canUseResearchPrepLive } from 'src/lib/researchPrepAccess';
import { canUseSatPrep } from 'src/lib/satPrepAccess';
import { canUseMyRewards } from 'src/lib/myRewardsAccess';
import MyRewardsEditorialView, { MyRewardsComingSoon } from '../MyRewardsEditorialView';
import { getLatestCreatedImg } from 'src/utils';

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
  | 'researchProgram';
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

type BuddyCandidate = {
  id: string;
  name: string;
  goal: string;
  distance: string;
  interests: StudyBuddyInterestProfile;
};

const MOCK_BUDDY_CANDIDATES: BuddyCandidate[] = [
  {
    id: 'bd1',
    name: 'Priya Nair',
    goal: 'Looking for SAT math accountability (3x/week).',
    distance: 'Same schedule',
    interests: {
      examPrep: ['sat'],
      applicationGoals: ['apply-usa'],
      intendedMajors: ['major-medicine'],
      focusAreas: ['focus-deadlines', 'focus-essays'],
    },
  },
  {
    id: 'bd2',
    name: 'Omar Hassan',
    goal: 'Need a buddy for essay reviews and IELTS prep.',
    distance: 'Same timeline',
    interests: {
      examPrep: ['ielts'],
      applicationGoals: ['apply-uk'],
      intendedMajors: ['major-law'],
      focusAreas: ['focus-essays', 'focus-interview'],
    },
  },
  {
    id: 'bd3',
    name: 'Sofia Ivanova',
    goal: 'Research portfolio partner for STEM applications.',
    distance: '2h timezone difference',
    interests: {
      examPrep: ['sat', 'toefl'],
      applicationGoals: ['apply-usa', 'scholarships'],
      intendedMajors: ['major-engineering', 'major-cs'],
      focusAreas: ['focus-research', 'focus-activities'],
    },
  },
];

type MockFeedPost = {
  id: string;
  v: 'forYou' | 'following' | 'trending';
  pinned?: boolean;
  pinnedBy?: string;
  authorEmoji?: string;
  authorName: string;
  authorHandle: string;
  authorRoleLine: string;
  authorSubLine: string;
  timeAgo: string;
  views: number;
  category: string;
  body: string;
  likes: number;
  comments: number;
  earnedCoins?: number;
  studyBuddyRequest?: {
    heading: string;
    tracks: string[];
    cta: string;
  };
  isOwnPost?: boolean;
};

type MockFeedComment = {
  id: string;
  author: string;
  handle: string;
  text: string;
  timeAgo: string;
  likes?: number;
};

const MOCK_COMMENTS_BY_POST: Record<string, MockFeedComment[]> = {
  p0: [
    {
      id: 'p0-c1',
      author: 'Lina Ahmed',
      handle: '@lina.prehealth',
      text: 'This is so true. My personal statement clicked only after I connected it to one patient story.',
      timeAgo: '48m',
      likes: 22,
    },
    {
      id: 'p0-c2',
      author: 'Aditya Rao',
      handle: '@adityarao',
      text: 'Can you share examples of what counts as “specific” for program fit?',
      timeAgo: '35m',
      likes: 9,
    },
  ],
  p1: [
    {
      id: 'p1-c1',
      author: 'Mariam T.',
      handle: '@mariamstem',
      text: 'I am in for orgo accountability. Tuesdays/Thursdays work for me.',
      timeAgo: '1h',
      likes: 6,
    },
  ],
  p4: [
    {
      id: 'p4-c1',
      author: 'Noah Kim',
      handle: '@noahapps',
      text: '“Story arc” is exactly what my counselor said. This post should be pinned.',
      timeAgo: '2h',
      likes: 14,
    },
  ],
};

const MOCK_FEED_POSTS: MockFeedPost[] = [
  {
    id: 'p0',
    v: 'forYou',
    pinned: true,
    pinnedBy: 'TopCoach',
    authorEmoji: '👩‍⚕️',
    authorName: 'Dr. Maya Reyes',
    authorHandle: '@drmayareyes',
    authorRoleLine: '🏆 Mentor',
    authorSubLine: 'Harvard Med Alumni',
    timeAgo: '2 hours ago',
    views: 2400,
    category: '⚕️ Medicine',
    body:
      'Pre-med students: here’s what I wish I knew before applying to medical school.\n\nAfter reviewing 200+ AMCAS applications, the #1 differentiator wasn’t GPA or MCAT.\nIt was authentic research narrative.\n\nAsk yourself: "Why THIS program, THIS community?"\nIf your answer isn’t specific, it’s not ready.',
    likes: 847,
    comments: 124,
    earnedCoins: 340,
  },
  {
    id: 'p1',
    v: 'forYou',
    authorEmoji: '🌱',
    authorName: 'Priya Nair',
    authorHandle: '@priyanair26',
    authorRoleLine: 'New',
    authorSubLine: 'Pre-Med · Johns Hopkins hopeful',
    timeAgo: '4 hours ago',
    views: 1100,
    category: '⚕️ Medicine',
    body:
      "Hey everyone! 👋 I want to study medicine and I’m a sophomore working on pre-med requirements.\n\nAnyone else aiming for med school? Looking for study partners for orgo + biochem! 🔬",
    likes: 63,
    comments: 31,
    studyBuddyRequest: {
      heading: 'Study Buddy Request: Medicine Track',
      tracks: ['Organic Chemistry', 'Biochemistry', 'MCAT Prep'],
      cta: 'Join Group →',
    },
    earnedCoins: 0,
  },
  {
    id: 'p2',
    v: 'following',
    authorEmoji: '⭐',
    authorName: 'Marcus Webb',
    authorHandle: '@marcuswebb',
    authorRoleLine: 'Pro',
    authorSubLine: 'CS @ MIT · Class of 2025',
    timeAgo: 'Yesterday',
    views: 5100,
    category: '💻 CS / Tech',
    body:
      'I got into MIT CS last year. Here’s the honest truth 🧵\n\n1️⃣ My essay wasn’t about coding. It was about teaching my grandmother to use Zoom during COVID.\n2️⃣ One research project, not five internships. Quality > quantity.\n3️⃣ I used TopCoach’s AI Writing and went through 14 drafts.',
    likes: 1204,
    comments: 287,
    earnedCoins: 520,
  },
  {
    id: 'p3',
    v: 'trending',
    authorEmoji: '📝',
    authorName: 'Rachel Kim',
    authorHandle: '@rkim_sat',
    authorRoleLine: 'SAT Coach',
    authorSubLine: '1590 SAT · Tutor',
    timeAgo: '2 days ago',
    views: 3200,
    category: '📝 SAT Prep',
    body:
      'My top 3 tips that helped 12 students break 750 in SAT Math this month:\n\n1) Stop memorizing formulas. Understand why they work.\n2) Practice with 30-second time pressure per question.\n3) Review wrong answers the same day. Memory decay is real.',
    likes: 412,
    comments: 88,
    earnedCoins: 260,
  },
  {
    id: 'p4',
    v: 'forYou',
    authorEmoji: '🎓',
    authorName: 'Jordan Lee',
    authorHandle: '@jordanlee_apps',
    authorRoleLine: 'Rising senior',
    authorSubLine: 'UC hopeful · First-gen',
    timeAgo: '5 hours ago',
    views: 890,
    category: '📚 Admissions',
    body:
      'Hot take: your activities list isn’t a resume dump.\n\nAdmissions readers want a story arc: what you tried, what you learned, what you’ll do next. Pick 5–7 entries max and make each one a sentence with impact.',
    likes: 214,
    comments: 42,
  },
  {
    id: 'p5',
    v: 'forYou',
    authorEmoji: '🔬',
    authorName: 'Dr. Sam Okonkwo',
    authorHandle: '@samok_research',
    authorRoleLine: 'Mentor',
    authorSubLine: 'STEM research · PhD',
    timeAgo: '6 hours ago',
    views: 1750,
    category: '🔬 Research',
    body:
      'Cold-emailing professors for research: keep it to 120 words, attach a 1-page CV, and mention ONE paper of theirs you actually read. Generic “I love your lab” emails get ignored.',
    likes: 502,
    comments: 76,
    earnedCoins: 120,
  },
  {
    id: 'p6',
    v: 'forYou',
    authorEmoji: '✈️',
    authorName: 'Aisha Rahman',
    authorHandle: '@aishar',
    authorRoleLine: 'Gap year',
    authorSubLine: 'Intl student · UK apps',
    timeAgo: '8 hours ago',
    views: 640,
    category: '🌍 International',
    body:
      'UK vs US personal statements are not interchangeable. If you’re applying to both, write two drafts: one that’s reflective (US) and one that’s course-focused (UK).',
    likes: 156,
    comments: 28,
  },
  {
    id: 'p7',
    v: 'forYou',
    authorEmoji: '🧠',
    authorName: 'Chris Park',
    authorHandle: '@chrisp_study',
    authorRoleLine: 'Pro',
    authorSubLine: 'Test anxiety · Coach',
    timeAgo: '10 hours ago',
    views: 420,
    category: '🧘 Wellness',
    body:
      'Before a full-length practice test: sleep > cram. One extra hour of sleep is worth more than one extra hour of drills the night before.',
    likes: 98,
    comments: 15,
  },
  {
    id: 'p8',
    v: 'following',
    authorEmoji: '📖',
    authorName: 'Elena Voss',
    authorHandle: '@elenav',
    authorRoleLine: 'Mentor',
    authorSubLine: 'Essays · Liberal arts',
    timeAgo: '3 hours ago',
    views: 980,
    category: '✍️ Essays',
    body:
      'When you rewrite your “why this college” essay, search for the word “prestigious” and delete it. Replace with one concrete detail about a course, professor, or program.',
    likes: 331,
    comments: 54,
  },
  {
    id: 'p9',
    v: 'trending',
    authorEmoji: '🚀',
    authorName: 'Taylor Brooks',
    authorHandle: '@tbrooks',
    authorRoleLine: 'Student',
    authorSubLine: 'Startup intern',
    timeAgo: '1 day ago',
    views: 8900,
    category: '💼 Career',
    body:
      'Internship apps: lead with a problem you solved with numbers, not with “hard-working team player.” One metric beats five adjectives.',
    likes: 1201,
    comments: 203,
    earnedCoins: 410,
  },
];

function formatCompactNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${n}`;
}

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCommunityEnrolled, unlockPremiumJourney } = useJourneyExperience();
  const profile = useTypedSelector((s) => s.auth.profile);
  const researchPrepLive = useMemo(
    () =>
      canUseResearchPrepLive(
        profile?.email,
        profile?.managementRole as string | undefined,
      ),
    [profile?.email, profile?.managementRole],
  );
  const satPrepLive = useMemo(
    () => canUseSatPrep(profile?.managementRole as string | undefined),
    [profile?.managementRole],
  );
  // My Rewards editorial UI is gated to SuperAdmin/Owner during the
  // internal preview (see MY_REWARDS_SHOW_ALL). Everyone else sees the
  // "Coming soon" placeholder so the page stops feeling broken.
  const myRewardsLive = useMemo(
    () => canUseMyRewards(profile?.managementRole as string | undefined),
    [profile?.managementRole],
  );
  const currentProfile = useMemo(() => {
    const fullName = profile?.profile?.name?.trim() || t('common.user', 'User');
    const username =
      (profile?.profile as any)?.username?.trim() ||
      `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}`;
    return {
      name: fullName,
      username: username.startsWith('@') ? username : `@${username}`,
      avatar: getLatestCreatedImg(profile?.profile?.media || []),
    };
  }, [profile?.profile, t]);

  const [activeSection, setActiveSection] = useState<CommunitySectionKey>(
    ENABLE_COMMUNITY_FEED ? 'feed' : 'myLearning',
  );
  const [othersTarget, setOthersTarget] = useState<string | null>(null);
  const [accountTarget, setAccountTarget] = useState<string | null>(null);
  const [feedPostDraft, setFeedPostDraft] = useState('');
  const [feedPosts, setFeedPosts] = useState<MockFeedPost[]>(() =>
    MOCK_FEED_POSTS.filter((p) => p.v === 'forYou'),
  );
  const [likedPostIds, setLikedPostIds] = useState<Record<string, boolean>>({});
  const [savedPostIds, setSavedPostIds] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentOpenIds, setCommentOpenIds] = useState<Record<string, boolean>>({});
  const [extraCommentCounts, setExtraCommentCounts] = useState<Record<string, number>>({});
  const [satSampleQuizChoice, setSatSampleQuizChoice] = useState<string | null>(null);
  const [admissionsVideoModal, setAdmissionsVideoModal] = useState<AdmissionsYoutubePreviewSpec | null>(null);
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
    navigate(defaultHubSectionPath, { replace: true });
  }, [location.pathname, location.search, defaultHubSectionPath, navigate]);

  /** Community mode: no Dashboard route — send to feed/my-progress default. */
  useEffect(() => {
    if (!isCommunityEnrolled) return;
    const params = new URLSearchParams(location.search);
    if (params.get('section') !== 'dashboard') return;
    navigate(defaultHubSectionPath, { replace: true });
  }, [location.search, isCommunityEnrolled, defaultHubSectionPath, navigate]);

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

  /** Mentors → full mentors directory (not embedded in hub) */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('section') !== 'mentors') return;
    navigate('/mentors', { replace: true });
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
      section === 'research-program'
    ) {
      if (section === 'my-learning') setActiveSection('myLearning');
      else if (section === 'ai-major-match') setActiveSection('aiMajorMatch');
      else if (section === 'admissions-program') setActiveSection('admissionsProgram');
      else if (section === 'sat-course') setActiveSection('satCourse');
      else if (section === 'research-program') setActiveSection('researchProgram');
      else if (section === 'messages') setActiveSection('messages');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const navItems: CommunityNavItem[] = useMemo(
    () => [
      { key: 'feed', label: 'Feed', icon: <Compass size={16} color="#fff" /> },
      { key: 'messages', label: 'Messages', icon: <MessageCircle size={16} color="#fff" /> },
      { key: 'buddies', label: 'Find Study Buddy', icon: <User size={16} color="#fff" /> },
    ],
    []
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
        case 'feed':
          return 'feed';
        case 'buddies':
          return 'study-buddies';
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

  const toggleLike = (postId: string) => {
    setLikedPostIds((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleSave = (postId: string) => {
    setSavedPostIds((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleComments = (postId: string) => {
    setCommentOpenIds((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const submitComment = (postId: string) => {
    const text = (commentDrafts[postId] ?? '').trim();
    if (!text) return;
    setFeedPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, comments: post.comments + 1 } : post)),
    );
    setExtraCommentCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }));
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    message.success('Comment posted.');
  };

  const postToCommunity = () => {
    const text = feedPostDraft.trim();
    if (!text) {
      message.warning('Write something first.');
      return;
    }
    const newPost: MockFeedPost = {
      id: `self-${Date.now()}`,
      v: 'forYou',
      authorName: currentProfile.name,
      authorHandle: currentProfile.username,
      authorRoleLine: 'You',
      authorSubLine: 'TopCoach Community',
      timeAgo: 'Just now',
      views: 0,
      category: '💬 Community',
      body: text,
      likes: 0,
      comments: 0,
      isOwnPost: true,
    };
    setFeedPosts((prev) => [newPost, ...prev]);
    setFeedPostDraft('');
    message.success(t('studentHub.hub.feedComposerPostedMock', 'Posted to Community.'));
  };

  // Research Prep takes over the page once it opens — no community sidebar,
  // no max-width clamp. The page itself supplies a top bar with breadcrumb,
  // an Overview/Module switch, and a "Back to main menu" button.
  const isResearchFullBleed =
    activeSection === 'researchProgram' && isCommunityEnrolled && researchPrepLive;
  // Admissions Program also goes full-bleed for the editorial layout —
  // a breadcrumb at the top + cream-toned cards underneath.
  const isAdmissionsFullBleed = activeSection === 'admissionsProgram' && isCommunityEnrolled;
  const isFullBleed = isResearchFullBleed || isAdmissionsFullBleed;

  return (
    <div
      className={`${styles.hubPageOuter} ${
        isFullBleed ? styles.hubPageOuterFullBleed : ''
      } ${isAdmissionsFullBleed ? styles.admissionsShellOuter : ''}`}
    >
      <div
        className={`${styles.hub} ${
          isFullBleed ? styles.hubFullBleed : styles.hubNoRight
        } ${isAdmissionsFullBleed ? styles.admissionsShellHub : ''}`}
      >
      <div
        className={`${styles.leftCol} ${!isCommunityEnrolled ? styles.leftColNoProfile : ''} ${isFullBleed ? styles.leftColHidden : ''}`}
      >
        {isCommunityEnrolled && (
          <Card
            className={styles.profileCard}
            bordered={false}
            role="button"
            tabIndex={0}
            aria-label="Open account and settings"
            onClick={() => navigate('/student-hub?section=account&target=settings')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/student-hub?section=account&target=settings');
              }
            }}
          >
            <div className={styles.profilePhoto}>
              {currentProfile.avatar ? (
                <img
                  src={currentProfile.avatar}
                  alt={currentProfile.name}
                  className={styles.profilePhotoImg}
                />
              ) : (
                <div className={styles.profilePhotoFallback} aria-hidden>
                  <User size={40} />
                </div>
              )}
            </div>
            <div className={styles.profileBody}>
              <div className={styles.profileName} title={currentProfile.name}>
                {currentProfile.name}
              </div>
              <div className={styles.profileHandle} title={currentProfile.username}>
                {currentProfile.username}
              </div>
              <div className={styles.profileFooter}>
                <span>View profile</span>
                <span className={styles.profileFooterArrow} aria-hidden>→</span>
              </div>
            </div>

            {/* Plan/coins hidden for this release */}
          </Card>
        )}

        <div className={styles.leftNav}>
          {!isCommunityEnrolled && (
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
          )}

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
            </button>
          )}

          <div className={styles.leftNavHeader}>{t('studentHub.hub.navCommunity', 'COMMUNITY')}</div>
          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'messages' ? styles.navItemActive : ''}`}
            onClick={() => {
              setActiveSection('messages');
              navigate('/student-hub?section=messages', { replace: true });
            }}
          >
            <span className={styles.navIconCircle}>
              <MessageCircle size={20} color="#8b0000" />
            </span>
            <span className={styles.navLabel}>{t('studentHub.hub.messages', 'Messages')}</span>
          </button>

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
            {!isCommunityEnrolled && <Lock size={14} className={styles.navLockIcon} />}
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() => navigate('/mentors')}
          >
            <span className={styles.navIconCircle}><UnifiedIcon name="mentors" size="md" color="primary" /></span>
            <span className={styles.navLabel}>{t('studentHub.hub.mentors', 'Mentors')}</span>
          </button>

          <div className={styles.leftNavHeader}>{t('studentHub.hub.navLearning', 'LEARNING')}</div>
          {isCommunityEnrolled && (
            <button
              type="button"
              className={`${styles.navItem} ${activeSection === 'myLearning' ? styles.navItemActive : ''}`}
              onClick={() => {
                setActiveSection('myLearning');
                navigate('/student-hub?section=my-learning', { replace: true });
              }}
            >
              <span className={styles.navIconCircle}><PlayCircle size={20} color="#8b0000" /></span>
              <span className={styles.navLabel}>{t('studentHub.hub.myProgress', 'My progress')}</span>
            </button>
          )}

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
              setActiveSection('admissionsProgram');
              navigate('/student-hub?section=admissions-program', { replace: true });
            }}
          >
            <span className={styles.navIconCircle}>
              <UnifiedIcon name="admissions" size="md" color="primary" />
            </span>
            <span className={styles.navLabel}>{t('studentHub.hub.admissions', 'Admissions')}</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'researchProgram' ? styles.navItemActive : ''}`}
            onClick={() => {
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

      <div
        className={`${styles.centerCol} ${
          activeSection === 'feed' && isCommunityEnrolled && ENABLE_COMMUNITY_FEED
            ? styles.centerColFeedMode
            : ''
        } ${activeSection === 'messages' ? styles.centerColMessengerMode : ''}`}
      >
        <div
          className={`${styles.centerBody} ${
            activeSection === 'feed' && isCommunityEnrolled && ENABLE_COMMUNITY_FEED
              ? `${styles.centerBodyFeedScroll} ${styles.centerBodyFeedLinkedin}`
              : ''
          } ${activeSection === 'messages' ? styles.centerBodyMessenger : ''}`}
        >
          <div
            key={`${activeSection}-${othersTarget ?? 'none'}-${accountTarget ?? 'none'}`}
            className={`${styles.sectionSwap} ${
              !(activeSection === 'feed' && isCommunityEnrolled && ENABLE_COMMUNITY_FEED) &&
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
                  Inbox
                  <span className={styles.editorialEyebrowSep}>·</span>
                  <span className={styles.editorialEyebrowAccent}>
                    mentors, peers, support
                  </span>
                </div>
                <h1 className={styles.editorialTitle}>Messages</h1>
                <p className={styles.editorialDesc}>
                  All your conversations in one place — chat with your mentors, study
                  buddies you've connected with, and the Top Coach team.
                </p>
              </header>
            )}
            {activeSection === 'buddies' && isCommunityEnrolled && (
              <header className={styles.editorialHeader}>
                <div className={styles.editorialEyebrow}>
                  Study buddies
                  <span className={styles.editorialEyebrowSep}>·</span>
                  <span className={styles.editorialEyebrowAccent}>match by goal</span>
                </div>
                <h1 className={styles.editorialTitle}>Find someone on the same path.</h1>
                <p className={styles.editorialDesc}>
                  Connect with peers who share your goals, prep schedules, and target schools.
                  Match scores are based on overlap in tests, timelines, and study windows.
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
                      <BookOpen size={13} /> Admissions Program
                    </span>
                    <span className={styles.admissionsCrumbSep}>›</span>
                    <span className={styles.admissionsCrumbCurrent}>Lessons catalog</span>
                  </div>
                  <button
                    type="button"
                    className={styles.admissionsBackBtn}
                    onClick={() => navigate(defaultHubSectionPath)}
                  >
                    <ArrowLeft size={13} />
                    Back to main menu
                  </button>
                </div>
                <div className={styles.admissionsHero}>
                  <div className={styles.admissionsEyebrow}>Top Coach · Admissions track</div>
                  <h1 className={styles.admissionsTitle}>
                    Get into your dream school — one lesson at a time.
                  </h1>
                  <p className={styles.admissionsSub}>
                    Continue your admissions lessons from the learning catalog. Bite-sized videos
                    from mentors at Harvard, Oxford, Yale, Babson, and beyond.
                  </p>
                </div>
              </header>
            )}
            {communityLockVariant && (
              <div className={styles.feedLockedWrap}>
                <CommunityLockedPage variant={communityLockVariant} />
              </div>
            )}

            {activeSection === 'feed' && isCommunityEnrolled && ENABLE_COMMUNITY_FEED && (
              <div className={styles.feedScrollColumn}>
                {/* LinkedIn-style “Start a post” — scrolls with feed (not sticky) */}
                <div className={styles.startPostSection}>
                  <div className={styles.startPostCard}>
                    <div className={styles.startPostTop}>
                      <Avatar
                        size={48}
                        src={currentProfile.avatar || undefined}
                        className={styles.startPostAvatar}
                      >
                        {currentProfile.name.charAt(0)}
                      </Avatar>
                      <div className={styles.startPostPillWrap}>
                        <Input
                          value={feedPostDraft}
                          onChange={(e) => setFeedPostDraft(e.target.value)}
                          placeholder={t('studentHub.hub.startPostPlaceholder', 'Start a post')}
                          className={styles.startPostPillInput}
                          size="large"
                          variant="borderless"
                        />
                      </div>
                    </div>
                    <div className={styles.startPostToolbarOneRow}>
                      <div className={styles.startPostIconRow}>
                        <button
                          type="button"
                          className={styles.startPostIconBtn}
                          onClick={() => message.info(t('studentHub.hub.feedComposerTextMock', 'Text post options are coming soon.'))}
                        >
                          <Type size={22} className={styles.startPostIconText} strokeWidth={2} />
                          <span>{t('studentHub.hub.feedComposerAa', 'Aa')}</span>
                        </button>
                        <button
                          type="button"
                          className={styles.startPostIconBtn}
                          onClick={() => message.info(t('studentHub.hub.feedComposerPhotoMock', 'Photo upload is coming soon.'))}
                        >
                          <Camera size={22} className={styles.startPostIconPhoto} strokeWidth={2} />
                          <span>{t('studentHub.hub.feedComposerPhoto', 'Photo')}</span>
                        </button>
                        <button
                          type="button"
                          className={styles.startPostIconBtn}
                          onClick={() => message.info(t('studentHub.hub.feedComposerFileMock', 'File attachment is coming soon.'))}
                        >
                          <Paperclip size={22} className={styles.startPostIconFile} strokeWidth={2} />
                          <span>{t('studentHub.hub.feedComposerFile', 'File')}</span>
                        </button>
                        <button
                          type="button"
                          className={styles.startPostIconBtn}
                          onClick={() => message.info(t('studentHub.hub.feedComposerPollMock', 'Polls are coming soon.'))}
                        >
                          <BarChart3 size={22} className={styles.startPostIconPoll} strokeWidth={2} />
                          <span>{t('studentHub.hub.feedComposerPoll', 'Poll')}</span>
                        </button>
                      </div>
                      <div className={styles.startPostToolbarRight}>
                        <div className={styles.startPostCoinsHint}>
                          <Coins size={16} strokeWidth={2} />
                          <span>{t('studentHub.hub.feedComposerCoinsHint', '+10 coins per post')}</span>
                        </div>
                        <Button type="primary" className={styles.startPostCtaBtn} onClick={postToCommunity}>
                          {t('studentHub.hub.feedComposerPostCta', 'Post to Community')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.feedPostsSection}>
                  <div className={styles.feedList}>
                  {feedPosts.map((p) => {
                    const liked = !!likedPostIds[p.id];
                    const saved = !!savedPostIds[p.id];
                    const likeCount = p.likes + (liked ? 1 : 0);
                    return (
                      <div key={p.id} className={styles.postMock}>
                        {p.pinned && (
                          <div className={styles.postPinnedRow}>
                            <span className={styles.postPinnedEmoji}>📌</span> Pinned by {p.pinnedBy}
                          </div>
                        )}

                        <div className={styles.postHeader}>
                          <Avatar size={36} className={styles.postAvatar}>
                            {p.authorEmoji ?? <User size={16} />}
                          </Avatar>

                          <div className={styles.postHeaderMain}>
                            <div className={styles.postAuthorLine}>
                              <div className={styles.postAuthorName}>{p.authorName}</div>
                              <div className={styles.postAuthorRole}>{p.authorRoleLine}</div>
                            </div>
                            <div className={styles.postSubLine}>{p.authorSubLine}</div>
                          </div>

                          <div className={styles.postHeaderRight}>
                            <button type="button" className={styles.postMoreBtn} aria-label="More actions">
                              <MoreHorizontal size={18} />
                            </button>
                          </div>
                        </div>

                        <div className={styles.postCategory}>{p.category}</div>

                        <div className={styles.postBody}>{p.body}</div>

                        {p.studyBuddyRequest && (
                          <div className={styles.studyBuddyBox}>
                            <div className={styles.studyBuddyHeading}>{p.studyBuddyRequest.heading}</div>
                            <div className={styles.studyBuddyTracks}>
                              {p.studyBuddyRequest.tracks.map((t) => (
                                <Tag key={t} color="magenta" className={styles.studyBuddyTag}>
                                  {t}
                                </Tag>
                              ))}
                            </div>
                            <Button
                              type="primary"
                              className={styles.studyBuddyCta}
                              onClick={() => message.info('Group joining is coming soon.')}
                            >
                              {p.studyBuddyRequest.cta}
                            </Button>
                          </div>
                        )}

                        <div className={styles.postActions}>
                          <button
                            type="button"
                            className={`${styles.postActionBtn} ${liked ? styles.postActionBtnActive : ''}`}
                            onClick={() => toggleLike(p.id)}
                          >
                            <Heart size={15} />
                            <span>{likeCount}</span>
                          </button>
                          <button
                            type="button"
                            className={`${styles.postActionBtn} ${commentOpenIds[p.id] ? styles.postActionBtnActive : ''}`}
                            onClick={() => toggleComments(p.id)}
                          >
                            <MessageSquare size={15} />
                            <span>{p.comments + (extraCommentCounts[p.id] ?? 0)} Comments</span>
                          </button>
                          <button
                            type="button"
                            className={`${styles.postActionBtn} ${saved ? styles.postActionBtnActive : ''}`}
                            onClick={() => toggleSave(p.id)}
                          >
                            <Bookmark size={15} />
                            <span>{saved ? 'Saved' : 'Save'}</span>
                          </button>
                          <button
                            type="button"
                            className={styles.postActionBtn}
                            onClick={() => message.success('Post shared.')}
                          >
                            <Share2 size={15} />
                            <span>Share</span>
                          </button>
                        </div>
                        {commentOpenIds[p.id] && (
                          <div className={styles.postCommentsWrap}>
                            {(MOCK_COMMENTS_BY_POST[p.id] ?? []).map((c) => (
                              <div key={c.id} className={styles.postCommentItem}>
                                <div className={styles.postCommentTop}>
                                  <span className={styles.postCommentAuthor}>{c.author}</span>
                                  <span className={styles.postCommentHandle}>{c.handle}</span>
                                  <span className={styles.postCommentDot}>·</span>
                                  <span className={styles.postCommentTime}>{c.timeAgo}</span>
                                </div>
                                <div className={styles.postCommentText}>{c.text}</div>
                                {!!c.likes && <div className={styles.postCommentLikes}>❤ {c.likes}</div>}
                              </div>
                            ))}
                            <div className={styles.postCommentComposer}>
                              <Input
                                size="middle"
                                value={commentDrafts[p.id] ?? ''}
                                onChange={(e) =>
                                  setCommentDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))
                                }
                                placeholder="Write a comment..."
                                onPressEnter={() => submitComment(p.id)}
                              />
                              <Button size="middle" onClick={() => submitComment(p.id)}>
                                Comment
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className={styles.postFooterMeta}>
                          {typeof p.earnedCoins === 'number' && p.earnedCoins > 0 && (
                            <span className={styles.postEarnedChip}>🪙 +{p.earnedCoins} coins</span>
                          )}
                          👁 {formatCompactNumber(p.views)} views · {p.timeAgo}
                          {p.isOwnPost ? ' · You posted this' : ''}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              </div>
          )}

          {activeSection === 'more' && (
            <Card className={styles.sectionCard} bordered={false}>
              <div className={styles.sectionSubHeader}>Browse</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                {[
                  {
                    key: 'buddies' as const,
                    label: 'Find Study Buddy',
                    icon: <UserPlus size={18} color="#8b0000" />,
                    count: MOCK_COUNTS.buddies,
                    preview: 'Accountability: SAT Math 3x/week',
                    accent: '#b91c1c',
                  },
                  {
                    key: 'mentors' as const,
                    label: 'Mentors',
                    icon: <GraduationCap size={18} color="#8b0000" />,
                    count: MOCK_COUNTS.mentors,
                    preview: 'Admissions + Research',
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
                        Open
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
                  {othersTarget === 'college-lists' && (
                    <div className={styles.hubDashEmbed}>
                      <ApplicationsPage />
                    </div>
                  )}
                  {othersTarget === 'major-match' && (
                    <div className={styles.hubDashEmbed}>
                      <PsychometricAssessmentPage />
                    </div>
                  )}
                  {othersTarget === 'opportunities' && <OpportunitiesPage />}
                  {othersTarget === 'essays' && <EssaysPage />}
                  {othersTarget === 'documents' && <DocumentsPage />}
                  {othersTarget === 'profile' && <ProfilePage />}
                </div>
              ) : (
                <Card className={styles.sectionCard} bordered={false}>
                  <div className={styles.sectionSubHeader}>Your Journey shortcuts</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                    {[
                      { label: 'Full Support', route: '/student-hub?section=others&target=full-support', icon: 'full-support' },
                      { label: 'College Lists', route: '/student-hub?section=others&target=college-lists', icon: 'applications' },
                      { label: 'Major Match', route: '/student-hub?section=others&target=major-match', icon: 'major-match' },
                      { label: 'Opportunities', route: '/student-hub?section=others&target=opportunities', icon: 'opportunities' },
                      { label: 'Essays', route: '/student-hub?section=others&target=essays', icon: 'essays' },
                      { label: 'Documents', route: '/student-hub?section=others&target=documents', icon: 'documents' },
                      { label: 'My Profile', route: '/student-hub?section=others&target=profile', icon: 'profile' },
                    ].map((item) => (
                      <div key={item.route} className={styles.groupCard} style={{ padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span className={styles.navIconCircle}><UnifiedIcon name={item.icon as any} size="md" color="primary" /></span>
                            <div style={{ fontWeight: 900, color: '#0f172a' }}>{item.label}</div>
                          </div>
                          <Button type="primary" onClick={() => navigate(item.route)}>
                            Open
                          </Button>
                        </div>
                        <div style={{ color: '#64748b', fontWeight: 700, fontSize: 12, marginTop: 8 }}>
                          Integrated open (real page).
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
                <div className={styles.settingsSectionOffset}>
                  <MenteeSettingsPageMock embeddedInHub />
                </div>
              )}
              {accountTarget !== 'rewards' && accountTarget !== 'settings' && (
                <Card className={styles.sectionCard} bordered={false}>
                  <div className={styles.sectionSubHeader}>My Rewards</div>
                  <div style={{ color: '#64748b', fontWeight: 700 }}>
                    Select “My Rewards” or “Settings” in the sidebar.
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

          {activeSection === 'messages' && (
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

            {activeSection === 'buddies' && isCommunityEnrolled && (
              <StudyBuddyHubSection
                onOpenChat={(conversationId) => {
                  setMessagesConversationId(conversationId);
                  setActiveSection('messages');
                  navigate('/student-hub?section=messages', { replace: true });
                }}
              />
            )}

            {activeSection === 'aiMajorMatch' && (
              <div className={styles.hubDashEmbed}>
                <Tabs
                  key={new URLSearchParams(location.search).get('applicationFlow') === 'new' ? 'ai-open-colleges' : 'ai-tabs'}
                  defaultActiveKey={
                    new URLSearchParams(location.search).get('applicationFlow') === 'new' ? 'colleges' : 'major'
                  }
                  className={styles.aiMajorMatchTabs}
                  items={[
                    {
                      key: 'major',
                      label: t('studentHub.hub.tabMajorMatch', 'Major match'),
                      children: (
                        <div className={styles.embedTabPanel}>
                          <PsychometricAssessmentPage />
                        </div>
                      ),
                    },
                    {
                      key: 'colleges',
                      label: t('studentHub.hub.tabCollegeLists', 'College lists'),
                      children: (
                        <div className={styles.embedTabPanel}>
                          <ApplicationsPage />
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}

            {activeSection === 'admissionsProgram' && (
              <div className={styles.admissionsBody}>
                <div className={styles.admissionsListHeader}>
                  <div>
                    <h2 className={styles.admissionsListTitle}>Featured lessons</h2>
                    <div className={styles.admissionsListMeta}>
                      {ADMISSIONS_YOUTUBE_PREVIEW_SPECS.length} videos · ~{
                        ADMISSIONS_YOUTUBE_PREVIEW_SPECS.reduce((n, s) => {
                          const [m, sec] = s.duration.split(':').map(Number);
                          return n + (m || 0) + (sec || 0) / 60;
                        }, 0).toFixed(0)
                      } min total
                    </div>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    className={styles.programShortcutCta}
                    onClick={() => navigate('/learning?course=admissions')}
                  >
                    {t('studentHub.hub.goToAdmissionsLessons', 'Go to admissions lessons')}
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

            {activeSection === 'satCourse' && null}

            {activeSection === 'researchProgram' && isCommunityEnrolled && null}
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}

