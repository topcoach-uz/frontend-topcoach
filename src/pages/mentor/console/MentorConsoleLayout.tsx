import { adminPanelUrl } from 'src/lib/adminPanel';
import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import {
  CalendarClock,
  CalendarDays,
  Users,
  ChevronLeft,
  Menu,
  MessageSquare,
  Shield,
  ClipboardCheck,
  GraduationCap,
} from 'lucide-react';
import { ISC_2026_ENABLED } from 'src/lib/iscAccess';
import { useGetMentorTasksQuery } from 'src/app/services/fullSupportApi';
import { useMentorConsole } from './MentorConsoleContext';
import { useMentorBookings } from './sessionSources';
import { initialsFromName } from './utils';
import StructuredSessionReports from './components/StructuredSessionReports';
import './mentor-console-tokens.scss';
import './MentorConsoleLayout.scss';

type NavKey =
  | 'schedule'
  | 'availability'
  | 'course-classes'
  | 'students'
  | 'feed'
  | 'profile'
  | 'isc-reviewer'
  | 'admin-console';

type NavItem = {
  key: NavKey;
  label: string;
  icon: ReactNode;
  path: string;
  badge?: string | null;
};

type NavGroup = { id: string; label: string; items: NavItem[] };

const MOBILE_SIDEBAR_MQ = '(max-width: 900px)';

export default function MentorConsoleLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileConsole, setIsMobileConsole] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_SIDEBAR_MQ).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_SIDEBAR_MQ);
    const sync = () => setIsMobileConsole(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileConsole || !mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileConsole, mobileMenuOpen]);

  const { displayName, avatarUrl, managementRole, isMentor, hasFullSupport } =
    useMentorConsole();

  // Sidebar badges — Schedule shows pending reports, Students shows how many
  // students need attention. The queries are shared (RTK-cached) with the
  // pages themselves, so this adds no extra network cost.
  //
  // Fired unconditionally for mentors: the backend scopes each endpoint to the
  // requesting mentor and returns empty arrays for mentors without Full Support
  // assignments. `hasFullSupport` is kept for rendering decisions only.
  const { data: tasksRes } = useGetMentorTasksQuery(undefined, { skip: !isMentor, pollingInterval: 10000 });
  const { bookings } = useMentorBookings(null, { includeFullSupport: isMentor });

  const relevantBookings = useMemo(
    () => (hasFullSupport ? bookings : bookings.filter((b) => b.source === 'platform')),
    [bookings, hasFullSupport],
  );

  const reportDueCount = useMemo(
    () => relevantBookings.filter((b) => b.status === 'report-due').length,
    [relevantBookings],
  );


  // Attention dot — a report to write or a submission awaiting review.
  const attentionByStudent = useMemo(() => {
    const set = new Set<string>();
    relevantBookings.forEach((b) => {
      if (b.status === 'report-due' && b.studentUserId) set.add(b.studentUserId);
    });
    (tasksRes?.data ?? []).forEach((t) => {
      const awaiting =
        !t.hasFeedback && (t.submissionText || (t.submissionFileUrls?.length ?? 0) > 0);
      if (awaiting && t.studentUserId) set.add(t.studentUserId);
    });
    return set;
  }, [relevantBookings, tasksRes?.data]);

  const navGroups: NavGroup[] = useMemo(() => {
    const overviewItems: NavItem[] = [
      {
        key: 'schedule',
        label: 'Schedule',
        icon: <CalendarClock size={18} strokeWidth={1.75} />,
        path: '/mentor/dashboard',
        badge: reportDueCount > 0 ? `${reportDueCount} pending` : null,
      },
      {
        key: 'availability',
        label: 'Availability',
        icon: <CalendarDays size={18} strokeWidth={1.75} />,
        path: '/mentor/availability',
      },
      {
        key: 'students',
        label: 'Students',
        icon: <Users size={18} strokeWidth={1.75} />,
        path: '/mentor/students',
        // Students with a report to write or work awaiting feedback.
        badge: attentionByStudent.size > 0 ? String(attentionByStudent.size) : null,
      },
      {
        key: 'course-classes',
        label: 'Course classes',
        icon: <GraduationCap size={18} strokeWidth={1.75} />,
        path: '/mentor/course-classes',
      },
      {
        key: 'feed',
        label: 'Feed',
        icon: <MessageSquare size={18} strokeWidth={1.75} />,
        path: '/mentor/feed',
      },
    ];

    const isSuperAdmin = managementRole === 'SuperAdmin' || managementRole === 'Owner';

    // Profile and Referrals live in the Account page, opened
    // from the user card at the bottom of the sidebar. This group only holds
    // staff shortcuts.
    const accountItems: NavItem[] = [];

    // Surface the Admin Console shortcut inside the mentor sidebar for
    // SuperAdmin / Owner accounts. They run a Mentor profile day-to-day
    // (no separate "My Journey" student hub anymore) but still need a
    // one-click jump into /new-admin/* without going through the avatar
    // menu.
    if (isSuperAdmin) {
      accountItems.push({
        key: 'admin-console',
        label: 'Admin',
        icon: <Shield size={18} strokeWidth={1.75} />,
        path: adminPanelUrl,
      });
    }

    // ISC 2026 reviewer console — for anyone granted the Reviewer role
    // (superadmins can also jump in to test the reviewer experience).
    if (ISC_2026_ENABLED && (managementRole === 'Reviewer' || isSuperAdmin)) {
      accountItems.push({
        key: 'isc-reviewer',
        label: 'ISC Reviewer',
        icon: <ClipboardCheck size={18} strokeWidth={1.75} />,
        path: '/isc-2026/review',
      });
    }

    return [
      { id: 'overview', label: 'Overview', items: overviewItems },
      { id: 'account', label: 'Account', items: accountItems },
    ];
  }, [managementRole, reportDueCount, attentionByStudent]);


  const activeKey = useMemo((): NavKey | null => {
    const p = location.pathname;
    if (p.startsWith('/isc-2026/review')) return 'isc-reviewer';
    if (p.startsWith('/mentor/course-classes')) return 'course-classes';
    if (p.startsWith('/mentor/availability')) return 'availability';
    // Sessions and To review folded into Schedule; legacy paths highlight it.
    if (
      p.startsWith('/mentor/dashboard') ||
      p.startsWith('/mentor/sessions') ||
      p.startsWith('/mentor/to-review')
    )
      return 'schedule';
    if (p.startsWith('/mentor/students')) return 'students';
    if (p.startsWith('/mentor/feed')) return 'feed';
    if (p.startsWith('/mentor/profile')) return 'profile';
    if (p.startsWith('/new-admin') || p.startsWith('/admin')) return 'admin-console';
    return null;
  }, [location.pathname]);

  const roleLabel = (() => {
    // Elevated admin roles take precedence — otherwise a mentor is always "Mentor",
    // never the raw "User" enum value stored on the user record.
    if (managementRole === 'SuperAdmin') return 'Super Admin';
    if (managementRole === 'Owner') return 'Owner';
    if (managementRole === 'Admin') return 'Admin';
    if (managementRole === 'Manager') return 'Manager';
    if (managementRole === 'Assistant') return 'Assistant';
    if (isMentor) return 'Mentor';
    return 'User';
  })();

  const siderWidth = collapsed ? 76 : 232;
  const showLabels = !collapsed || isMobileConsole;

  const siderClass = [
    'mentor-console-sider',
    collapsed ? 'mentor-console-sider--collapsed' : '',
    isMobileConsole ? 'mentor-console-sider--mobile' : '',
    isMobileConsole && mobileMenuOpen ? 'mentor-console-sider--mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const renderNavItem = (item: NavItem) => {
    const isActive = activeKey === item.key;
    return (
      <button
        key={item.key}
        type="button"
        className={`mentor-console-nav-item ${
          isActive ? 'mentor-console-nav-item--active' : ''
        }`}
        onClick={() => {
          if (item.key === 'admin-console') window.location.assign(item.path);
          else navigate(item.path);
          setMobileMenuOpen(false);
        }}
        title={collapsed && !isMobileConsole ? item.label : undefined}
      >
        <span className="mentor-console-nav-item-icon">{item.icon}</span>
        {showLabels && (
          <>
            <span className="mentor-console-nav-item-label">{item.label}</span>
            {item.badge ? (
              <span className="mentor-console-nav-pending">{item.badge}</span>
            ) : null}
          </>
        )}
      </button>
    );
  };

  return (
    <div
      className={`mentor-console-app ${isMobileConsole ? 'mentor-console-app--mobile-layout' : ''}`}
      style={{ minHeight: 'calc(100vh - 80px)' }}
    >
      {isMobileConsole && mobileMenuOpen ? (
        <button
          type="button"
          className="mentor-console-nav-backdrop mentor-console-nav-backdrop--visible"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <aside
        id="mentor-console-sider"
        className={siderClass}
        style={
          isMobileConsole
            ? undefined
            : { width: siderWidth, flex: `0 0 ${siderWidth}px` as const }
        }
      >
        <div className="mentor-console-sider-inner">
          <nav className="mentor-console-nav" aria-label="Mentor navigation" id="mentor-console-sider-nav">
            <div className="mentor-console-nav-group">
              {showLabels && <div className="mentor-console-nav-group-label">Overview</div>}
              {navGroups[0].items.map(renderNavItem)}
            </div>

            {navGroups[1].items.length > 0 && (
              <div className="mentor-console-nav-group">
                {showLabels && <div className="mentor-console-nav-group-label">Account</div>}
                {navGroups[1].items.map(renderNavItem)}
              </div>
            )}
          </nav>

          <button
            type="button"
            className="mentor-console-collapse-toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              size={16}
              className={collapsed ? 'mentor-console-collapse-icon--flipped' : ''}
            />
          </button>

          <button
            type="button"
            className={`mentor-console-user-footer ${
              activeKey === 'profile' ? 'mentor-console-user-footer--active' : ''
            }`}
            onClick={() => {
              navigate('/mentor/profile');
              setMobileMenuOpen(false);
            }}
            aria-label="Open account settings"
            title={collapsed && !isMobileConsole ? 'Account' : undefined}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="mentor-console-user-avatar mentor-console-user-avatar--image"
                title={displayName}
              />
            ) : (
              <div className="mentor-console-user-avatar" title={displayName}>
                {initialsFromName(displayName)}
              </div>
            )}
            {showLabels && (
              <div className="mentor-console-user-meta">
                <div className="mentor-console-user-name">{displayName}</div>
                <div className="mentor-console-user-role">{roleLabel}</div>
              </div>
            )}
          </button>
        </div>
      </aside>

      <main className="mentor-console-main">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <StructuredSessionReports />
        </div>
        {isMobileConsole ? (
          <div className="mentor-console-mobile-bar">
            <button
              type="button"
              className="mentor-console-mobile-bar-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mentor-console-sider"
              aria-label="Open navigation menu"
            >
              <Menu size={22} strokeWidth={2} />
            </button>
            <span className="mentor-console-mobile-bar-title">Mentor console</span>
          </div>
        ) : null}
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '40vh',
              }}
            >
              <Spin size="large" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
