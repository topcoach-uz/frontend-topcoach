import { Alert, Card, Col, Empty, Row, Spin } from 'antd';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useGetAdminSessionsOverviewQuery } from 'src/app/services/adminConsoleApi';

export default function AdminConsoleInsightsPage() {
  const { data, isLoading, isError, error } = useGetAdminSessionsOverviewQuery();

  const trend = useMemo(() => data?.monthlyTrend ?? [], [data?.monthlyTrend]);

  const totals = useMemo(() => {
    const completed = trend.reduce((a, r) => a + r.completed, 0);
    const delayed = trend.reduce((a, r) => a + r.delayed, 0);
    const cancelled = trend.reduce((a, r) => a + r.cancelled, 0);
    const sessions = completed + delayed + cancelled;
    const completionRate = sessions > 0 ? Math.round((completed / sessions) * 1000) / 10 : 0;
    const cancellationRate = sessions > 0 ? Math.round((cancelled / sessions) * 1000) / 10 : 0;
    return { completed, delayed, cancelled, sessions, completionRate, cancellationRate };
  }, [trend]);

  const lineData = useMemo(
    () => trend.map((r) => ({ m: r.month, sessions: r.completed + r.delayed + r.cancelled })),
    [trend],
  );

  if (isLoading) {
    return (
      <div className="ac-admin-page">
        <div className="admin-console-suspense">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="ac-admin-page">
        <h1 className="ac-page-title">Insights</h1>
        <Alert
          type="error"
          showIcon
          message="Failed to load insights"
          description={(error as { status?: number })?.status
            ? `Server returned ${(error as { status?: number }).status}.`
            : 'Check your connection and retry.'}
        />
      </div>
    );
  }

  return (
    <div className="ac-admin-page">
      <h1 className="ac-page-title">Insights</h1>
      <p className="ac-page-lead">Session analytics across the last 6 months.</p>

      <Row gutter={[16, 16]} className="ac-kpi-row">
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-green">
            <div className="ac-kpi-label">Session completion</div>
            <div className="ac-kpi-value">{totals.completionRate}%</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-amber">
            <div className="ac-kpi-label">Delayed sessions</div>
            <div className="ac-kpi-value">{totals.delayed.toLocaleString()}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-red">
            <div className="ac-kpi-label">Cancellation rate</div>
            <div className="ac-kpi-value">{totals.cancellationRate}%</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-blue">
            <div className="ac-kpi-label">Total sessions (6mo)</div>
            <div className="ac-kpi-value">{totals.sessions.toLocaleString()}</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} className="ac-panel" title="Monthly session volume">
            {lineData.length === 0 ? (
              <Empty description="No session data yet" />
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={lineData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="m" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ background: '#12151d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
                      labelStyle={{ color: '#f4f4f5', fontWeight: 600 }}
                      itemStyle={{ color: '#e5e7eb' }}
                      cursor={{ fill: 'rgba(16,185,129,0.08)' }}
                    />
                    <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} className="ac-panel" title="Status breakdown (6mo)">
            {trend.length === 0 ? (
              <Empty description="No data yet" />
            ) : (
              <div style={{ width: '100%', height: 300 }}>
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
      </Row>
    </div>
  );
}
