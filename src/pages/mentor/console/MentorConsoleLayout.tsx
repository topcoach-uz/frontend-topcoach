import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import {
  CalendarClock,
  Users,
  ClipboardList,
  UserCircle2,
  ChevronLeft,
  Menu,
  Shield,
  ClipboardCheck,
} from 'lucide-react';
import { ISC_2026_ENABLED } from 'src/lib/iscAccess';
import {
  useGetMentorPipelineQuery,
  useGetMentorRosterQuery,
  useGetMentorTasksQuery,
} from 'src/app/services/fullSupportApi';
import { useMentorConsole } from './MentorConsoleContext';
import { useMentorBookings } from './sessionSources';
import { avatarStyleForId, initialsFromName } from './utils';
import './mentor-console-tokens.scss';
import './MentorConsoleLayout.scss';

type NavKey =
  | 'schedule'
  | 'availability'
  | 'students'
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

  // Sidebar data — the roster lives permanently in the nav ("My students"),
  // the Schedule item carries a pending-reports badge, and each student row
  // gets an attention dot. All three queries are shared (RTK-cached) with the
  // pages themselves, so this adds no extra network cost.
  const { data: rosterRes } = useGetMentorRosterQuery(undefined, { skip: !hasFullSupport });
  const { data: tasksRes } = useGetMentorTasksQuery(undefined, { skip: !hasFullSupport });
  const { data: pipelineRes } = useGetMentorPipelineQuery(undefined, { skip: !hasFullSupport });
  const { bookings } = useMentorBookings(null, { includeFullSupport: hasFullSupport });

  const roster = rosterRes?.data ?? [];

  const relevantBookings = useMemo(
    () => (hasFullSupport ? bookings : bookings.filter((b) => b.source === 'platform')),
    [bookings, hasFullSupport],
  );

  const reportDueCount = useMemo(
    () => relevantBookings.filter((b) => b.status === 'report-due').length,
    [relevantBookings],
  );

  // Program label per student — first essays/applications row, mockup-style
  // ("Oxford PPE" under the name). Falls back to hours + session count.
  const programByStudent = useMemo(() => {
    const map = new Map<string, string>();
    (pipelineRes?.data ?? []).forEach((p) => {
      if (p.studentUserId && p.program && !map.has(p.studentUserId)) {
        map.set(p.studentUserId, p.program);
      }
    });
    return map;
  }, [pipelineRes?.data]);

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
        icon: <ClipboardList size={18} strokeWidth={1.75} />,
        path: '/mentor/availability',
      },
    ];

    const isSuperAdmin = managementRole === 'SuperAdmin' || managementRole === 'Owner';

    const accountItems: NavItem[] = [
      {
        key: 'profile',
        label: 'Profile',
        icon: <UserCircle2 size={18} strokeWidth={1.75} />,
        path: '/mentor/profile',
      },
    ];

    // Surface the Admin Console shortcut inside the mentor sidebar for
    // SuperAdmin / Owner accounts. They run a Mentor profile day-to-day
    // (no separate "My Journey" student hub anymore) but still need a
    // one-click jump into /new-admin/* without going through the avatar
    // menu.
    if (isSuperAdmin) {
      accountItems.push({
        key: 'admin-console',
        label: 'Admin Console',
        icon: <Shield size={18} strokeWidth={1.75} />,
        path: '/new-admin/dashboard',
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
  }, [managementRole, reportDueCount]);

  const activeStudentId = useMemo(() => {
    const m = location.pathname.match(/^\/mentor\/students\/([^/]+)/);
    return m ? m[1] : null;
  }, [location.pathname]);

  const activeKey = useMemo((): NavKey | null => {
    const p = location.pathname;
    if (p.startsWith('/isc-2026/review')) return 'isc-reviewer';
    // Sessions and To review folded into Schedule; legacy paths highlight it.
    if (
      p.startsWith('/mentor/dashboard') ||
      p.startsWith('/mentor/sessions') ||
      p.startsWith('/mentor/to-review')
    )
      return 'schedule';
    if (activeStudentId) return null; // the student row itself is highlighted
    if (p.startsWith('/mentor/students')) return 'students';
    if (p.startsWith('/mentor/availability')) return 'availability';
    if (p.startsWith('/mentor/profile')) return 'profile';
    if (p.startsWith('/new-admin') || p.startsWith('/admin')) return 'admin-console';
    return null;
  }, [location.pathname, activeStudentId]);

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
          navigate(item.path);
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
          <div className="mentor-console-brand">
            <div className="mentor-console-brand-title">
              {collapsed && !isMobileConsole ? 'MC' : 'Mentor console'}
            </div>
            {showLabels && (
              <div className="mentor-console-brand-sub">
                Students, sessions &amp; milestones
              </div>
            )}
          </div>

          <nav className="mentor-console-nav" aria-label="Mentor navigation" id="mentor-console-sider-nav">
            <div className="mentor-console-nav-group">
              {showLabels && <div className="mentor-console-nav-group-label">Overview</div>}
              {navGroups[0].items.map(renderNavItem)}
            </div>

            {hasFullSupport && (
              <div className="mentor-console-nav-group">
                {showLabels && (
                  <div className="mentor-console-nav-group-label">My students</div>
                )}
                {roster.map((r) => {
                  const isActive = activeStudentId === r.id;
                  const program = programByStudent.get(r.id);
                  const needsAttention = attentionByStudent.has(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      className={`mentor-console-student-item ${
                        isActive ? 'mentor-console-student-item--active' : ''
                      }`}
                      onClick={() => {
                        navigate(`/mentor/students/${r.id}`);
                        setMobileMenuOpen(false);
                      }}
                      title={collapsed && !isMobileConsole ? r.name : undefined}
                    >
                      <span
                        className="mentor-console-student-avatar"
                        style={avatarStyleForId(r.id)}
                      >
                        {initialsFromName(r.name)}
                      </span>
                      {showLabels && (
                        <>
                          <span className="mentor-console-student-meta">
                            <span className="mentor-console-student-name">{r.name}</span>
                            <span className="mentor-console-student-program">
                              {program || `${r.sessionsCount} session${r.sessionsCount === 1 ? '' : 's'}`}
                            </span>
                          </span>
                          <span
                            className={`mentor-console-student-dot ${
                              needsAttention ? 'mentor-console-student-dot--attention' : ''
                            }`}
                            title={needsAttention ? 'Needs attention' : 'All caught up'}
                          />
                        </>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={`mentor-console-nav-item ${
                    activeKey === 'students' ? 'mentor-console-nav-item--active' : ''
                  }`}
                  onClick={() => {
                    navigate('/mentor/students');
                    setMobileMenuOpen(false);
                  }}
                  title={collapsed && !isMobileConsole ? 'All students' : undefined}
                >
                  <span className="mentor-console-nav-item-icon">
                    <Users size={18} strokeWidth={1.75} />
                  </span>
                  {showLabels && (
                    <span className="mentor-console-nav-item-label">All students</span>
                  )}
                </button>
              </div>
            )}

            <div className="mentor-console-nav-group">
              {showLabels && <div className="mentor-console-nav-group-label">Account</div>}
              {navGroups[1].items.map(renderNavItem)}
            </div>
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
            {!collapsed && <span>Collapse</span>}
          </button>

          <div className="mentor-console-user-footer">
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
          </div>
        </div>
      </aside>

      <main className="mentor-console-main">
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
