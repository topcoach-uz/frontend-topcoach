import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  ClipboardList,
  Inbox,
  UserCircle2,
  ChevronLeft,
  Menu,
  Shield,
} from 'lucide-react';
import { useMentorConsole } from './MentorConsoleContext';
import { initialsFromName } from './utils';
import './mentor-console-tokens.scss';
import './MentorConsoleLayout.scss';

type NavKey =
  | 'dashboard'
  | 'students'
  | 'sessions'
  | 'availability'
  | 'to-review'
  | 'profile'
  | 'admin-console'
  | 'admin-school-counselor'
  | 'admin-topcoach-management'
  | 'admin-course-content'
  | 'admin-caaf'
  | 'admin-full-support';

type NavItem = {
  key: NavKey;
  label: string;
  icon: ReactNode;
  path: string;
  external?: boolean;
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

  const navGroups: NavGroup[] = useMemo(() => {
    const sessionsItem: NavItem = {
      key: 'sessions',
      label: 'Sessions',
      icon: <CalendarClock size={18} strokeWidth={1.75} />,
      path: '/mentor/sessions',
    };
    const availabilityItem: NavItem = {
      key: 'availability',
      label: 'Availability',
      icon: <ClipboardList size={18} strokeWidth={1.75} />,
      path: '/mentor/availability',
    };

    // FS mentors get a student-centric console; Tasks / Milestones / Research
    // grading are unified into the "To review" queue (per-student work lives in
    // the student workspace).
    const mentorshipItems: NavItem[] = hasFullSupport
      ? [
          availabilityItem,
          {
            key: 'students',
            label: 'Students',
            icon: <Users size={18} strokeWidth={1.75} />,
            path: '/mentor/students',
          },
          sessionsItem,
          {
            key: 'to-review',
            label: 'To review',
            icon: <Inbox size={18} strokeWidth={1.75} />,
            path: '/mentor/to-review',
          },
        ]
      : [availabilityItem, sessionsItem];

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

    const groups: NavGroup[] = [
      {
        id: 'overview',
        label: 'Overview',
        items: [
          {
            key: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard size={18} strokeWidth={1.75} />,
            path: '/mentor/dashboard',
          },
        ],
      },
      {
        id: 'mentorship',
        label: 'Mentorship',
        items: mentorshipItems,
      },
      {
        id: 'account',
        label: 'Account',
        items: accountItems,
      },
    ];

    return groups;
  }, [hasFullSupport, managementRole]);

  const activeKey = useMemo((): NavKey | null => {
    const p = location.pathname;
    if (p.startsWith('/mentor/dashboard')) return 'dashboard';
    if (p.startsWith('/mentor/students')) return 'students';
    if (p.startsWith('/mentor/sessions')) return 'sessions';
    if (p.startsWith('/mentor/availability')) return 'availability';
    if (
      p.startsWith('/mentor/to-review') ||
      p.startsWith('/mentor/tasks') ||
      p.startsWith('/mentor/milestones') ||
      p.startsWith('/mentor/research-grading')
    )
      return 'to-review';
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

  const siderClass = [
    'mentor-console-sider',
    collapsed ? 'mentor-console-sider--collapsed' : '',
    isMobileConsole ? 'mentor-console-sider--mobile' : '',
    isMobileConsole && mobileMenuOpen ? 'mentor-console-sider--mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
            {(!collapsed || isMobileConsole) && (
              <div className="mentor-console-brand-sub">
                Students, sessions &amp; milestones
              </div>
            )}
          </div>

          <nav className="mentor-console-nav" aria-label="Mentor navigation" id="mentor-console-sider-nav">
            {navGroups.map((group) => (
              <div key={group.id} className="mentor-console-nav-group">
                {(!collapsed || isMobileConsole) && (
                  <div className="mentor-console-nav-group-label">{group.label}</div>
                )}
                {group.items.map((item) => {
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
                      {(!collapsed || isMobileConsole) && (
                        <span className="mentor-console-nav-item-label">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
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
            {(!collapsed || isMobileConsole) && (
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
