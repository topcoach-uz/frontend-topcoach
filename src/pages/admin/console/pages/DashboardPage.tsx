import { Alert, Button, Card, Col, Empty, List, Row, Space, Spin, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowRight, Building2, CalendarClock, CreditCard, Sparkles, Users as UsersIcon } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import {
  useGetAdminDashboardStatsQuery,
  useGetAdminSessionsOverviewQuery,
  type AdminDashboardStats,
} from 'src/app/services/adminConsoleApi';
import { AcPill, type AcPillVariant } from '../components/AcPill';
import { avatarStyleForId, formatUZS, initialsFromName } from '../utils';

const { Paragraph } = Typography;

type MentorType = AdminDashboardStats['topMentors'][number]['type'];
type MentorRow = AdminDashboardStats['topMentors'][number];
type FlagRow = AdminDashboardStats['recentSessionFlags'][number];

function mentorTypeVariant(t: MentorType): AcPillVariant {
  switch (t) {
    case 'Career': return 'cyan';
    case 'Tech': return 'blue';
    case 'Leadership': return 'purple';
    case 'Business': return 'amber';
    default: return 'neutral';
  }
}

function scoreColor(score: number) {
  if (score >= 95) return '#34d399';
  if (score >= 80) return '#fbbf24';
  return '#f87171';
}

function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

const CHART_TOOLTIP_STYLE = {
  background: '#12151d',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  color: '#f4f4f5',
};
const CHART_TOOLTIP_LABEL = { color: '#f4f4f5', fontWeight: 600 };
const CHART_TOOLTIP_ITEM = { color: '#e5e7eb' };

export default function AdminConsoleDashboardPage() {
  const navigate = useNavigate();
  const stats = useGetAdminDashboardStatsQuery();
  const overview = useGetAdminSessionsOverviewQuery();

  const mentorColumns: ColumnsType<MentorRow> = [
    {
      title: 'Mentor',
      key: 'mentor',
      render: (_, row) => (
        <div className="ac-user-cell">
          <div className="ac-avatar" style={avatarStyleForId(row.id)}>
            {initialsFromName(row.name)}
          </div>
          <div className="ac-user-cell-text">
            <div className="ac-user-cell-name">{row.name}</div>
            <div className="ac-user-cell-email">{row.roleLabel}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (t: MentorType) => <AcPill variant={mentorTypeVariant(t)}>{t}</AcPill>,
    },
    {
      title: 'Sessions',
      dataIndex: 'sessions',
      key: 'sessions',
      width: 90,
      align: 'right' as const,
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      align: 'right' as const,
      render: (score: number) => (
        <span style={{ fontWeight: 700, color: scoreColor(score) }}>{score}%</span>
      ),
    },
  ];

  if (stats.isLoading) {
    return (
      <div className="ac-admin-page">
        <div className="admin-console-suspense">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (stats.isError || !stats.data) {
    return (
      <div className="ac-admin-page">
        <h1 className="ac-page-title">Dashboard</h1>
        <Alert
          type="error"
          showIcon
          message="Failed to load dashboard"
          description={(stats.error as { status?: number })?.status
            ? `Server returned ${(stats.error as { status?: number }).status}.`
            : 'Check your connection or try again.'}
        />
      </div>
    );
  }

  const { kpis, recentSessionFlags, topMentors } = stats.data;
  const trend = overview.data?.monthlyTrend ?? [];
  const totalSessionsInTrend = trend.reduce((a, r) => a + r.completed + r.delayed + r.cancelled, 0);

  const quickActions = [
    {
      key: 'pending-payments',
      icon: <CreditCard size={20} />,
      label: 'Review pending payments',
      hint: `${kpis.pendingPaymentsCount} ${kpis.pendingPaymentsCount === 1 ? 'payout' : 'payouts'} waiting`,
      onClick: () => navigate('/new-admin/payments'),
      color: '#3b82f6',
      disabled: kpis.pendingPaymentsCount === 0,
    },
    {
      key: 'session-flags',
      icon: <CalendarClock size={20} />,
      label: 'Triage session flags',
      hint: `${recentSessionFlags.length} recent`,
      onClick: () => navigate('/new-admin/sessions'),
      color: '#fbbf24',
      disabled: recentSessionFlags.length === 0,
    },
    {
      key: 'manage-users',
      icon: <UsersIcon size={20} />,
      label: 'Manage users',
      hint: `${kpis.totalStudents.toLocaleString()} students · ${kpis.activeMentors} mentors`,
      onClick: () => navigate('/new-admin/users'),
      color: '#10b981',
      disabled: false,
    },
    {
      key: 'programs',
      icon: <Building2 size={20} />,
      label: 'Programs & enrollments',
      hint: 'Grant access, run analytics',
      onClick: () => navigate('/new-admin/programs/enrollments'),
      color: '#a78bfa',
      disabled: false,
    },
  ];

  return (
    <div className="ac-admin-page ac-dashboard-page">
      <h1 className="ac-page-title">Dashboard</h1>
      <p className="ac-page-lead">Operational snapshot of students, mentors, sessions, and payouts.</p>

      <Row gutter={[16, 16]} className="ac-kpi-row ac-kpi-row--equal">
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-green">
            <div className="ac-kpi-label">Total students</div>
            <div className="ac-kpi-value">{kpis.totalStudents.toLocaleString()}</div>
            <div className="ac-kpi-meta">Platform-wide student accounts</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-green">
            <div className="ac-kpi-label">Active mentors</div>
            <div className="ac-kpi-value">{kpis.activeMentors.toLocaleString()}</div>
            <div className="ac-kpi-meta">Accepted mentor profiles</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-amber">
            <div className="ac-kpi-label">Sessions this month</div>
            <div className="ac-kpi-value">{kpis.sessionsThisMonth.toLocaleString()}</div>
            <div className="ac-kpi-meta">All programs combined</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-blue">
            <div className="ac-kpi-label">Pending payouts</div>
            <div className="ac-kpi-value">{formatUZS(kpis.pendingPaymentsSum)}</div>
            <div className="ac-kpi-meta">
              Awaiting settlement across {kpis.pendingPaymentsCount} {kpis.pendingPaymentsCount === 1 ? 'transaction' : 'transactions'}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="ac-kpi-row--equal" style={{ marginBottom: 16 }}>
        {quickActions.map((a) => (
          <Col key={a.key} xs={24} sm={12} xl={6}>
            <Card
              bordered={false}
              hoverable={!a.disabled}
              className="ac-quick-action"
              onClick={a.disabled ? undefined : a.onClick}
              style={{ cursor: a.disabled ? 'default' : 'pointer', opacity: a.disabled ? 0.5 : 1 }}
            >
              <div className="ac-quick-action-head">
                <div className="ac-quick-action-icon" style={{ background: `${a.color}22`, color: a.color }}>
                  {a.icon}
                </div>
                <ArrowRight size={16} color="var(--ac-text-muted)" />
              </div>
              <div className="ac-quick-action-label">{a.label}</div>
              <div className="ac-quick-action-hint">{a.hint}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <CalendarClock size={18} color="#94a3b8" />
                <span>Recent session flags</span>
              </Space>
            }
            bordered={false}
            className="ac-panel"
            extra={
              <Button type="link" onClick={() => navigate('/new-admin/sessions')} style={{ padding: 0 }}>
                View all <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
              </Button>
            }
          >
            {recentSessionFlags.length === 0 ? (
              <Empty description="No session flags yet" />
            ) : (
              <List<FlagRow>
                dataSource={recentSessionFlags.slice(0, 6)}
                renderItem={(item) => (
                  <List.Item className="ac-dashboard-session-flag-item">
                    <div className="ac-dashboard-session-flag-body">
                      <div className="ac-dashboard-session-flag-title">{item.title}</div>
                      <div className="ac-dashboard-session-flag-pair">{item.pair}</div>
                      <div className="ac-dashboard-session-flag-time">{formatRelativeTime(item.time)}</div>
                    </div>
                    <AcPill variant={item.tag === 'Cancel' ? 'danger' : 'warning'}>{item.tag}</AcPill>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <Sparkles size={18} color="#94a3b8" />
                <span>Top performing mentors</span>
              </Space>
            }
            bordered={false}
            className="ac-panel"
            extra={
              <Button type="link" onClick={() => navigate('/new-admin/users?tab=mentors')} style={{ padding: 0 }}>
                View all <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
              </Button>
            }
          >
            {topMentors.length === 0 ? (
              <Empty description="No mentor activity this month" />
            ) : (
              <Table<MentorRow>
                rowKey="id"
                columns={mentorColumns}
                dataSource={topMentors}
                pagination={false}
                size="middle"
              />
            )}
            <Paragraph style={{ marginBottom: 0, marginTop: 10, fontSize: 12, color: 'var(--ac-text-muted)' }}>
              Ranked by completed sessions this month.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="ac-panel" title="Session trend — last 6 months" style={{ marginTop: 16 }}>
        {overview.isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : totalSessionsInTrend === 0 ? (
          <Empty description="No trend data yet" />
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={CHART_TOOLTIP_LABEL}
                  itemStyle={CHART_TOOLTIP_ITEM}
                  cursor={{ stroke: 'rgba(16,185,129,0.3)', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#dashTrend)"
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
