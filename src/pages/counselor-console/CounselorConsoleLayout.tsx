import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Dropdown, Input, Spin, type MenuProps } from 'antd';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileBarChart2,
  // Megaphone, // parked with the Announcements nav item
  UserCog,
  Settings,
  ScrollText,
  ArrowLeft,
  Building2,
  ChevronLeft,
  ChevronsUpDown,
  Menu,
  Check,
  Search,
  LogOut,
} from 'lucide-react';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { logout } from 'src/app/slices/authSlice';
import { useGetMeQuery } from 'src/app/services/users';
import { MEDIA_TAGS } from 'src/app/api/Api';
import { useCounselorConsole } from './CounselorConsoleContext';
import './counselor-console-tokens.scss';
import './console-antd.scss';
import './CounselorConsoleLayout.scss';

type NavKey =
  | 'dashboard'
  | 'students'
  | 'analytics'
  | 'reports'
  | 'announcements'
  | 'staff'
  | 'settings'
  | 'audit';

type NavItem = {
  key: NavKey;
  label: string;
  icon: ReactNode;
  path: string;
  badge?: string | null;
};

type NavGroup = { id: string; label: string; items: NavItem[] };

const MOBILE_SIDEBAR_MQ = '(max-width: 900px)';

function initialsFromName(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

const ORG_STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  suspended: 'Suspended',
  archived: 'Archived',
};

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  counselor: 'Counselor',
  student: 'Student',
};

// Show the org-switcher search box once the list gets long enough to scan
// (a SuperAdmin now receives every organization).
const ORG_SEARCH_THRESHOLD = 8;

export default function CounselorConsoleLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orgQuery, setOrgQuery] = useState('');
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

  const { orgs, orgId, setOrgId, org, role } = useCounselorConsole();

  const dispatch = useAppDispatch();
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const authProfile = useTypedSelector((state) => state.auth.profile);
  const { data: userData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const currentUser = userData || authProfile;
  const [avatarBroken, setAvatarBroken] = useState(false);
  const avatarImage = (currentUser as { profile?: { media?: Array<{ url?: string; tags?: string[] | null; createdAt: string }> } })
    ?.profile?.media
    ?.filter((m) => m?.tags?.includes(MEDIA_TAGS.ProfilePicture) || m?.tags === null)
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    ?.[0]?.url;
  const displayName =
    currentUser?.profile?.name?.trim() ||
    currentUser?.email?.split('@')[0] ||
    'Counselor';

  // SuperAdmin is a platform-level (management) role, detected the same way the
  // gate does — from the user's `managementRole`, NOT from an org membership.
  // Their memberships all report `role: 'owner'`, so without this the footer
  // would mislabel them as "Owner"/"Counselor".
  const managementRole = (currentUser as { managementRole?: string } | undefined)
    ?.managementRole;
  const isSuperAdmin =
    managementRole === 'SuperAdmin' || managementRole === 'Owner';
  const roleLabel = isSuperAdmin
    ? 'Super Admin'
    : role
      ? ROLE_LABEL[role] ?? role
      : 'Member';

  const navGroups: NavGroup[] = useMemo(() => {
    const overviewItems: NavItem[] = [
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard size={18} strokeWidth={1.75} />,
        path: '/counselor-console',
      },
      {
        key: 'students',
        label: 'Students',
        icon: <Users size={18} strokeWidth={1.75} />,
        path: '/counselor-console/students',
      },
    ];

    const insightsItems: NavItem[] = [
      {
        key: 'analytics',
        label: 'Analytics',
        icon: <BarChart3 size={18} strokeWidth={1.75} />,
        path: '/counselor-console/analytics',
      },
      {
        key: 'reports',
        label: 'Reports',
        icon: <FileBarChart2 size={18} strokeWidth={1.75} />,
        path: '/counselor-console/reports',
      },
    ];

    // Announcements is parked for now. The page, route and backend are intact —
    // uncomment this item and its <Route> in lib/router/index.tsx to restore.
    const communicationItems: NavItem[] = [
      // {
      //   key: 'announcements',
      //   label: 'Announcements',
      //   icon: <Megaphone size={18} strokeWidth={1.75} />,
      //   path: '/counselor-console/announcements',
      // },
    ];

    // Administration is owner-only — counselors never see Staff / Settings.
    const administrationItems: NavItem[] = [
      {
        key: 'staff',
        label: 'Staff',
        icon: <UserCog size={18} strokeWidth={1.75} />,
        path: '/counselor-console/staff',
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: <Settings size={18} strokeWidth={1.75} />,
        path: '/counselor-console/settings',
      },
      {
        key: 'audit',
        label: 'Audit log',
        icon: <ScrollText size={18} strokeWidth={1.75} />,
        path: '/counselor-console/audit',
      },
    ];

    const groups: NavGroup[] = [
      { id: 'overview', label: 'Overview', items: overviewItems },
      { id: 'insights', label: 'Insights', items: insightsItems },
      { id: 'communication', label: 'Communication', items: communicationItems },
    ];
    if (role === 'owner') {
      groups.push({
        id: 'administration',
        label: 'Administration',
        items: administrationItems,
      });
    }
    // Drop empty groups so a parked section (e.g. Communication while
    // Announcements is off) doesn't leave a dangling header in the sidebar.
    return groups.filter((g) => g.items.length > 0);
  }, [role]);

  const activeKey = useMemo((): NavKey | null => {
    const p = location.pathname;
    if (p.startsWith('/counselor-console/students')) return 'students';
    if (p.startsWith('/counselor-console/analytics')) return 'analytics';
    if (p.startsWith('/counselor-console/reports')) return 'reports';
    if (p.startsWith('/counselor-console/announcements')) return 'announcements';
    if (p.startsWith('/counselor-console/staff')) return 'staff';
    if (p.startsWith('/counselor-console/settings')) return 'settings';
    if (p.startsWith('/counselor-console/audit')) return 'audit';
    if (p === '/counselor-console' || p === '/counselor-console/') return 'dashboard';
    return null;
  }, [location.pathname]);

  const siderWidth = collapsed ? 76 : 240;
  const showLabels = !collapsed || isMobileConsole;

  const siderClass = [
    'counselor-console-sider',
    collapsed ? 'counselor-console-sider--collapsed' : '',
    isMobileConsole ? 'counselor-console-sider--mobile' : '',
    isMobileConsole && mobileMenuOpen ? 'counselor-console-sider--mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const orgSearchEnabled = orgs.length > ORG_SEARCH_THRESHOLD;
  const query = orgQuery.trim().toLowerCase();
  const filteredOrgs =
    orgSearchEnabled && query
      ? orgs.filter((m) => m.organization.name.toLowerCase().includes(query))
      : orgs;

  const orgMenuItems: MenuProps['items'] = filteredOrgs.length
    ? filteredOrgs.map((m) => ({
        key: m.organization.id,
        label: (
          <span className="counselor-console-org-option">
            <span className="counselor-console-org-option-name">
              {m.organization.name}
            </span>
            {m.organization.id === orgId ? (
              <Check size={14} className="counselor-console-org-option-check" />
            ) : null}
          </span>
        ),
      }))
    : [
        {
          key: '__no_match__',
          disabled: true,
          label: (
            <span className="counselor-console-org-option-empty">No matches</span>
          ),
        },
      ];

  const renderNavItem = (item: NavItem) => {
    const isActive = activeKey === item.key;
    return (
      <button
        key={item.key}
        type="button"
        className={`counselor-console-nav-item ${
          isActive ? 'counselor-console-nav-item--active' : ''
        }`}
        onClick={() => {
          navigate(item.path);
          setMobileMenuOpen(false);
        }}
        title={collapsed && !isMobileConsole ? item.label : undefined}
      >
        <span className="counselor-console-nav-item-icon">{item.icon}</span>
        {showLabels && (
          <>
            <span className="counselor-console-nav-item-label">{item.label}</span>
            {item.badge ? (
              <span className="counselor-console-nav-pending">{item.badge}</span>
            ) : null}
          </>
        )}
      </button>
    );
  };


  return (
    <div
      className={`counselor-console-app ${
        isMobileConsole ? 'counselor-console-app--mobile-layout' : ''
      }`}
      // Nested inside MainLayout — leave room for the 80px site header.
      style={{ minHeight: 'calc(100vh - 80px)' }}
    >
      {isMobileConsole && mobileMenuOpen ? (
        <button
          type="button"
          className="counselor-console-nav-backdrop counselor-console-nav-backdrop--visible"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <aside
        id="counselor-console-sider"
        className={siderClass}
        style={
          isMobileConsole
            ? undefined
            : { width: siderWidth, flex: `0 0 ${siderWidth}px` as const }
        }
      >
        <div className="counselor-console-sider-inner">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => navigate('/new-admin/organization-management')}
              title="Back to admin console"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b6258',
                font: 'inherit',
                fontSize: '0.78rem',
                padding: '4px 6px',
                marginBottom: 8,
                width: '100%',
              }}
            >
              <ArrowLeft size={14} />
              {showLabels && <span>Back to admin</span>}
            </button>
          )}
          {/* Org switcher — the header/top area of the console */}
          <div className="counselor-console-orgswitch">
            {orgs.length > 1 ? (
              <Dropdown
                trigger={['click']}
                placement="bottomLeft"
                onOpenChange={(open) => {
                  if (!open) setOrgQuery('');
                }}
                menu={{
                  items: orgMenuItems,
                  selectable: true,
                  selectedKeys: orgId ? [orgId] : [],
                  onClick: ({ key }) => {
                    if (key === '__no_match__') return;
                    setOrgId(key);
                    setOrgQuery('');
                  },
                }}
                dropdownRender={
                  orgSearchEnabled
                    ? (menu) => (
                        <div className="counselor-console-org-menu">
                          <div className="counselor-console-org-search">
                            <Search
                              size={14}
                              className="counselor-console-org-search-icon"
                            />
                            <Input
                              autoFocus
                              variant="borderless"
                              size="small"
                              placeholder="Search organizations"
                              value={orgQuery}
                              onChange={(e) => setOrgQuery(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {menu}
                        </div>
                      )
                    : undefined
                }
              >
                <button type="button" className="counselor-console-orgswitch-btn">
                  <span className="counselor-console-org-avatar"><Building2 size={16} /></span>
                  {showLabels && (
                    <>
                      <span className="counselor-console-orgswitch-meta">
                        <span className="counselor-console-orgswitch-name">
                          {org?.name ?? 'Select organization'}
                        </span>
                        <span className="counselor-console-orgswitch-sub">
                          {org ? ORG_STATUS_LABEL[org.status] ?? org.status : ''}
                        </span>
                      </span>
                      <ChevronsUpDown
                        size={15}
                        className="counselor-console-orgswitch-caret"
                      />
                    </>
                  )}
                </button>
              </Dropdown>
            ) : (
              <div className="counselor-console-orgswitch-btn counselor-console-orgswitch-btn--static">
                <span className="counselor-console-org-avatar"><Building2 size={16} /></span>
                {showLabels && (
                  <span className="counselor-console-orgswitch-meta">
                    <span className="counselor-console-orgswitch-name">
                      {org?.name ?? 'Organization'}
                    </span>
                    <span className="counselor-console-orgswitch-sub">
                      {org ? ORG_STATUS_LABEL[org.status] ?? org.status : ''}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          <nav
            className="counselor-console-nav"
            aria-label="Counselor navigation"
            id="counselor-console-sider-nav"
          >
            {navGroups.map((group) => (
              <div className="counselor-console-nav-group" key={group.id}>
                {showLabels && (
                  <div className="counselor-console-nav-group-label">{group.label}</div>
                )}
                {group.items.map(renderNavItem)}
              </div>
            ))}
          </nav>

          <button
            type="button"
            className="counselor-console-collapse-toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              size={16}
              className={collapsed ? 'counselor-console-collapse-icon--flipped' : ''}
            />
          </button>

          <div className="counselor-console-user-footer">
            <div className="counselor-console-user-avatar" title={displayName}>
              {avatarImage && !avatarBroken ? (
                <img
                  src={avatarImage}
                  alt=""
                  onError={() => setAvatarBroken(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                />
              ) : (
                initialsFromName(displayName)
              )}
            </div>
            {showLabels && (
              <>
                <div className="counselor-console-user-meta">
                  <div className="counselor-console-user-name">{displayName}</div>
                  <div className="counselor-console-user-role">{roleLabel}</div>
                </div>
                <button
                  type="button"
                  className="counselor-console-user-logout"
                  onClick={() => dispatch(logout())}
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut size={16} strokeWidth={1.75} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="counselor-console-main">
        {isMobileConsole ? (
          <div className="counselor-console-mobile-bar">
            <button
              type="button"
              className="counselor-console-mobile-bar-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-controls="counselor-console-sider"
              aria-label="Open navigation menu"
            >
              <Menu size={22} strokeWidth={2} />
            </button>
            <span className="counselor-console-mobile-bar-title">Counselor console</span>
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
