import { Alert, Button, Card, Col, Empty, List, Row, Skeleton, Space, Spin, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Flag,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetAdminDashboardStatsQuery,
  useGetAdminSessionsOverviewQuery,
  useGetAdminSubscriptionStatsQuery,
  type AdminDashboardStats,
  type AdminSessionsOverview,
} from 'src/app/services/adminConsoleApi';
import { AcPill, type AcPillVariant } from '../components/AcPill';
import { avatarStyleForId, formatUZSShort, initialsFromName } from '../utils';
import './DashboardPage.scss';

const { Paragraph } = Typography;

type MentorType = AdminDashboardStats['topMentors'][number]['type'];
type MentorRow = AdminDashboardStats['topMentors'][number];
type FlagRow = AdminSessionsOverview['flagged'][number];
type UpcomingRow = AdminSessionsOverview['upcoming'][number];

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

/** Relative "3h ago" for past timestamps. */
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

/** Relative "in 2h" for future timestamps (falls back to "ago" form if past). */
function formatTimeUntil(iso: string): string {
  try {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff < 0) return formatRelativeTime(iso);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `in ${days}d`;
  } catch {
    return iso;
  }
}

function formatAbsoluteTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

type AttentionItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  to: string;
};

export default function AdminConsoleDashboardPage() {
  const navigate = useNavigate();
  const stats = useGetAdminDashboardStatsQuery();
  const overview = useGetAdminSessionsOverviewQuery();
  const subStats = useGetAdminSubscriptionStatsQuery();

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
      width: 140,
      render: (t: MentorType) => <AcPill variant={mentorTypeVariant(t)}>{t}</AcPill>,
    },
    {
      title: 'Sessions',
      dataIndex: 'sessions',
      key: 'sessions',
      width: 110,
      align: 'right' as const,
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      align: 'right' as const,
      render: (score: number) => (
        <span style={{ fontWeight: 700, color: scoreColor(score) }}>{score}%</span>
      ),
    },
  ];

  if (stats.isLoading) {
    // In-place skeletons instead of a full-page Spin — the page chrome paints
    // immediately and the layout matches the loaded state (no reflow on settle).
    return (
      <div className="ac-admin-page ac-dashboard-page">
        <h1 className="ac-page-title">Dashboard</h1>
        <p className="ac-page-lead">Operational snapshot — what needs attention right now.</p>
        <Row gutter={[16, 16]} className="ac-kpi-row ac-kpi-row--equal">
          {[0, 1, 2, 3].map((i) => (
            <Col key={i} xs={24} sm={12} xl={6}>
              <Card bordered={false} className="ac-kpi-card">
                <Skeleton active title={false} paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
        <Row gutter={[16, 16]} className="ac-dashboard-grid">
          <Col xs={24} lg={12}>
            <Card bordered={false} className="ac-panel ac-dashboard-panel">
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card bordered={false} className="ac-panel ac-dashboard-panel">
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          </Col>
          <Col xs={24}>
            <Card bordered={false} className="ac-panel">
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          </Col>
        </Row>
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
  const overviewKpis = overview.data?.kpis;
  const sub = subStats.data;

  // Active subscriptions KPI — the 4th column is always reserved (fixed xl={6})
  // so the row doesn't reflow from 3 to 4 cards when subscription stats settle.
  const activeSubs = sub ? (sub.byStatus.active ?? 0) + (sub.byStatus.trialing ?? 0) : null;
  const mrrMeta = sub && sub.mrrUzs > 0 ? `MRR ${formatUZSShort(sub.mrrUzs)}` : 'Active + trialing plans';

  const sessionsMeta = overviewKpis
    ? `${overviewKpis.upcomingCount.toLocaleString()} upcoming · ${overviewKpis.cancelledMonth.toLocaleString()} cancelled`
    : 'All programs combined';

  // Attention strip — subscription/session exceptions only (payments live on
  // the Payments page). Rendered as a slim full-width strip only when
  // something is actually wrong; failed queries just drop their chips.
  const attentionItems: AttentionItem[] = [
    ...(sub
      ? [
          {
            key: 'past-due',
            icon: <AlertTriangle size={15} />,
            label: 'Past-due subscriptions',
            count: sub.pastDueOverdue,
            color: '#f59e0b',
            to: '/new-admin/subscriptions',
          },
          {
            key: 'failed-charges',
            icon: <XCircle size={15} />,
            label: 'Failed charges (24h)',
            count: sub.failures24h,
            color: '#ef4444',
            to: '/new-admin/subscriptions',
          },
        ]
      : []),
    ...(overviewKpis
      ? [
          {
            key: 'flagged-sessions',
            icon: <Flag size={15} />,
            label: 'Flagged sessions this month',
            count: overviewKpis.flaggedMonth,
            color: '#f59e0b',
            to: '/new-admin/sessions',
          },
        ]
      : []),
  ].filter((item) => item.count > 0);

  const upcoming = (overview.data?.upcoming ?? []).slice(0, 5);
  const flags: FlagRow[] = (overview.data?.flagged?.length
    ? overview.data.flagged
    : recentSessionFlags.map((f) => ({ ...f, reason: null }))
  ).slice(0, 5);

  return (
    <div className="ac-admin-page ac-dashboard-page">
      <h1 className="ac-page-title">Dashboard</h1>
      <p className="ac-page-lead">Operational snapshot — what needs attention right now.</p>

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
            <div className="ac-kpi-meta">{sessionsMeta}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-blue">
            <div className="ac-kpi-label">Active subscriptions</div>
            {subStats.isLoading ? (
              <Skeleton active title={false} paragraph={{ rows: 2 }} />
            ) : (
              <>
                <div className="ac-kpi-value">{activeSubs !== null ? activeSubs.toLocaleString() : '—'}</div>
                <div className="ac-kpi-meta">{mrrMeta}</div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {(subStats.isLoading || overview.isLoading) && (
        // Reserve the strip's slot while the feeding queries load so it doesn't
        // pop in and push the grid down after the page has painted.
        <div className="ac-dashboard-attention-strip" aria-hidden>
          <Skeleton.Button active size="small" style={{ width: 150 }} />
          <Skeleton.Button active size="small" style={{ width: 230 }} />
          <Skeleton.Button active size="small" style={{ width: 200 }} />
        </div>
      )}
      {!subStats.isLoading && !overview.isLoading && attentionItems.length > 0 && (
        <div className="ac-dashboard-attention-strip" role="region" aria-label="Needs attention">
          <span className="ac-dashboard-attention-strip-label">
            <AlertTriangle size={14} /> Needs attention
          </span>
          {attentionItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className="ac-dashboard-attention-chip"
              onClick={() => navigate(item.to)}
              style={{ borderColor: `${item.color}55` }}
            >
              <span className="ac-dashboard-attention-chip-icon" style={{ color: item.color }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              <span
                className="ac-dashboard-attention-chip-count"
                style={{ background: `${item.color}22`, color: item.color }}
              >
                {item.count.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}

      <Row gutter={[16, 16]} className="ac-dashboard-grid">
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CalendarClock size={18} color="#94a3b8" />
                <span>Upcoming sessions</span>
              </Space>
            }
            bordered={false}
            className="ac-panel ac-dashboard-panel"
            extra={
              <Button type="link" onClick={() => navigate('/new-admin/sessions')} style={{ padding: 0 }}>
                All sessions <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
              </Button>
            }
          >
            {overview.isLoading ? (
              <div className="ac-dashboard-panel-spin">
                <Spin />
              </div>
            ) : overview.isError ? (
              <Alert type="warning" showIcon message="Could not load upcoming sessions." />
            ) : upcoming.length === 0 ? (
              <Empty description="No upcoming sessions scheduled" />
            ) : (
              <List<UpcomingRow>
                dataSource={upcoming}
                renderItem={(item) => (
                  <List.Item className="ac-dashboard-upcoming-item">
                    <div className="ac-dashboard-upcoming-when">
                      <div className="ac-dashboard-upcoming-relative">{formatTimeUntil(item.dateTime)}</div>
                      <div className="ac-dashboard-upcoming-absolute">{formatAbsoluteTime(item.dateTime)}</div>
                    </div>
                    <div className="ac-dashboard-upcoming-body">
                      <div className="ac-dashboard-upcoming-pair">
                        {item.studentName} <span className="ac-dashboard-upcoming-arrow">→</span> {item.mentorName}
                      </div>
                      <div className="ac-dashboard-upcoming-type">{item.type}</div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <Flag size={18} color="#94a3b8" />
                <span>Recent session flags</span>
              </Space>
            }
            bordered={false}
            className="ac-panel ac-dashboard-panel"
            extra={
              <Button type="link" onClick={() => navigate('/new-admin/sessions')} style={{ padding: 0 }}>
                View all <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
              </Button>
            }
          >
            {flags.length === 0 ? (
              <Empty description="No session flags yet" />
            ) : (
              <List<FlagRow>
                dataSource={flags}
                renderItem={(item) => (
                  <List.Item className="ac-dashboard-session-flag-item">
                    <div className="ac-dashboard-session-flag-body">
                      <div className="ac-dashboard-session-flag-title">
                        {item.title}
                        <span className="ac-dashboard-session-flag-time">{formatRelativeTime(item.time)}</span>
                      </div>
                      <div className="ac-dashboard-session-flag-pair">{item.pair}</div>
                      {item.reason && (
                        <div className="ac-dashboard-session-flag-reason">“{item.reason}”</div>
                      )}
                    </div>
                    <AcPill variant={item.tag === 'Cancel' ? 'danger' : 'warning'}>{item.tag}</AcPill>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24}>
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
              <Empty description="No completed sessions yet this month" />
            ) : (
              <Table<MentorRow>
                rowKey="id"
                columns={mentorColumns}
                dataSource={topMentors.slice(0, 5)}
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
    </div>
  );
}
