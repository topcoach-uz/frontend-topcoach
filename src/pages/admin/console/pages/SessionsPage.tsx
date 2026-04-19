import {
  Alert,
  Card,
  Col,
  Empty,
  Input,
  List,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CalendarClock, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  useGetAdminSessionsOverviewQuery,
  type AdminSessionsOverview,
} from 'src/app/services/adminConsoleApi';
import { AcPill, type AcPillVariant } from '../components/AcPill';

const { Paragraph } = Typography;

type UpcomingRow = AdminSessionsOverview['upcoming'][number];
type FlagRow = AdminSessionsOverview['flagged'][number];
type TagFilter = 'all' | 'Cancel' | 'Delay';

function formatDateTime(iso: string) {
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

function formatRelative(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return iso;
  }
}

function typePillVariant(t: string): AcPillVariant {
  const s = (t || '').toLowerCase();
  if (s.includes('30')) return 'cyan';
  if (s.includes('60')) return 'blue';
  if (s.includes('group')) return 'purple';
  return 'neutral';
}

export default function AdminConsoleSessionsPage() {
  const { data, isLoading, isError, error } = useGetAdminSessionsOverviewQuery();

  const [upcomingSearch, setUpcomingSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<TagFilter>('all');

  const upcoming = data?.upcoming ?? [];
  const flagged = data?.flagged ?? [];
  const trend = data?.monthlyTrend ?? [];
  const kpis = data?.kpis;

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    upcoming.forEach((s) => set.add(s.type));
    return [{ value: 'all', label: 'All types' }, ...[...set].sort().map((v) => ({ value: v, label: v }))];
  }, [upcoming]);

  const filteredUpcoming = useMemo(() => {
    const s = upcomingSearch.trim().toLowerCase();
    return upcoming.filter((row) => {
      if (typeFilter !== 'all' && row.type !== typeFilter) return false;
      if (s) {
        const hay = `${row.mentorName} ${row.studentName} ${row.type}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [upcoming, upcomingSearch, typeFilter]);

  const filteredFlagged = useMemo(
    () => (tagFilter === 'all' ? flagged : flagged.filter((r) => r.tag === tagFilter)),
    [flagged, tagFilter],
  );

  const statusMix = useMemo(() => {
    const completed = trend.reduce((a, r) => a + r.completed, 0);
    const delayed = trend.reduce((a, r) => a + r.delayed, 0);
    const cancelled = trend.reduce((a, r) => a + r.cancelled, 0);
    return [
      { name: 'Completed', value: completed, fill: '#10b981' },
      { name: 'Delayed', value: delayed, fill: '#fbbf24' },
      { name: 'Cancelled', value: cancelled, fill: '#ef4444' },
    ];
  }, [trend]);

  const totalInMix = statusMix.reduce((a, r) => a + r.value, 0);
  const healthRate = totalInMix > 0 ? Math.round((statusMix[0]!.value / totalInMix) * 1000) / 10 : 0;

  const upcomingColumns: ColumnsType<UpcomingRow> = [
    {
      title: 'When',
      dataIndex: 'dateTime',
      key: 'dateTime',
      width: 180,
      render: (iso: string) => formatDateTime(iso),
    },
    { title: 'Mentor', dataIndex: 'mentorName', key: 'mentorName' },
    { title: 'Student', dataIndex: 'studentName', key: 'studentName' },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 160,
      render: (t: string) => <AcPill variant={typePillVariant(t)}>{t}</AcPill>,
    },
  ];

  if (isLoading) {
    return (
      <div className="ac-admin-page">
        <div className="admin-console-suspense">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (isError || !data || !kpis) {
    return (
      <div className="ac-admin-page">
        <h1 className="ac-page-title">Sessions</h1>
        <Alert
          type="error"
          showIcon
          message="Failed to load sessions"
          description={(error as { status?: number })?.status
            ? `Server returned ${(error as { status?: number }).status}.`
            : 'Check your connection and retry.'}
        />
      </div>
    );
  }

  return (
    <div className="ac-admin-page">
      <h1 className="ac-page-title">Sessions</h1>
      <p className="ac-page-lead">Session health, cancellations, and upcoming schedule.</p>

      <Row gutter={[16, 16]} className="ac-kpi-row">
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-blue">
            <div className="ac-kpi-label">Upcoming</div>
            <div className="ac-kpi-value">{kpis.upcomingCount.toLocaleString()}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-green">
            <div className="ac-kpi-label">Completed this month</div>
            <div className="ac-kpi-value">{kpis.completedMonth.toLocaleString()}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-amber">
            <div className="ac-kpi-label">Flagged this month</div>
            <div className="ac-kpi-value">{kpis.flaggedMonth.toLocaleString()}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-red">
            <div className="ac-kpi-label">Cancelled this month</div>
            <div className="ac-kpi-value">{kpis.cancelledMonth.toLocaleString()}</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="ac-stat-tile">
            <div className="ac-stat-tile-title">Completion rate (6 mo)</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#34d399' }}>{healthRate}%</div>
            <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
              Completed over completed+delayed+cancelled.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="ac-stat-tile">
            <div className="ac-stat-tile-title">Total sessions (6 mo)</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ac-text)' }}>
              {totalInMix.toLocaleString()}
            </div>
            <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
              Across all mentors and programs.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="ac-stat-tile">
            <div className="ac-stat-tile-title">Flag ratio (this month)</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>
              {kpis.completedMonth + kpis.flaggedMonth > 0
                ? Math.round((kpis.flaggedMonth / (kpis.completedMonth + kpis.flaggedMonth)) * 1000) / 10
                : 0}
              %
            </div>
            <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
              Delay + cancel share vs completed.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} className="ac-panel" title="Session trend — last 6 months">
            {trend.length === 0 ? (
              <Empty description="No trend data yet" />
            ) : (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ background: '#12151d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
                      labelStyle={{ color: '#f4f4f5', fontWeight: 600 }}
                      itemStyle={{ color: '#e5e7eb' }}
                      cursor={{ fill: 'rgba(16,185,129,0.08)' }}
                    />
                    <Legend wrapperStyle={{ color: 'var(--ac-text-secondary)' }} />
                    <Bar dataKey="completed" stackId="a" fill="#10b981" />
                    <Bar dataKey="delayed" stackId="a" fill="#fbbf24" />
                    <Bar dataKey="cancelled" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} className="ac-panel" title="Status mix (6 mo)">
            {totalInMix === 0 ? (
              <Empty description="No data yet" />
            ) : (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusMix}
                      dataKey="value"
                      nameKey="name"
                      cx="40%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={2}
                    >
                      {statusMix.map((e) => (
                        <Cell key={e.name} fill={e.fill} stroke="rgba(15,23,42,0.35)" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1b1e2a', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ color: 'var(--ac-text-secondary)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="ac-panel" title={`Upcoming sessions (${upcoming.length})`} style={{ marginTop: 16 }}>
        <div className="ac-directory-toolbar" style={{ marginBottom: 12 }}>
          <Input
            allowClear
            size="large"
            placeholder="Search mentor, student, type"
            prefix={<Search size={18} style={{ opacity: 0.45 }} />}
            value={upcomingSearch}
            onChange={(e) => setUpcomingSearch(e.target.value)}
            className="ac-directory-search"
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ minWidth: 160 }}
            options={typeOptions}
          />
        </div>
        {filteredUpcoming.length === 0 ? (
          <Empty description="No upcoming sessions match the filters" />
        ) : (
          <Table<UpcomingRow>
            rowKey="id"
            columns={upcomingColumns}
            dataSource={filteredUpcoming}
            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
            size="middle"
          />
        )}
      </Card>

      <Card
        title={
          <Space>
            <CalendarClock size={18} color="#94a3b8" />
            <span>Session flags ({flagged.length})</span>
          </Space>
        }
        bordered={false}
        className="ac-panel"
        extra={
          <Segmented
            size="small"
            value={tagFilter}
            onChange={(v) => setTagFilter(v as TagFilter)}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Cancel', value: 'Cancel' },
              { label: 'Delay', value: 'Delay' },
            ]}
          />
        }
        style={{ marginTop: 16 }}
      >
        {filteredFlagged.length === 0 ? (
          <Empty description="No flags match the filter" />
        ) : (
          <List<FlagRow>
            dataSource={filteredFlagged}
            renderItem={(item) => (
              <List.Item className="ac-dashboard-session-flag-item">
                <div className="ac-dashboard-session-flag-body">
                  <div className="ac-dashboard-session-flag-title">{item.title}</div>
                  <div className="ac-dashboard-session-flag-pair">{item.pair}</div>
                  <div className="ac-dashboard-session-flag-time">{formatRelative(item.time)}</div>
                </div>
                <AcPill variant={item.tag === 'Cancel' ? 'danger' : 'warning'}>{item.tag}</AcPill>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
