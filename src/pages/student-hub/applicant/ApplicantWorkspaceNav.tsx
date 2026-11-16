import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Skeleton } from 'antd';
import { universityApi } from 'src/app/services/universities';
import {
  BookOpen,
  Calendar,
  Check,
  Circle,
  ClipboardList,
  Compass,
  CreditCard,
  FileText,
  FlaskConical,
  GraduationCap,
  Headphones,
  Heart,
  House,
  Layers,
  LayoutDashboard,
  List,
  ListChecks,
  Lock,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  PenLine,
  Rss,
  Search,
  Shield,
  Sparkle,
  Star,
  Target,
  Trophy,
  User,
  UserCheck,
  UserPlus,
  Users,
  Bell,
  Signpost,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { useGetMyMentoringProgramsQuery } from 'src/app/services/studentProgramsApi';
import { ACCOUNT_SETTINGS_PATH, MEMBERSHIP_BILLING_PATH } from 'src/lib/accountNavigation';
import { applicantLinks, isOverviewLocation } from 'src/lib/applicantWorkspace';
import { useJourneyExperience } from 'src/contexts/JourneyExperienceContext';
import { programNavigation } from '../my-programs/programModel';
import OrgMembershipSidebar from '../components/OrgMembershipSidebar';
import { applicantDegree, displayName } from './applicantOverviewModel';
import { useApplicantOverview } from './ApplicantOverviewContext';
import './applicantNavigation.scss';

type IconComponent = LucideIcon;

type NavLinkItem = {
  key: string;
  label: string;
  to: string;
  Icon: IconComponent;
  active: boolean;
  locked?: boolean;
  meta?: ReactNode;
};
type NavGroup = { key: string; label: string; links: NavLinkItem[] };
export type NavSection = {
  key: string;
  label: string;
  railLabel: string;
  /** Shorter label for the phone tab bar. */
  phoneLabel?: string;
  subtitle: string;
  RailIcon: IconComponent;
  to: string;
  groups: NavGroup[];
  bottom?: boolean;
  /** Left out of the phone tab bar; reachable from the header menu or the Home page. */
  phoneHidden?: boolean;
  /** Pages in this area use the full width (no section panel). */
  hidePanel?: boolean;
};

function useNavSections() {
  const { currentData: data } = useApplicantOverview();
  const { isCommunityEnrolled, isEntitlementLoading } = useJourneyExperience();
  const communityLocked = !isEntitlementLoading && !isCommunityEnrolled;
  const programs = useGetMyMentoringProgramsQuery(undefined, {
    pollingInterval: 30000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const programNav = programNavigation(programs.currentData?.data.programs ?? []);
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  const current = new URLSearchParams(search);
  const degree = applicantDegree(data?.profile?.targetDegree);

  const matches = (to: string, nested = false) => {
    const [path, query] = to.split('?');
    if (pathname !== path) return nested && pathname.startsWith(`${path}/`);
    return Array.from(new URLSearchParams(query)).every(([key, value]) => current.get(key) === value);
  };
  const settingsTab = current.get('target') === 'settings' ? current.get('tab') ?? 'profile' : null;
  const profileTab = current.get('section') === 'others' && current.get('target') === 'profile'
    ? current.get('tab') ?? 'academic'
    : null;
  const taskSource = current.get('source') ?? (current.get('mentorTask') ? 'assigned' : 'all');
  const taskStatus = current.get('status') ?? 'open';
  const onTasks = pathname === applicantLinks.tasks;
  const locked = (on: boolean) => on && communityLocked;
  const count = (value: number | undefined, accent = false) =>
    value ? <span className={`applicant-section-panel-meta${accent ? ' is-accent' : ''}`}>{value}</span> : undefined;
  const applications = data?.applications.state === 'ready' ? data.applications.data.total : undefined;
  const completion = data?.profile?.completionPercentage;
  const notificationsPath = '/student-hub?section=account&target=settings&tab=notifications';

  const applicationLinks: NavLinkItem[] = degree === 'master'
    ? [
        { key: 'exploreDirection', label: t('applicant.exploreDirection'), to: applicantLinks.studyDirection, Icon: Signpost, active: matches(applicantLinks.studyDirection, true) },
        { key: 'explorePrograms', label: t('applicant.explorePrograms'), to: applicantLinks.universities, Icon: Search, active: matches(applicantLinks.universities, true) },
        { key: 'shortlist', label: t('applicant.shortlist'), to: applicantLinks.applications, Icon: List, active: matches(applicantLinks.applications, true), meta: count(applications, matches(applicantLinks.applications, true)) },
        { key: 'essays', label: t('applicant.essays'), to: applicantLinks.essays, Icon: PenLine, active: matches(applicantLinks.essays, true) },
        { key: 'documents', label: t('applicant.documents'), to: applicantLinks.documents, Icon: FileText, active: matches(applicantLinks.documents, true) },
      ]
    : [
        { key: 'majorMatch', label: t('applicant.majorMatch'), to: applicantLinks.majorMatch, Icon: Sparkle, active: matches(applicantLinks.majorMatch, true) },
        { key: 'findUniversities', label: t('applicant.findUniversities'), to: applicantLinks.universities, Icon: Search, active: matches(applicantLinks.universities, true) },
        { key: 'collegeList', label: t('applicant.collegeList'), to: applicantLinks.applications, Icon: List, active: matches(applicantLinks.applications, true), meta: count(applications, matches(applicantLinks.applications, true)) },
        { key: 'essays', label: t('applicant.essays'), to: applicantLinks.essays, Icon: PenLine, active: matches(applicantLinks.essays, true) },
        { key: 'documents', label: t('applicant.documents'), to: applicantLinks.documents, Icon: FileText, active: matches(applicantLinks.documents, true) },
      ];

  const learningLinks: NavLinkItem[] = [
    { key: 'myProgress', label: t('applicant.myLearning', 'My learning'), to: applicantLinks.learning, Icon: Target, active: matches(applicantLinks.learning) },
    { key: 'mySessions', label: t('applicant.mySessions', 'My sessions'), to: applicantLinks.sessions, Icon: Calendar, active: matches(applicantLinks.sessions, true) },
    { key: 'admissions', label: t('applicant.admissions'), to: applicantLinks.admissions, Icon: GraduationCap, active: matches(applicantLinks.admissions), locked: locked(true) },
    { key: 'researchPrep', label: t('applicant.researchPrepShort'), to: '/student-hub/research-prep', Icon: FlaskConical, active: matches('/student-hub/research-prep', true) || current.get('section') === 'research-program', locked: locked(true) },
    ...(degree === 'master'
      ? []
      : [{ key: 'satTestPrep', label: t('applicant.satTestPrep'), to: applicantLinks.satPrep, Icon: Target, active: matches(applicantLinks.satPrep, true) || current.get('section') === 'sat-course', locked: locked(true) }]),
    { key: 'ieltsTestPrep', label: t('applicant.ieltsTestPrep'), to: '/student-hub/ielts-prep', Icon: Headphones, active: matches('/student-hub/ielts-prep', true) },
  ];

  const fullSupportActive = pathname === '/student-hub/full-support' || current.get('target') === 'full-support';
  const programsActive = pathname === '/student-hub/my-programs';

  const sections: NavSection[] = [
    {
      key: 'overview',
      hidePanel: true,
      phoneLabel: t('applicant.nav.home', 'Home'),
      label: t('applicant.overview'),
      railLabel: t('applicant.overview'),
      subtitle: degree === 'master'
        ? t('applicant.nav.masterWorkspace', 'Master’s workspace')
        : t('applicant.nav.bachelorWorkspace', 'Bachelor’s workspace'),
      RailIcon: House,
      to: applicantLinks.overview,
      groups: [{
        key: 'overview',
        label: t('applicant.overview'),
        links: [
          { key: 'dashboard', label: t('applicant.nav.dashboard', 'Dashboard'), to: applicantLinks.overview, Icon: LayoutDashboard, active: isOverviewLocation(pathname, search) },
          { key: 'studyProfile', label: t('applicant.nav.studyProfile', 'Study profile'), to: applicantLinks.profile, Icon: User, active: false, meta: completion !== undefined ? <span className="applicant-section-panel-meta">{completion}%</span> : undefined },
          { key: 'notifications', label: t('applicant.nav.notifications', 'Notifications'), to: notificationsPath, Icon: Bell, active: false },
        ],
      }],
    },
    {
      key: 'application',
      phoneLabel: t('applicant.nav.apply', 'Apply'),
      label: t('applicant.nav.application', 'Application'),
      railLabel: t('applicant.nav.application', 'Application'),
      subtitle: applications !== undefined
        ? t('applicant.nav.savedUniversities', { count: applications, defaultValue_one: '{{count}} saved university', defaultValue_other: '{{count}} saved universities', defaultValue: '{{count}} saved universities' })
        : t('applicant.nav.applicationSubtitle', 'Universities and applications'),
      RailIcon: ClipboardList,
      to: applicationLinks[0].to,
      groups: [{ key: 'application', label: t('applicant.nav.application', 'Application'), links: applicationLinks }],
    },
    {
      key: 'learning',
      phoneLabel: t('applicant.nav.learning', 'Learning'),
      label: t('applicant.myLearning'),
      railLabel: t('applicant.myLearning'),
      subtitle: t('applicant.nav.learningSubtitle', 'Courses and test prep'),
      RailIcon: GraduationCap,
      to: learningLinks[0].to,
      groups: [{ key: 'learning', label: t('applicant.myLearning'), links: learningLinks }],
    },
    {
      key: 'tasks',
      hidePanel: true,
      label: t('applicant.tasks', 'Tasks'),
      railLabel: t('applicant.tasks', 'Tasks'),
      subtitle: t('applicant.nav.tasksSubtitle', 'Assigned and personal'),
      RailIcon: ListChecks,
      to: applicantLinks.tasks,
      groups: [
        {
          key: 'tasks',
          label: t('applicant.tasks', 'Tasks'),
          links: [
            { key: 'all', label: t('applicant.nav.allTasks', 'All'), to: `${applicantLinks.tasks}?source=all`, Icon: ListChecks, active: onTasks && taskSource === 'all' },
            { key: 'assigned', label: t('applicant.nav.assignedTasks', 'Assigned to you'), to: `${applicantLinks.tasks}?source=assigned`, Icon: UserCheck, active: onTasks && taskSource === 'assigned' },
            { key: 'personal', label: t('applicant.nav.personalTasks', 'Personal'), to: `${applicantLinks.tasks}?source=personal`, Icon: User, active: onTasks && taskSource === 'personal' },
          ],
        },
        {
          key: 'status',
          label: t('applicant.nav.status', 'Status'),
          links: [
            { key: 'open', label: t('applicant.nav.openTasks', 'Open'), to: `${applicantLinks.tasks}?source=${taskSource}&status=open`, Icon: Circle, active: false },
            { key: 'completed', label: t('applicant.nav.completedTasks', 'Completed'), to: `${applicantLinks.tasks}?source=${taskSource}&status=completed`, Icon: Check, active: onTasks && taskStatus === 'completed' },
          ],
        },
      ],
    },
    {
      key: 'fullSupport',
      phoneHidden: true,
      label: t('applicant.nav.fullSupport', 'Full Support'),
      railLabel: t('applicant.nav.fullSupport', 'Full Support'),
      subtitle: t('applicant.nav.fullSupportSubtitle', '1:1 mentorship program'),
      RailIcon: Heart,
      to: applicantLinks.fullSupport,
      groups: [{
        key: 'fullSupport',
        label: t('applicant.nav.fullSupport', 'Full Support'),
        links: [
          { key: 'fsOverview', label: t('applicant.overview'), to: applicantLinks.fullSupport, Icon: Compass, active: fullSupportActive },
          { key: 'programs', label: programNav.label, to: programNav.url, Icon: Layers, active: programsActive },
        ],
      }],
    },
    {
      key: 'community',
      label: t('applicant.community'),
      railLabel: t('applicant.community'),
      subtitle: communityLocked
        ? t('applicant.nav.communityLocked', 'Free access · read only')
        : t('applicant.nav.communityMember', 'Community member'),
      RailIcon: Users,
      to: applicantLinks.feed,
      groups: [{
        key: 'community',
        label: t('applicant.community'),
        links: [
          { key: 'feed', label: t('applicant.feed'), to: applicantLinks.feed, Icon: Rss, active: matches(applicantLinks.feed), locked: locked(true) },
          { key: 'buddies', label: t('applicant.buddies'), to: applicantLinks.buddies, Icon: UserPlus, active: matches(applicantLinks.buddies), locked: locked(true) },
          { key: 'messages', label: t('applicant.messages'), to: applicantLinks.messages, Icon: MessageCircle, active: matches(applicantLinks.messages), locked: locked(true) },
        ],
      }],
    },
    {
      key: 'billing',
      hidePanel: true,
      bottom: true,
      phoneHidden: true,
      label: t('accountNav.membership', 'Membership & billing'),
      railLabel: t('applicant.nav.billing', 'Billing'),
      subtitle: t('applicant.nav.billingSubtitle', 'Plan and payments'),
      RailIcon: CreditCard,
      to: MEMBERSHIP_BILLING_PATH,
      groups: [{
        key: 'billing',
        label: t('applicant.nav.billing', 'Billing'),
        links: [
          { key: 'plan', label: t('applicant.nav.plan', 'Plan'), to: MEMBERSHIP_BILLING_PATH, Icon: Star, active: settingsTab === 'subscription' },
        ],
      }],
    },
    {
      key: 'settings',
      bottom: true,
      phoneHidden: true,
      label: t('accountNav.settings', 'Account settings'),
      railLabel: t('applicant.nav.settings', 'Settings'),
      subtitle: t('applicant.nav.settingsSubtitle', 'Profile and preferences'),
      RailIcon: Settings,
      to: applicantLinks.personal,
      groups: [
        {
          key: 'studentProfile',
          label: t('applicant.nav.studentProfile', 'My student profile'),
          links: [
            { key: 'personal', label: t('applicant.nav.personalProfile', 'Personal profile'), to: applicantLinks.personal, Icon: User, active: profileTab === 'personal' },
            { key: 'academic', label: t('applicant.nav.academicProfile', 'Academic profile'), to: applicantLinks.profile, Icon: BookOpen, active: profileTab === 'academic' },
            { key: 'activities', label: t('applicant.nav.activities', 'Activities & achievements'), to: '/student-hub?section=others&target=profile&tab=activities', Icon: Trophy, active: profileTab === 'activities' },
          ],
        },
        {
          key: 'account',
          label: t('accountNav.account', 'Account'),
          links: [
            { key: 'accountSettings', label: t('accountNav.settings', 'Account settings'), to: ACCOUNT_SETTINGS_PATH, Icon: Shield, active: settingsTab === 'profile' },
            { key: 'notifications', label: t('applicant.nav.notifications', 'Notifications'), to: notificationsPath, Icon: Bell, active: settingsTab === 'notifications' },
          ],
        },
      ],
    },
  ];

  const hubSection = current.get('section');
  const hubTarget = current.get('target');
  const sectionFromParams: Record<string, string> = {
    'research-program': 'learning',
    'sat-course': 'learning',
    'my-learning': 'learning',
    'admissions-program': 'learning',
    'ai-major-match': 'application',
    feed: 'community',
    buddies: 'community',
    messages: 'community',
    mentors: 'community',
  };
  const sectionActive = (section: NavSection) => {
    if (hubSection && sectionFromParams[hubSection]) return sectionFromParams[hubSection] === section.key;
    if (hubSection === 'others' && hubTarget === 'programs') return section.key === 'fullSupport';
    if (hubSection === 'account' && hubTarget === 'rewards') return section.key === 'settings';
    if (section.key === 'tasks') return onTasks;
    if (section.key === 'settings') return Boolean(profileTab) || (settingsTab !== null && settingsTab !== 'subscription');
    if (section.key === 'billing') return settingsTab === 'subscription';
    return section.groups.some((group) => group.links.some((link) => link.active));
  };
  const active = sections.find(sectionActive) ?? sections[0];
  return { sections, active };
}

// Start loading the university catalogue as soon as the pointer or keyboard reaches the link,
// so the page often opens with data already cached.
function useCataloguePrefetch(link: NavLinkItem) {
  const prefetchCatalogue = universityApi.usePrefetch('getReviewedUniversities');
  const prefetchFilters = universityApi.usePrefetch('getUniversityFilters');
  const enabled = link.key === 'findUniversities';
  return enabled ? () => { prefetchCatalogue({}); prefetchFilters(); } : undefined;
}

function PanelLink({ link, onNavigate }: { link: NavLinkItem; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const prefetch = useCataloguePrefetch(link);
  return (
    <Link
      to={link.to}
      onClick={onNavigate}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      aria-current={link.active ? 'page' : undefined}
      className={`applicant-section-panel-link${link.active ? ' is-active' : ''}`}
    >
      <link.Icon size={18} strokeWidth={1.75} aria-hidden />
      <span className="applicant-section-panel-link__label">{link.label}</span>
      {link.locked ? (
        <span className="applicant-section-panel-meta">
          <Lock size={11} strokeWidth={2} aria-hidden />
          {t('applicant.nav.locked', 'Locked')}
        </span>
      ) : (
        link.meta
      )}
    </Link>
  );
}

function ProfileCard({ onNavigate }: { onNavigate?: () => void }) {
  const { currentData: data, isLoading, isError } = useApplicantOverview();
  const authName = useTypedSelector((state) => state.auth.profile?.profile?.name);
  const { t } = useTranslation();
  const degree = applicantDegree(data?.profile?.targetDegree);
  const name = displayName(data?.profile?.name) || displayName(authName) || t('applicant.yourWorkspace');
  const intake = data?.profile?.intakeYear
    ? [
        data.profile.intakeTerm && t(`applicant.term.${data.profile.intakeTerm}`, data.profile.intakeTerm),
        data.profile.intakeYear,
      ].filter(Boolean).join(' ')
    : t('applicant.intakeNotSet');
  return (
    <Link to={applicantLinks.profile} onClick={onNavigate} className="applicant-section-panel-profile">
      <span className="applicant-section-panel-profile__avatar" aria-hidden>
        {name.trim().charAt(0).toUpperCase() || <User size={18} />}
      </span>
      <span className="applicant-section-panel-profile__text">
        <strong>{name}</strong>
        <span>
          {isLoading
            ? t('applicant.loadingProfile')
            : degree
              ? t(`applicant.${degree}Applicant`)
              : t('applicant.applicant')}
        </span>
        {isLoading ? (
          <Skeleton.Input active size="small" style={{ height: 12, width: 110 }} />
        ) : (
          <span>{isError ? t('applicant.profileUnavailable') : intake}</span>
        )}
      </span>
    </Link>
  );
}

function PanelGroups({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.key} className="applicant-section-panel-group">
          <p className="applicant-section-panel-group__label">{group.label}</p>
          {group.links.map((link) => (
            <PanelLink key={link.key} link={link} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </>
  );
}

/** Primary icon rail: one entry per workspace area. */
export function ApplicantRail() {
  const { sections, active } = useNavSections();
  const { t } = useTranslation();
  const railRef = useRef<HTMLElement>(null);
  const [lens, setLens] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [lensReady, setLensReady] = useState(false);

  // The glass lens glides to the active item (and follows layout changes).
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const measure = () => {
      const target = rail.querySelector<HTMLElement>('.applicant-rail__item.is-active');
      if (!target || target.offsetWidth === 0) {
        setLens(null);
        return;
      }
      setLens({ x: target.offsetLeft, y: target.offsetTop, w: target.offsetWidth, h: target.offsetHeight });
    };
    measure();
    // Place the lens instantly on first paint; animate only later moves.
    const frame = requestAnimationFrame(() => setLensReady(true));
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [active.key]);

  const item = (section: NavSection) => {
    const isActive = section.key === active.key;
    return (
      <Link
        key={section.key}
        to={section.to}
        aria-label={section.railLabel}
        aria-current={isActive ? 'page' : undefined}
        className={`applicant-rail__item${isActive ? ' is-active' : ''}${section.phoneHidden ? ' is-phone-hidden' : ''}`}
      >
        <section.RailIcon size={22} strokeWidth={1.75} aria-hidden />
        <span className={section.phoneLabel ? 'applicant-rail__label--wide' : undefined}>{section.railLabel}</span>
        {section.phoneLabel && (
          <span className="applicant-rail__label--phone" aria-hidden>{section.phoneLabel}</span>
        )}
      </Link>
    );
  };
  return (
    <nav ref={railRef} className="applicant-rail" aria-label={t('applicant.workspaceNavigation')}>
      <span
        className={`applicant-rail__lens${lensReady ? ' is-ready' : ''}`}
        aria-hidden
        style={
          lens
            ? { width: lens.w, height: lens.h, transform: `translate3d(${lens.x}px, ${lens.y}px, 0)` }
            : { opacity: 0 }
        }
      />
      <div className="applicant-rail__items">{sections.filter((s) => !s.bottom).map(item)}</div>
      <div className="applicant-rail__items applicant-rail__items--bottom">
        {sections.filter((s) => s.bottom).map(item)}
      </div>
    </nav>
  );
}

/** Secondary panel: the links of the active rail area, with an edge handle to fold it away. */
export function ApplicantPanel({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { active } = useNavSections();
  const { t } = useTranslation();
  if (active.hidePanel) return null;
  const ToggleIcon = collapsed ? ChevronRight : ChevronLeft;
  return (
    <div className={`applicant-panel-slot${collapsed ? ' is-collapsed' : ''}`}>
      <aside
        id="applicant-section-panel"
        className="applicant-section-panel"
        aria-label={active.label}
        hidden={collapsed}
      >
        <div className="applicant-section-panel__header">
          <h2>{active.label}</h2>
          <p>{active.subtitle}</p>
        </div>
        <ProfileCard />
        <PanelGroups groups={active.groups} />
        <OrgMembershipSidebar />
      </aside>
      <button
        type="button"
        className="applicant-panel-toggle"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls="applicant-section-panel"
        aria-label={collapsed ? t('applicant.nav.expand', 'Show menu') : t('applicant.nav.collapse', 'Hide menu')}
      >
        <ToggleIcon size={16} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

/**
 * Below 1200px the section panel is hidden, so the active area's links show as a
 * compact horizontally scrollable chip row at the top of the content.
 */
export function ApplicantSectionTabs() {
  const { active } = useNavSections();
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);
  const seen = new Set<string>();
  const links = active.hidePanel
    ? []
    : active.groups
        .flatMap((group) => group.links)
        .filter((link) => (seen.has(link.to) ? false : (seen.add(link.to), true)));
  const activeKey = links.find((link) => link.active)?.key;

  useEffect(() => {
    const target = listRef.current?.querySelector<HTMLElement>('.is-active');
    target?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [active.key, activeKey]);

  if (links.length < 2) return null;
  return (
    <nav className="applicant-section-tabs" aria-label={active.label}>
      <div className="applicant-section-tabs__list" ref={listRef}>
        {links.map((link) => (
          <Link
            key={link.key}
            to={link.to}
            aria-current={link.active ? 'page' : undefined}
            className={`applicant-section-tabs__link${link.active ? ' is-active' : ''}`}
          >
            <link.Icon size={15} strokeWidth={1.75} aria-hidden />
            <span>{link.label}</span>
            {link.locked && (
              <Lock size={11} strokeWidth={2} aria-label={t('applicant.nav.locked', 'Locked')} />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
