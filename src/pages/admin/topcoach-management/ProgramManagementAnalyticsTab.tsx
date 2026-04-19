import React, { useId, useMemo } from 'react';
import { Alert, Card, Col, Row, Select, Space, Spin, Statistic, Typography } from 'antd';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CheckCircle2,
  GraduationCap,
  LineChart as LineChartIcon,
  MessageCircle,
  TrendingUp,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { AcPill, type AcPillVariant } from 'src/pages/admin/console/components/AcPill';

const { Paragraph, Text } = Typography;

/** Which course enrollment stream analytics KPIs use (Admissions / SAT). Full Support is not included here. */
export type AnalyticsProgramScope = 'all' | 'admissions' | 'sat';

function scopeShortLabel(scope: AnalyticsProgramScope): string {
  if (scope === 'admissions') return 'Admissions';
  if (scope === 'sat') return 'SAT Prep';
  return 'Admissions + SAT';
}

function scopeEnrollmentPhrase(scope: AnalyticsProgramScope): string {
  if (scope === 'all') return 'Admissions and SAT Prep course enrollments (combined)';
  if (scope === 'admissions') return 'Admissions course enrollments only';
  return 'SAT Prep course enrollments only';
}

export type ProgramManagementAnalyticsTabProps = {
  analyticsData: any;
  analyticsLoading: boolean;
  embedInAdminConsole: boolean;
  chartData: { month: string; users: number; mentors: number }[];
  programScope: AnalyticsProgramScope;
  onProgramScopeChange: (scope: AnalyticsProgramScope) => void;
};

function pillTelegram(status: string | null): AcPillVariant {
  const s = (status || '').toLowerCase();
  if (s === 'connected') return 'mint';
  if (s === 'pending') return 'warning';
  if (s === 'failed') return 'danger';
  return 'neutral';
}

function sumCounts(rows: { count: number }[] | undefined): number {
  return rows?.reduce((s, r) => s + (Number(r.count) || 0), 0) ?? 0;
}

function chartTooltipStyle(embed: boolean) {
  return embed
    ? {
        backgroundColor: '#12151d',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 8,
        color: '#f4f4f5',
      }
    : {
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: 4,
        padding: 8,
      };
}

export const chartTooltipCommonProps = (embed: boolean) => ({
  contentStyle: chartTooltipStyle(embed),
  labelStyle: { color: embed ? '#f4f4f5' : '#111', fontWeight: 600 },
  itemStyle: { color: embed ? '#e5e7eb' : '#333' },
  cursor: embed ? { fill: 'rgba(16,185,129,0.08)' } : { fill: 'rgba(0,0,0,0.04)' },
});

function axisColor(embed: boolean) {
  return embed ? '#94a3b8' : '#666';
}

function gridColor(embed: boolean) {
  return embed ? 'rgba(255, 255, 255, 0.08)' : '#f0f0f0';
}

function CardTitleWithNote({ title, note }: { title: string; note: string }) {
  return (
    <div>
      <div>{title}</div>
      <Text type="secondary" style={{ fontSize: 11, fontWeight: 400, display: 'block', marginTop: 2 }}>
        {note}
      </Text>
    </div>
  );
}

export default function ProgramManagementAnalyticsTab({
  analyticsData,
  analyticsLoading,
  embedInAdminConsole,
  chartData,
  programScope,
  onProgramScopeChange,
}: ProgramManagementAnalyticsTabProps) {
  const enrollGradientId = `${useId().replace(/:/g, '')}-enrollFill`;
  const scopeShort = scopeShortLabel(programScope);
  const scopePhrase = scopeEnrollmentPhrase(programScope);

  const derived = useMemo(() => {
    if (!analyticsData) return null;
    const userSignups12m = sumCounts(analyticsData.userSignups);
    const mentorSignups12m = sumCounts(analyticsData.mentorSignups);
    const enrollments12m = sumCounts(analyticsData.enrollmentsPerMonth);
    const telegramLinked = sumCounts(analyticsData.telegramStatusBreakdown);

    let peakMonth = '';
    let peakUsers = 0;
    chartData.forEach((d) => {
      if (d.users > peakUsers) {
        peakUsers = d.users;
        peakMonth = d.month;
      }
    });

    const accessRate =
      analyticsData.totalUsers > 0
        ? ((analyticsData.studentsWithAccess / analyticsData.totalUsers) * 100).toFixed(1)
        : '0';

    const enrollmentPie =
      analyticsData.enrollmentStatusBreakdown?.map((item: { status: string; count: number }, i: number) => ({
        name: String(item.status ?? '—').replace(/_/g, ' '),
        value: item.count,
        fill: ['#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#94a3b8'][i % 6],
      })) ?? [];

    const coursePie =
      analyticsData.courseTypeBreakdown?.map(
        (item: { courseType: string; count: number }, i: number) => ({
          name: String(item.courseType ?? '—').toUpperCase(),
          value: item.count,
          fill: ['#34d399', '#38bdf8', '#fbbf24', '#c084fc'][i % 4],
        }),
      ) ?? [];

    const enrollmentTrend =
      analyticsData.enrollmentsPerMonth?.map((item: { month: string; count: number }) => ({
        month: item.month,
        enrollments: item.count,
      })) ?? [];

    const telegramBars =
      analyticsData.telegramStatusBreakdown?.map((item: { telegramStatus: string; count: number }) => ({
        status: String(item.telegramStatus ?? 'unknown').replace(/_/g, ' '),
        count: item.count,
      })) ?? [];

    return {
      userSignups12m,
      mentorSignups12m,
      enrollments12m,
      telegramLinked,
      peakMonth,
      peakUsers,
      accessRate,
      enrollmentPie,
      coursePie,
      enrollmentTrend,
      telegramBars,
    };
  }, [analyticsData, chartData]);

  const rowDivider = (isLast: boolean) =>
    embedInAdminConsole
      ? isLast
        ? 'none'
        : '1px solid var(--ac-border)'
      : isLast
        ? 'none'
        : '1px solid #f0f0f0';

  const emptyMuted = embedInAdminConsole ? 'var(--ac-text-muted)' : '#999';

  const statTitleStyle = embedInAdminConsole ? ({ color: 'var(--ac-text-muted)' } as const) : undefined;
  const statValueStyle = embedInAdminConsole
    ? ({ color: 'var(--ac-text)', fontSize: 22, fontWeight: 700 } as const)
    : { fontSize: '24px' };

  if (analyticsLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          gap: 16,
          textAlign: 'center',
        }}
      >
        <Spin size="large" />
        <Text type="secondary">Loading analytics…</Text>
      </div>
    );
  }

  if (!analyticsData) {
    return <Alert message="No analytics data available" type="info" showIcon />;
  }

  const d = derived!;

  return (
    <div className="tc-program-mgmt-analytics">
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: embedInAdminConsole ? 12 : 16 }}>
        <Col xs={24} lg={14}>
          <Text style={{ color: embedInAdminConsole ? 'var(--ac-text-secondary)' : undefined, fontSize: 13 }}>
            <strong>Enrollment, progress, access, and course-type charts</strong> follow the scope below (
            {scopePhrase}). <strong>Full Support</strong> is excluded from these aggregates — use the Full Support tab
            and per-row data under Users &amp; enrollments.
          </Text>
        </Col>
        <Col xs={24} lg={10} style={{ textAlign: embedInAdminConsole ? 'left' : 'right' }}>
          <Space wrap align="center">
            <Text type="secondary">Analytics scope (Admissions / SAT)</Text>
            <Select<AnalyticsProgramScope>
              value={programScope}
              onChange={onProgramScopeChange}
              style={{ minWidth: 220 }}
              options={[
                { value: 'all', label: 'Admissions + SAT (combined)' },
                { value: 'admissions', label: 'Admissions only' },
                { value: 'sat', label: 'SAT Prep only' },
              ]}
            />
          </Space>
        </Col>
      </Row>

      {embedInAdminConsole && (
        <Paragraph style={{ marginBottom: 20, color: 'var(--ac-text-secondary)', maxWidth: 900 }}>
          Source: <Text code>/program-dashboard/analytics</Text> (optional <Text code>courseName</Text> filter). User and
          mentor signups plus Telegram counts are <Text strong>platform-wide</Text>. Pair with{' '}
          <Text strong>Users &amp; enrollments</Text> for row-level Admissions, SAT Prep, and Full Support.
        </Paragraph>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={<span style={statTitleStyle}>Total users (directory)</span>}
              value={analyticsData.totalUsers}
              prefix={<User size={16} style={{ opacity: 0.85 }} />}
              valueStyle={statValueStyle}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              Platform-wide accounts (not filtered by program)
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={<span style={statTitleStyle}>Paid enrollments (completed)</span>}
              value={analyticsData.studentsWithAccess}
              prefix={<CheckCircle2 size={16} style={{ color: embedInAdminConsole ? '#34d399' : '#3f8600' }} />}
              valueStyle={{
                ...statValueStyle,
                color: embedInAdminConsole ? '#6ee7b7' : '#3f8600',
              }}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              {scopeShort}: payment completed + enrollment status completed (excludes Full Support)
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={<span style={statTitleStyle}>Avg. course progress ({scopeShort})</span>}
              value={analyticsData.averageProgress}
              suffix="%"
              precision={1}
              prefix={<TrendingUp size={16} style={{ color: embedInAdminConsole ? '#60a5fa' : '#1890ff' }} />}
              valueStyle={{
                ...statValueStyle,
                color: embedInAdminConsole ? '#93c5fd' : '#1890ff',
              }}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              Mean completion for up to 100 learners with completed access in {scopeShort} (not Full Support)
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={<span style={statTitleStyle}>Access rate ({scopeShort})</span>}
              value={d.accessRate}
              suffix="%"
              prefix={<GraduationCap size={16} style={{ color: embedInAdminConsole ? '#c084fc' : '#722ed1' }} />}
              valueStyle={{
                ...statValueStyle,
                color: embedInAdminConsole ? '#d8b4fe' : '#722ed1',
              }}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              Completed paid {scopeShort} course enrollments ÷ all directory users (platform denominator)
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={<span style={statTitleStyle}>User signups (12 mo)</span>}
              value={d.userSignups12m}
              prefix={<UserPlus size={16} />}
              valueStyle={statValueStyle}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              Platform-wide new user accounts (not scoped to a single program)
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={<span style={statTitleStyle}>Mentor signups (12 mo)</span>}
              value={d.mentorSignups12m}
              prefix={<Users size={16} />}
              valueStyle={statValueStyle}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              Platform-wide mentor-role accounts (not Admissions / SAT / Full Support filtered)
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={<span style={statTitleStyle}>New enrollments (12 mo, {scopeShort})</span>}
              value={d.enrollments12m}
              prefix={<LineChartIcon size={16} />}
              valueStyle={statValueStyle}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              {scopeShort} course enrollment rows created (any status; excludes Full Support)
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={<span style={statTitleStyle}>Telegram profiles</span>}
              value={d.telegramLinked}
              prefix={<MessageCircle size={16} />}
              valueStyle={statValueStyle}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              Platform-wide users with a Telegram status set
            </Text>
          </Card>
        </Col>
      </Row>

      {d.peakMonth ? (
        <Card size="small" style={{ marginTop: 16, marginBottom: 8 }} bordered={false}>
          <Text type="secondary">
            Peak user signup month (platform-wide): <Text strong>{d.peakMonth}</Text> (
            {d.peakUsers.toLocaleString()} users)
          </Text>
        </Card>
      ) : null}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <CardTitleWithNote
                title="User & mentor signups (last 12 months)"
                note="Platform-wide new accounts — not filtered by Admissions / SAT / Full Support."
              />
            }
          >
            <div style={{ minHeight: 380, padding: '8px 0' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 24, right: 48, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor(embedInAdminConsole)} />
                    <XAxis
                      dataKey="month"
                      stroke={axisColor(embedInAdminConsole)}
                      tick={{ fill: axisColor(embedInAdminConsole), fontSize: 11 }}
                      angle={-35}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke={axisColor(embedInAdminConsole)}
                      tick={{ fill: axisColor(embedInAdminConsole), fontSize: 11 }}
                      tickFormatter={(v) => Number(v).toLocaleString()}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={axisColor(embedInAdminConsole)}
                      tick={{ fill: axisColor(embedInAdminConsole), fontSize: 11 }}
                      tickFormatter={(v) => Number(v).toLocaleString()}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name === 'users' ? 'Users' : 'Mentors',
                      ]}
                      labelFormatter={(label) => `Month: ${label}`}
                      {...chartTooltipCommonProps(embedInAdminConsole)}
                    />
                    <Legend
                      verticalAlign="top"
                      wrapperStyle={{
                        paddingBottom: 12,
                        color: embedInAdminConsole ? 'var(--ac-text-secondary)' : undefined,
                      }}
                      formatter={(value) => (value === 'users' ? 'Users' : 'Mentors')}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="users"
                      stroke={embedInAdminConsole ? '#60a5fa' : '#1890ff'}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="users"
                      animationDuration={600}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="mentors"
                      stroke={embedInAdminConsole ? '#34d399' : '#52c41a'}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="mentors"
                      animationDuration={600}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: emptyMuted }}>No signup data</div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <CardTitleWithNote
                title="Enrollments per month"
                note={`${scopeShort} course enrollments created each month (excludes Full Support).`}
              />
            }
          >
            <div style={{ minHeight: 380 }}>
              {d.enrollmentTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart data={d.enrollmentTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={enrollGradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor(embedInAdminConsole)} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: axisColor(embedInAdminConsole), fontSize: 10 }}
                      stroke={axisColor(embedInAdminConsole)}
                    />
                    <YAxis
                      tick={{ fill: axisColor(embedInAdminConsole), fontSize: 10 }}
                      stroke={axisColor(embedInAdminConsole)}
                      allowDecimals={false}
                    />
                    <Tooltip {...chartTooltipCommonProps(embedInAdminConsole)} />
                    <Area
                      type="monotone"
                      dataKey="enrollments"
                      stroke="#10b981"
                      fill={`url(#${enrollGradientId})`}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: emptyMuted }}>No enrollment trend</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <CardTitleWithNote
                title="Enrollment status (paid cohort)"
                note={`Paid ${scopeShort} rows: status distribution within completed-payment enrollments (excludes Full Support).`}
              />
            }
          >
            <div style={{ minHeight: 280 }}>
              {d.enrollmentPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={d.enrollmentPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={88}
                      paddingAngle={2}
                    >
                      {d.enrollmentPie.map((entry: { fill: string }, i: number) => (
                        <Cell key={i} fill={entry.fill} stroke={embedInAdminConsole ? 'rgba(0,0,0,0.25)' : '#fff'} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltipCommonProps(embedInAdminConsole)} />
                    <Legend
                      wrapperStyle={{ color: embedInAdminConsole ? 'var(--ac-text-secondary)' : undefined }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: emptyMuted }}>No data</div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <CardTitleWithNote
                title="Course type mix"
                note={
                  programScope === 'sat'
                    ? 'SAT Prep rows typically have no standard/premium tier; chart may be sparse.'
                    : 'Standard vs premium counts for Admissions enrollments in the selected scope (SAT rows often N/A).'
                }
              />
            }
          >
            <div style={{ minHeight: 280 }}>
              {d.coursePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={d.coursePie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={88}
                      paddingAngle={2}
                    >
                      {d.coursePie.map((entry: { fill: string }, i: number) => (
                        <Cell key={i} fill={entry.fill} stroke={embedInAdminConsole ? 'rgba(0,0,0,0.25)' : '#fff'} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltipCommonProps(embedInAdminConsole)} />
                    <Legend
                      wrapperStyle={{ color: embedInAdminConsole ? 'var(--ac-text-secondary)' : undefined }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: emptyMuted }}>No data</div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <CardTitleWithNote
                title="Telegram status volume"
                note="Platform-wide Telegram linkage — not filtered by course."
              />
            }
          >
            <div style={{ minHeight: 280 }}>
              {d.telegramBars.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart layout="vertical" data={d.telegramBars} margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor(embedInAdminConsole)} />
                    <XAxis type="number" tick={{ fill: axisColor(embedInAdminConsole) }} stroke={axisColor(embedInAdminConsole)} />
                    <YAxis
                      type="category"
                      dataKey="status"
                      width={100}
                      tick={{ fill: axisColor(embedInAdminConsole), fontSize: 11 }}
                      stroke={axisColor(embedInAdminConsole)}
                    />
                    <Tooltip {...chartTooltipCommonProps(embedInAdminConsole)} />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: emptyMuted }}>No data</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <CardTitleWithNote
                title="Course type (detail)"
                note={`${scopeShort} enrollments: standard/premium mainly applies to Admissions.`}
              />
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {analyticsData.courseTypeBreakdown?.length > 0 ? (
                analyticsData.courseTypeBreakdown.map(
                  (item: { courseType: string; count: number }, index: number) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: rowDivider(index >= analyticsData.courseTypeBreakdown.length - 1),
                      }}
                    >
                      <AcPill variant={item.courseType === 'premium' ? 'amber' : 'cyan'}>
                        {String(item.courseType ?? '—').toUpperCase()}
                      </AcPill>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{item.count.toLocaleString()}</span>
                    </div>
                  ),
                )
              ) : (
                <Text type="secondary">No course type rows</Text>
              )}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <CardTitleWithNote title="Telegram (detail)" note="Platform-wide Telegram states (all programs)." />
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {analyticsData.telegramStatusBreakdown?.length > 0 ? (
                analyticsData.telegramStatusBreakdown.map(
                  (item: { telegramStatus: string; count: number }, index: number) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: rowDivider(index >= analyticsData.telegramStatusBreakdown.length - 1),
                      }}
                    >
                      <AcPill variant={pillTelegram(item.telegramStatus)}>
                        {String(item.telegramStatus ?? '—').toUpperCase()}
                      </AcPill>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{item.count.toLocaleString()}</span>
                    </div>
                  ),
                )
              ) : (
                <Text type="secondary">No Telegram rows</Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title={
              <CardTitleWithNote
                title="Monthly enrollment volume (bar)"
                note={`${scopeShort} course enrollment rows created per month (excludes Full Support).`}
              />
            }
          >
            <div style={{ minHeight: 320 }}>
              {analyticsData.enrollmentsPerMonth?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.enrollmentsPerMonth} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor(embedInAdminConsole)} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: axisColor(embedInAdminConsole), fontSize: 11 }}
                      stroke={axisColor(embedInAdminConsole)}
                    />
                    <YAxis
                      tick={{ fill: axisColor(embedInAdminConsole), fontSize: 11 }}
                      stroke={axisColor(embedInAdminConsole)}
                      allowDecimals={false}
                    />
                    <Tooltip {...chartTooltipCommonProps(embedInAdminConsole)} />
                    <Bar
                      dataKey="count"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      name={`${scopeShort} course enrollments`}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: emptyMuted }}>No data</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
