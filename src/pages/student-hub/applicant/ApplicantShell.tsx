import { useEffect, useState, type ReactNode } from 'react';
import { Drawer, Skeleton } from 'antd';
import {
  ChevronRight,
  CirclePlay,
  ClipboardList,
  HeartHandshake,
  House,
  Lock,
  Menu,
  User,
  UserPlus,
  CreditCard,
  Settings,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { useGetApplicantOverviewQuery } from 'src/app/services/student-hub/applicantOverviewApi';
import { ACCOUNT_SETTINGS_PATH, MEMBERSHIP_BILLING_PATH } from 'src/lib/accountNavigation';
import { applicantLinks, isOverviewLocation } from 'src/lib/applicantWorkspace';
import { applicantDegree, displayName } from './applicantOverviewModel';
import {
  ApplicantOverviewContext,
  useApplicantOverview,
} from './ApplicantOverviewContext';
import OrgMembershipSidebar from '../components/OrgMembershipSidebar';
import { useJourneyExperience } from 'src/contexts/JourneyExperienceContext';
import { useGetEnrollmentMeQuery } from 'src/app/services/fullSupportApi';
import { ApplicantTopBarContext } from './ApplicantTopBarContext';
import ProfileMembership from './ProfileMembership';
import './applicantWorkspace.scss';

export default function ApplicantShell({ children }: { children: ReactNode }) {
  const userId = useTypedSelector((state) => state.auth.profile?.id);
  const query = useGetApplicantOverviewQuery(userId ?? '', {
    skip: !userId,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });
  const { pathname, search } = useLocation();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trailTarget, setTrailTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, search]);

  return (
    <ApplicantOverviewContext.Provider value={query}>
      <ApplicantTopBarContext.Provider value={trailTarget}>
      <div className="applicant-shell">
        <a href="#applicant-content" className="applicant-skip">
          {t('applicant.skip')}
        </a>
        <div className="applicant-mobile-bar">
          <button
            type="button"
            className="applicant-menu-button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('applicant.openMenu')}
            aria-expanded={drawerOpen}
          >
            <Menu size={20} aria-hidden />
            <span>{t('applicant.myJourney')}</span>
          </button>
          <div className="applicant-mobile-bar__trail" ref={setTrailTarget} />
        </div>
        <div className="applicant-shell__grid">
          <aside className="applicant-sidebar">
            <ApplicantNavigation id="desktop" />
          </aside>
          <main
            id="applicant-content"
            tabIndex={-1}
            className="applicant-content"
          >
            {children}
          </main>
        </div>
        <Drawer
          open={drawerOpen}
          placement="left"
          width={280}
          title={t('applicant.myJourney')}
          onClose={() => setDrawerOpen(false)}
          destroyOnClose
          rootClassName="applicant-drawer"
        >
          <ApplicantNavigation
            id="mobile"
            onNavigate={() => setDrawerOpen(false)}
          />
        </Drawer>
      </div>
      </ApplicantTopBarContext.Provider>
    </ApplicantOverviewContext.Provider>
  );
}

function ApplicantNavigation({
  id,
  onNavigate,
}: {
  id: string;
  onNavigate?: () => void;
}) {
  const { currentData: data, isLoading, isError } = useApplicantOverview();
  const authName = useTypedSelector(
    (state) => state.auth.profile?.profile?.name,
  );
  const managementRole = useTypedSelector(
    (state) => state.auth.profile?.managementRole,
  );
  const { isCommunityEnrolled, isEntitlementLoading } =
    useJourneyExperience();
  const { data: fullSupportEnrollment, isLoading: fullSupportLoading } =
    useGetEnrollmentMeQuery();
  const communityLocked = !isEntitlementLoading && !isCommunityEnrolled;
  const fullSupportLocked =
    !fullSupportLoading && !fullSupportEnrollment?.data?.enrolled;
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  const current = new URLSearchParams(search);
  const degree = applicantDegree(data?.profile?.targetDegree);
  const name =
    displayName(data?.profile?.name) ||
    displayName(authName) ||
    t('applicant.yourWorkspace');
  const groups = [
    {
      key: 'applications',
      Icon: ClipboardList,
      links: degree === 'bachelor'
        ? [
            { key: 'majorMatch', to: applicantLinks.majorMatch },
            { key: 'findUniversities', to: applicantLinks.universities },
            { key: 'collegeList', to: applicantLinks.applications },
            { key: 'essays', to: applicantLinks.essays },
            { key: 'documents', to: applicantLinks.documents },
            { key: 'tasks', to: applicantLinks.tasks },
          ]
        : [
            { key: 'exploreDirection', to: applicantLinks.studyDirection },
            { key: 'explorePrograms', to: applicantLinks.universities },
            { key: 'shortlist', to: applicantLinks.applications },
            { key: 'essays', to: applicantLinks.essays },
            { key: 'documents', to: applicantLinks.documents },
            { key: 'tasks', to: applicantLinks.tasks },
          ],
    },
    {
      key: 'myLearning',
      Icon: CirclePlay,
      links: degree === 'bachelor'
        ? [
            { key: 'ieltsTestPrep', to: '/student-hub/ielts-prep', locked: false },
            {
              key: 'admissions',
              to: applicantLinks.admissions,
              locked: communityLocked,
            },
            {
              key: 'satTestPrep',
              to: applicantLinks.satPrep,
              locked: communityLocked,
            },
            {
              key: 'researchPrep',
              to: '/student-hub/research-prep',
              locked: communityLocked,
            },
          ]
        : [
            { key: 'myProgress', to: applicantLinks.learning, locked: false },
            { key: 'ieltsTestPrep', to: '/student-hub/ielts-prep', locked: false },
            {
              key: 'admissions',
              to: applicantLinks.admissions,
              locked: communityLocked,
            },
            {
              key: 'researchPrep',
              to: '/student-hub/research-prep',
              locked: communityLocked,
            },
          ],
    },
    {
      key: 'community',
      Icon: UserPlus,
      links: [
        { key: 'feed', to: applicantLinks.feed, locked: communityLocked },
        {
          key: 'buddies',
          to: applicantLinks.buddies,
          locked: communityLocked,
        },
        {
          key: 'messages',
          to: applicantLinks.messages,
          locked: communityLocked,
        },
      ],
    },
  ];
  const selected = (to: string) => {
    const [path, query] = to.split('?');
    if (pathname !== path) {
      const nestedPaths: string[] = [
        applicantLinks.applications,
        applicantLinks.universities,
        applicantLinks.essays,
        applicantLinks.documents,
      ];
      return nestedPaths.includes(path) && pathname.startsWith(`${path}/`);
    }
    if (
      to === applicantLinks.profile &&
      current.get('section') === 'others' &&
      current.get('target') === 'profile' &&
      !['college-lists', 'documents'].includes(current.get('tab') ?? '')
    ) return true;
    return Array.from(new URLSearchParams(query)).every(
      ([key, value]) => current.get(key) === value,
    );
  };
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const navLink = (
    to: string,
    label: string,
    active: boolean,
    icon?: ReactNode,
    locked = false,
  ) => (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`applicant-nav-link${active ? ' is-active' : ''}`}
    >
      {icon}
      <span>{label}</span>
      {locked && (
        <Lock
          size={14}
          aria-label={t('applicant.accessRequired', 'Access required')}
          className="applicant-nav-lock"
        />
      )}
    </Link>
  );
  const group = (entry: (typeof groups)[number]) => {
    const active = entry.links.some((link) => selected(link.to));
    const open = expanded[entry.key] ?? active;
    return (
      <div key={entry.key} className="applicant-nav-group">
        <button
          type="button"
          className={`applicant-nav-link${active ? ' is-parent-active' : ''}`}
          aria-expanded={open}
          aria-controls={`applicant-${id}-${entry.key}`}
          onClick={() =>
            setExpanded((state) => ({ ...state, [entry.key]: !open }))
          }
        >
          <entry.Icon size={entry.key === 'myLearning' ? 18 : 20} aria-hidden />
          <span>{t(`applicant.${entry.key}`)}</span>
          <ChevronRight
            size={16}
            aria-hidden
            className={open ? 'is-expanded' : ''}
          />
        </button>
        <div
          id={`applicant-${id}-${entry.key}`}
          className="applicant-nav-children"
          hidden={!open}
        >
          {entry.links.map((link) => (
            <div key={link.key}>
              {navLink(
                link.to,
                t(
                  `applicant.${entry.key === 'myLearning' && link.key === 'researchPrep' ? 'researchPrepShort' : link.key}`,
                ),
                selected(link.to),
                undefined,
                'locked' in link && link.locked,
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  const intake = data?.profile?.intakeYear
    ? [
        data.profile.intakeTerm &&
          t(
            `applicant.term.${data.profile.intakeTerm}`,
            data.profile.intakeTerm,
          ),
        data.profile.intakeYear,
      ]
        .filter(Boolean)
        .join(' ')
    : t('applicant.intakeNotSet');
  return (
    <>
      <div className="applicant-summary">
        <Link
          to={applicantLinks.profile}
          onClick={onNavigate}
          className="applicant-summary__profile-link"
        >
          <div className="applicant-summary__identity">
            <span className="applicant-avatar">
              <User size={28} aria-hidden />
            </span>
            <div>
              <strong>{name}</strong>
              <p>
                {isLoading
                  ? t('applicant.loadingProfile')
                  : degree
                    ? t(`applicant.${degree}Applicant`)
                    : t('applicant.applicant')}
              </p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton.Input
              active
              size="small"
              style={{ height: 14, width: 150 }}
            />
          ) : (
            <small>{isError ? t('applicant.profileUnavailable') : intake}</small>
          )}
        </Link>
        <ProfileMembership onNavigate={onNavigate} />
      </div>
      <nav aria-label={t('applicant.workspaceNavigation')}>
        {navLink(
          applicantLinks.overview,
          t('applicant.overview'),
          isOverviewLocation(pathname, search),
          <House size={20} aria-hidden />,
        )}
        {group(groups[0])}
        {degree === 'bachelor' && group(groups[1])}
        {navLink(
          applicantLinks.fullSupport,
          t('applicant.fullSupport'),
          selected(applicantLinks.fullSupport),
          <HeartHandshake size={20} aria-hidden />,
          fullSupportLocked,
        )}
        {group(groups[2])}
        <div className="applicant-account-nav">
          {navLink(MEMBERSHIP_BILLING_PATH, t('accountNav.membership', 'Membership & billing'),
            current.get('target') === 'settings' && current.get('tab') === 'subscription', <CreditCard size={20} aria-hidden />)}
          {navLink(ACCOUNT_SETTINGS_PATH, t('accountNav.settings', 'Account settings'),
            current.get('target') === 'settings' && current.get('tab') !== 'subscription', <Settings size={20} aria-hidden />)}
        </div>
        {(managementRole === 'SuperAdmin' ||
          (managementRole as string) === 'Owner') && (
          <div className="applicant-nav-children">
            {navLink(
              '/new-admin/dashboard',
              t('studentHub.nav.adminConsole', 'Admin console'),
              false,
            )}
          </div>
        )}
      </nav>
      <OrgMembershipSidebar />
    </>
  );
}
