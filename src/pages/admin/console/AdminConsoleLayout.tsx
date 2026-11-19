import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Layout,
  Typography,
  Button,
  Spin,
  Input,
  Badge,
  Breadcrumb,
  ConfigProvider,
} from 'antd';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  CalendarDays,
  Sparkles,
  Shield,
  CreditCard,
  Repeat,
  Gift,
  LineChart,
  ChevronLeft,
  BookOpen,
  Building2,
  Brain,
  Flag,
  Mail,
} from 'lucide-react';
import { useAdminConsole } from './AdminConsoleContext';
import './admin-console-tokens.scss';
import './AdminConsoleLayout.scss';
// Loads the dark-theme overrides for the embedded TopCoach Management
// view + the Grant Access modal (rendered into a body portal). Without
// this, the modal falls back to AntD's default light styles on top of
// the dark admin canvas, which is why the text looked washed-out grey.
import './admin-console-integrated-management.scss';
import { getAdminConsoleAntdTheme } from './adminConsoleThemeConfig';
import { initialsFromName } from './utils';

import SearchButton from 'src/components/common/searchButton';
const { Header, Content } = Layout;
const { Text } = Typography;

type NavKey =
  | 'dashboard'
  | 'users'
  | 'programs'
  | 'payments'
  | 'referrals'
  | 'subscriptions'
  | 'sessions'
  | 'events'
  | 'insights'
  | 'major-match'
  | 'administration'
  | 'community-moderation'
  | 'course-content'
  | 'organization-management'
  | 'contact-leads';

type NavItem = {
  key: NavKey;
  label: string;
  icon: ReactNode;
  path: string;
  badge?: number;
};

type NavGroup = { id: string; label: string; items: NavItem[] };

export default function AdminConsoleLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    if (location.pathname.startsWith('/new-admin/users')) {
      setGlobalSearch(searchParams.get('q') ?? '');
    }
  }, [location.pathname, searchParams]);

  const { role, currentUserEmail, actorDisplayName } = useAdminConsole();

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        id: 'overview',
        label: 'Overview',
        items: [
          {
            key: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard size={18} strokeWidth={1.75} />,
            path: '/new-admin/dashboard',
          },
          {
            key: 'insights',
            label: 'Insights',
            icon: <LineChart size={18} strokeWidth={1.75} />,
            path: '/new-admin/insights',
          },
        ],
      },
      {
        id: 'operations',
        label: 'Operations',
        items: [
          {
            key: 'programs',
            label: 'Programs',
            icon: <Settings size={18} strokeWidth={1.75} />,
            path: '/new-admin/programs/enrollments',
          },
          {
            key: 'sessions',
            label: 'Sessions',
            icon: <CalendarDays size={18} strokeWidth={1.75} />,
            path: '/new-admin/sessions',
          },
          {
            key: 'events',
            label: 'Events',
            icon: <Sparkles size={18} strokeWidth={1.75} />,
            path: '/new-admin/events',
          },
          {
            key: 'course-content',
            label: 'Course content',
            icon: <BookOpen size={18} strokeWidth={1.75} />,
            path: '/course-admin/courses/modules',
          },
          {
            key: 'major-match',
            label: 'AI Major Match',
            icon: <Brain size={18} strokeWidth={1.75} />,
            path: '/new-admin/major-match',
          },
        ],
      },
      {
        id: 'revenue',
        label: 'Revenue',
        items: [
          {
            key: 'payments',
            label: 'Payments',
            icon: <CreditCard size={18} strokeWidth={1.75} />,
            path: '/new-admin/payments',
          },
          {
            key: 'referrals',
            label: 'Referrals',
            icon: <Gift size={18} strokeWidth={1.75} />,
            path: '/new-admin/referrals',
          },
          {
            key: 'subscriptions',
            label: 'Subscriptions',
            icon: <Repeat size={18} strokeWidth={1.75} />,
            path: '/new-admin/subscriptions',
          },
        ],
      },
      {
        id: 'people',
        label: 'People & Partners',
        items: [
          {
            key: 'users',
            label: 'Users',
            icon: <Users size={18} strokeWidth={1.75} />,
            path: '/new-admin/users',
          },
          {
            key: 'organization-management',
            label: 'Organization Management',
            icon: <Building2 size={18} strokeWidth={1.75} />,
            path: '/new-admin/organization-management',
          },
          {
            key: 'contact-leads',
            label: 'Contact Leads',
            icon: <Mail size={18} strokeWidth={1.75} />,
            path: '/new-admin/contact-leads',
          },
        ],
      },
      {
        id: 'governance',
        label: 'Governance',
        items: [
          {
            key: 'administration',
            label: 'Administration',
            icon: <Shield size={18} strokeWidth={1.75} />,
            path: '/new-admin/administration',
          },
          {
            key: 'community-moderation',
            label: 'Community Moderation',
            icon: <Flag size={18} strokeWidth={1.75} />,
            path: '/new-admin/community-moderation',
          },
        ],
      },
    ],
    [],
  );

  const activeKey = useMemo((): NavKey | null => {
    const p = location.pathname;
    if (p.startsWith('/new-admin/dashboard')) return 'dashboard';
    if (p.startsWith('/new-admin/users')) return 'users';
    if (p.startsWith('/new-admin/organization-management')) return 'organization-management';
    if (p.startsWith('/new-admin/contact-leads')) return 'contact-leads';
    if (p.startsWith('/new-admin/programs')) return 'programs';
    if (p.startsWith('/new-admin/payments')) return 'payments';
    if (p.startsWith('/new-admin/referrals')) return 'referrals';
    if (p.startsWith('/new-admin/subscriptions')) return 'subscriptions';
    if (p.startsWith('/new-admin/sessions')) return 'sessions';
    if (p.startsWith('/new-admin/events')) return 'events';
    if (p.startsWith('/new-admin/insights')) return 'insights';
    if (p.startsWith('/new-admin/major-match')) return 'major-match';
    if (p.startsWith('/new-admin/administration')) return 'administration';
    if (p.startsWith('/new-admin/community-moderation')) return 'community-moderation';
    return null;
  }, [location.pathname]);

  const breadcrumbItems = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/new-admin/events/caaf')) {
      return [{ title: 'Admin' }, { title: 'Events' }, { title: 'CA Admissions Forum' }];
    }
    if (p.startsWith('/new-admin/events/topcoach-launch-event')) {
      return [{ title: 'Admin' }, { title: 'Events' }, { title: 'New Feature Launch' }];
    }
    if (p.startsWith('/new-admin/programs/')) {
      const slug = p.replace('/new-admin/programs/', '') || 'enrollments';
      const labels: Record<string, string> = {
        enrollments: 'Enrollments',
        organizations: 'Organizations',
        'full-support': 'Full Support',
        'research-prep': 'Research Prep',
      };
      return [
        { title: 'Admin' },
        { title: 'Programs' },
        { title: labels[slug] ?? slug },
      ];
    }
    const map: Record<string, string> = {
      '/new-admin/dashboard': 'Dashboard',
      '/new-admin/users': 'Users',
      '/new-admin/payments': 'Payments',
      '/new-admin/referrals': 'Referrals',
      '/new-admin/subscriptions': 'Subscriptions',
      '/new-admin/sessions': 'Sessions',
      '/new-admin/events': 'Events',
      '/new-admin/insights': 'Insights',
      '/new-admin/major-match': 'AI Major Match',
      '/new-admin/administration': 'Administration',
      '/new-admin/community-moderation': 'Community Moderation',
      '/new-admin/organization-management': 'Organization Management',
      '/new-admin/contact-leads': 'Contact Leads',
    };
    const title = map[p] ?? 'Admin';
    return [{ title: 'Admin' }, { title }];
  }, [location.pathname]);

  const roleLabel = role === 'Owner' ? 'Owner' : role === 'SuperAdmin' ? 'Super Admin' : role ?? '—';

  const siderWidth = collapsed ? 72 : 248;

  return (
    <ConfigProvider theme={getAdminConsoleAntdTheme()}>
      <Layout className="admin-console-app" style={{ minHeight: '100vh' }}>
        <aside
          className={`admin-console-sider ${collapsed ? 'admin-console-sider--collapsed' : ''}`}
          style={{ width: siderWidth, flex: `0 0 ${siderWidth}px` }}
        >
          <div className="admin-console-sider-inner">
            <div className="admin-console-brand">
              <div className="admin-console-brand-mark">{collapsed ? 'T' : 'TopCoach'}</div>
              {!collapsed && <div className="admin-console-brand-sub">Admin console</div>}
            </div>

            <nav className="admin-console-nav" aria-label="Admin">
              {navGroups.map((group) => (
                <div key={group.id} className="admin-console-nav-group">
                  {!collapsed && (
                    <div className="admin-console-nav-group-label">{group.label}</div>
                  )}
                  {group.items.map((item) => {
                    const isActive = activeKey === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`admin-console-nav-item ${isActive ? 'admin-console-nav-item--active' : ''}`}
                        onClick={() => navigate(item.path)}
                        title={collapsed ? item.label : undefined}
                      >
                        <span className="admin-console-nav-item-icon">{item.icon}</span>
                        {!collapsed && (
                          <>
                            <span className="admin-console-nav-item-label">{item.label}</span>
                            {item.badge != null && (
                              <Badge count={item.badge} size="small" className="admin-console-nav-badge" />
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            <button
              type="button"
              className="admin-console-collapse-toggle"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft size={18} className={collapsed ? 'admin-console-collapse-toggle-icon--flipped' : ''} />
            </button>

            <div className="admin-console-user-footer">
              <div className="admin-console-user-avatar" title={actorDisplayName}>
                {initialsFromName(actorDisplayName)}
              </div>
              {!collapsed && (
                <div className="admin-console-user-meta">
                  <div className="admin-console-user-name">{actorDisplayName}</div>
                  <div className="admin-console-user-role">{roleLabel}</div>
                </div>
              )}
            </div>
          </div>
        </aside>

        <Layout className="admin-console-main">
          <Header className="admin-console-topbar">
            <div className="admin-console-topbar-left">
              <Breadcrumb className="admin-console-breadcrumb" items={breadcrumbItems} />
            </div>
            <div className="admin-console-topbar-center">
              <Input
                allowClear
                size="large"
                suffix={<SearchButton size={30} />}
                placeholder="Search users by name, email, username…"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onPressEnter={(e) => {
                  const v = (e.target as HTMLInputElement).value;
                  setGlobalSearch(v);
                  navigate(`/new-admin/users?q=${encodeURIComponent(v)}`);
                }}
                className="admin-console-global-search"
              />
            </div>
            <div className="admin-console-topbar-right">
              <Text className="admin-console-email" ellipsis style={{ color: 'var(--ac-text-secondary)' }}>
                {currentUserEmail}
              </Text>
              <Button type="primary" className="admin-console-exit-btn" onClick={() => navigate('/student-hub')}>
                Exit
              </Button>
            </div>
          </Header>

          <Content className="admin-console-content">
            <Suspense
              fallback={
                <div className="admin-console-suspense">
                  <Spin size="large" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
