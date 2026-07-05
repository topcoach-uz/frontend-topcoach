import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Col, Empty, Row, Select, Skeleton, Spin } from 'antd';
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
import { api } from 'src/app/api';
import {
  useGetAdminSessionsOverviewQuery,
  useGetAdminSubscriptionStatsQuery,
} from 'src/app/services/adminConsoleApi';
import type { AdminSubscriptionStatus } from 'src/app/services/adminConsoleApi';
import './InsightsPage.scss';

/** Which course enrollment stream the enrollment KPIs use (Admissions / SAT). Full Support is not included here. */
export type AnalyticsProgramScope = 'all' | 'admissions' | 'sat';

function scopeShortLabel(scope: AnalyticsProgramScope): string {
  if (scope === 'admissions') return 'Admissions';
  if (scope === 'sat') return 'SAT Prep';
  return 'Admissions + SAT';
}

/* One chart system: console palette, muted grid, dark tooltip — shared by every chart on the page. */
const SERIES = {
  primary: '#10b981',
  secondary: '#3b82f6',
  warn: '#f59e0b',
  danger: '#ef4444',
};

const GRID_STROKE = 'rgba(255,255,255,0.08)';
const AXIS_COLOR = '#94a3b8';
const AXIS_TICK = { fill: AXIS_COLOR, fontSize: 11 };

const TOOLTIP_PROPS = {
  contentStyle: { background: '#12151d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 },
  labelStyle: { color: '#f4f4f5', fontWeight: 600 },
  itemStyle: { color: '#e5e7eb' },
  cursor: { fill: 'rgba(16,185,129,0.08)' },
};

const LEGEND_STYLE = { color: 'var(--ac-text-secondary)' };

function enrollmentStatusFill(status: string, index: number): string {
  const s = status.toLowerCase();
  if (s === 'completed') return SERIES.primary;
  if (s === 'pending') return SERIES.warn;
  if (s === 'failed') return SERIES.danger;
  if (s === 'cancelled') return '#f87171';
  return [SERIES.secondary, '#a78bfa', '#94a3b8'][index % 3];
}

const COURSE_PIE_FILLS = [SERIES.primary, SERIES.secondary, SERIES.warn, '#a78bfa'];

/* Fixed display order + colors for the subscriptions-by-status chart. */
const SUBSCRIPTION_STATUS_META: { key: AdminSubscriptionStatus; label: string; fill: string }[] = [
  { key: 'active', label: 'Active', fill: SERIES.primary },
  { key: 'trialing', label: 'Trialing', fill: SERIES.secondary },
  { key: 'pending', label: 'Pending', fill: SERIES.warn },
  { key: 'past_due', label: 'Past due', fill: SERIES.danger },
  { key: 'canceled', label: 'Canceled', fill: '#f87171' },
  { key: 'expired', label: 'Expired', fill: '#94a3b8' },
];

/** Local UZS formatter — mirrors the console-wide convention (integer UZS, thousand-separated). */
function formatUZS(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return 'UZS 0';
  return `UZS ${Math.round(n).toLocaleString('en-US')}`;
}

type MonthCount = { month: string; count: number };

/** Response shape of GET /program-dashboard/analytics (see program-dashboard module). */
type ProgramAnalyticsData = {
  totalUsers: number;
  studentsWithAccess: number;
  averageProgress: number;
  userSignups?: MonthCount[];
  mentorSignups?: MonthCount[];
  enrollmentsPerMonth?: MonthCount[];
  enrollmentStatusBreakdown?: { status: string; count: number }[];
  courseTypeBreakdown?: { courseType: string; count: number }[];
  telegramStatusBreakdown?: { telegramStatus: string; count: number }[];
};

function sumCounts(rows: { count: number }[] | undefined): number {
  return rows?.reduce((s, r) => s + (Number(r.count) || 0), 0) ?? 0;
}

function KpiCard({
  accent,
  label,
  value,
  note,
  noteTone,
}: {
  accent: 'green' | 'amber' | 'red' | 'blue';
  label: string;
  value: string;
  note?: string;
  noteTone?: 'danger';
}) {
  return (
    <Card bordered={false} className={`ac-kpi-card ac-kpi-card--accent-${accent}`}>
      <div className="ac-kpi-label">{label}</div>
      <div className="ac-kpi-value">{value}</div>
      {note ? <div className={`ac-kpi-meta${noteTone === 'danger' ? ' ac-kpi-meta--danger' : ''}`}>{note}</div> : null}
    </Card>
  );
}

/** Card title with a one-line hint underneath (e.g. "separate scales"). */
function PanelTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="ac-insights-panel-title">
      <span>{title}</span>
      {hint ? <span className="ac-insights-panel-hint">{hint}</span> : null}
    </div>
  );
}

export default function AdminConsoleInsightsPage() {
  /* ---- Sessions (RTK Query) ---- */
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    isError: sessionsIsError,
    error: sessionsError,
  } = useGetAdminSessionsOverviewQuery();

  /* ---- Subscriptions snapshot (RTK Query) ---- */
  const {
    data: subStats,
    isLoading: subStatsLoading,
    isError: subStatsIsError,
  } = useGetAdminSubscriptionStatsQuery();

  const trend = useMemo(() => sessionsData?.monthlyTrend ?? [], [sessionsData?.monthlyTrend]);

  const totals = useMemo(() => {
    const completed = trend.reduce((a, r) => a + r.completed, 0);
    const delayed = trend.reduce((a, r) => a + r.delayed, 0);
    const cancelled = trend.reduce((a, r) => a + r.cancelled, 0);
    const sessions = completed + delayed + cancelled;
    const completionRate = sessions > 0 ? Math.round((completed / sessions) * 1000) / 10 : 0;
    const cancellationRate = sessions > 0 ? Math.round((cancelled / sessions) * 1000) / 10 : 0;
    return { completed, delayed, cancelled, sessions, completionRate, cancellationRate };
  }, [trend]);

  const sessionVolume = useMemo(
    () => trend.map((r) => ({ m: r.month, sessions: r.completed + r.delayed + r.cancelled })),
    [trend],
  );

  /* ---- Program analytics (imperative fetch, scope-driven) ----
   * NOTE: only the enrollment-side fields (studentsWithAccess, enrollmentStatusBreakdown,
   * courseTypeBreakdown, enrollmentsPerMonth, averageProgress) respect courseName.
   * userSignups / mentorSignups / totalUsers / telegramStatusBreakdown are always platform-wide,
   * which is why they render in the unscoped "Platform growth" section below. */
  const [analyticsData, setAnalyticsData] = useState<ProgramAnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [programScope, setProgramScope] = useState<AnalyticsProgramScope>('all');

  useEffect(() => {
    let cancelled = false;

    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        const courseName = programScope === 'all' ? undefined : programScope;
        const params = courseName ? `?courseName=${courseName}` : '';
        const response = await api.request({
          path: `/program-dashboard/analytics${params}`,
          method: 'GET',
          secure: true,
        });
        if (!cancelled) setAnalyticsData(response.data as ProgramAnalyticsData);
      } catch (error) {
        console.error('[Insights] Error fetching analytics:', error);
        if (cancelled) return;
        const err = error as { response?: { status?: number }; status?: number };
        const status = err?.response?.status ?? err?.status;
        if (status === 404) {
          setAnalyticsError('Analytics endpoint not found. Please ensure the backend is deployed with the latest changes.');
        } else if (status === 403) {
          setAnalyticsError('Access denied. SuperAdmin role required.');
        } else {
          setAnalyticsError('Failed to load analytics data. Check your connection and retry.');
        }
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    };

    void fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [programScope]);

  // Merge user and mentor signups by month for the growth line chart.
  const signupTrend = useMemo(() => {
    if (!analyticsData?.userSignups) return [];

    const monthMap = new Map<string, { month: string; users: number; mentors: number }>();
    analyticsData.userSignups.forEach((item) => {
      monthMap.set(item.month, { month: item.month, users: item.count, mentors: 0 });
    });
    if (analyticsData.mentorSignups) {
      analyticsData.mentorSignups.forEach((item) => {
        const existing = monthMap.get(item.month);
        if (existing) {
          existing.mentors = item.count;
        } else {
          monthMap.set(item.month, { month: item.month, users: 0, mentors: item.count });
        }
      });
    }
    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [analyticsData?.userSignups, analyticsData?.mentorSignups]);

  /* Platform-wide figures — scope-invariant by backend contract. */
  const platform = useMemo(() => {
    if (!analyticsData) return null;

    const userSignups12m = sumCounts(analyticsData.userSignups);
    const mentorSignups12m = sumCounts(analyticsData.mentorSignups);
    const telegramLinked = sumCounts(analyticsData.telegramStatusBreakdown);

    let peakMonth = '';
    let peakUsers = 0;
    signupTrend.forEach((d) => {
      if (d.users > peakUsers) {
        peakUsers = d.users;
        peakMonth = d.month;
      }
    });

    return { userSignups12m, mentorSignups12m, telegramLinked, peakMonth, peakUsers };
  }, [analyticsData, signupTrend]);

  /* Scope-filtered enrollment figures. */
  const enrollment = useMemo(() => {
    if (!analyticsData) return null;

    const enrollments12m = sumCounts(analyticsData.enrollmentsPerMonth);
    const paidConversion =
      enrollments12m > 0
        ? `${((Number(analyticsData.studentsWithAccess ?? 0) / enrollments12m) * 100).toFixed(1)}%`
        : '—';

    const enrollmentPie =
      analyticsData.enrollmentStatusBreakdown?.map((item: { status: string; count: number }, i: number) => ({
        name: String(item.status ?? '—').replace(/_/g, ' '),
        value: item.count,
        fill: enrollmentStatusFill(String(item.status ?? ''), i),
      })) ?? [];

    const coursePie =
      analyticsData.courseTypeBreakdown?.map((item: { courseType: string; count: number }, i: number) => ({
        name: String(item.courseType ?? '—').toUpperCase(),
        value: item.count,
        fill: COURSE_PIE_FILLS[i % COURSE_PIE_FILLS.length],
      })) ?? [];

    const enrollmentTrend =
      analyticsData.enrollmentsPerMonth?.map((item: { month: string; count: number }) => ({
        month: item.month,
        enrollments: item.count,
      })) ?? [];

    return { enrollments12m, paidConversion, enrollmentPie, coursePie, enrollmentTrend };
  }, [analyticsData]);

  /* Subscriptions-by-status rows for the horizontal bar chart. */
  const subStatusRows = useMemo(() => {
    if (!subStats?.byStatus) return [];
    return SUBSCRIPTION_STATUS_META.map((meta) => ({
      name: meta.label,
      value: Number(subStats.byStatus[meta.key] ?? 0),
      fill: meta.fill,
    })).filter((row) => row.value > 0);
  }, [subStats]);

  const activeSubscriptions = useMemo(() => {
    if (!subStats?.byStatus) return 0;
    return Number(subStats.byStatus.active ?? 0) + Number(subStats.byStatus.trialing ?? 0);
  }, [subStats]);

  const scopeShort = scopeShortLabel(programScope);

  /* ---- Platform growth section body (platform-wide, no scope) ---- */
  const renderPlatformSection = () => {
    if (analyticsLoading && !analyticsData) {
      return (
        <>
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 6 }} />
        </>
      );
    }

    if (analyticsError && !analyticsData) {
      return <Alert type="error" showIcon message="Failed to load platform analytics" description={analyticsError} />;
    }

    if (!analyticsData || !platform) {
      return <Alert type="info" showIcon message="No analytics data available" />;
    }

    return (
      <>
        <Row gutter={[16, 16]} className="ac-kpi-row ac-kpi-row--equal">
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              accent="blue"
              label="Total users"
              value={Number(analyticsData.totalUsers ?? 0).toLocaleString()}
              note="All accounts on the platform"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              accent="green"
              label="User signups (12 mo)"
              value={platform.userSignups12m.toLocaleString()}
              note="New accounts, all roles"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              accent="blue"
              label="Mentor signups (12 mo)"
              value={platform.mentorSignups12m.toLocaleString()}
              note="New mentor-role accounts"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              accent="amber"
              label="Telegram profiles"
              value={platform.telegramLinked.toLocaleString()}
              note="Users with a Telegram status set"
            />
          </Col>
        </Row>

        {platform.peakMonth ? (
          <p className="ac-insights-callout">
            Peak user signup month: <strong>{platform.peakMonth}</strong> (
            {platform.peakUsers.toLocaleString()} users)
          </p>
        ) : null}

        <Row gutter={[16, 16]} className="ac-insights-charts">
          <Col xs={24}>
            <Card
              bordered={false}
              className="ac-panel"
              title={
                <PanelTitle
                  title="User & mentor signups (last 12 months)"
                  hint="Users (left axis) and mentors (right axis) are on separate scales"
                />
              }
            >
              {signupTrend.length === 0 ? (
                <Empty description="No signup data yet" />
              ) : (
                <div className="ac-insights-chart">
                  <ResponsiveContainer>
                    <LineChart data={signupTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                      <XAxis dataKey="month" stroke={AXIS_COLOR} tick={AXIS_TICK} angle={-35} textAnchor="end" height={52} />
                      <YAxis
                        yAxisId="users"
                        stroke={SERIES.primary}
                        tick={{ fill: SERIES.primary, fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <YAxis
                        yAxisId="mentors"
                        orientation="right"
                        stroke={SERIES.secondary}
                        tick={{ fill: SERIES.secondary, fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        {...TOOLTIP_PROPS}
                        formatter={(value: number, name: string) => [Number(value).toLocaleString(), name]}
                      />
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      <Line
                        yAxisId="users"
                        type="monotone"
                        dataKey="users"
                        name="Users"
                        stroke={SERIES.primary}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        yAxisId="mentors"
                        type="monotone"
                        dataKey="mentors"
                        name="Mentors"
                        stroke={SERIES.secondary}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  /* ---- Enrollments section body (scope-filtered) ---- */
  const renderEnrollmentsSection = () => {
    if (analyticsLoading && !analyticsData) {
      return (
        <>
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 6 }} />
        </>
      );
    }

    if (analyticsError && !analyticsData) {
      return <Alert type="error" showIcon message="Failed to load enrollment analytics" description={analyticsError} />;
    }

    if (!analyticsData || !enrollment) {
      return <Alert type="info" showIcon message="No analytics data available" />;
    }

    return (
      <Spin spinning={analyticsLoading}>
        {analyticsError ? (
          <Alert type="warning" showIcon message={analyticsError} style={{ marginBottom: 16 }} />
        ) : null}

        <Row gutter={[16, 16]} className="ac-kpi-row ac-kpi-row--equal">
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              accent="green"
              label="Paid enrollments"
              value={Number(analyticsData.studentsWithAccess ?? 0).toLocaleString()}
              note={`${scopeShort}: payment + enrollment completed`}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              accent="blue"
              label="New enrollments (12 mo)"
              value={enrollment.enrollments12m.toLocaleString()}
              note={`${scopeShort} enrollment rows, any status`}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              accent="green"
              label="Paid conversion (12 mo)"
              value={enrollment.paidConversion}
              note="paid ÷ enrollments started"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              accent="amber"
              label="Avg. course progress"
              value={`${Number(analyticsData.averageProgress ?? 0).toFixed(1)}%`}
              note="Sample: ~100 most recent paid enrollments"
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="ac-insights-charts">
          <Col xs={24}>
            <Card bordered={false} className="ac-panel" title={`Enrollments per month (${scopeShort})`}>
              {enrollment.enrollmentTrend.length === 0 ? (
                <Empty description="No enrollment data yet" />
              ) : (
                <div className="ac-insights-chart">
                  <ResponsiveContainer>
                    <AreaChart data={enrollment.enrollmentTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="acInsightsEnrollFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SERIES.primary} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={SERIES.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                      <XAxis dataKey="month" stroke={AXIS_COLOR} tick={AXIS_TICK} angle={-35} textAnchor="end" height={52} />
                      <YAxis stroke={AXIS_COLOR} tick={AXIS_TICK} allowDecimals={false} />
                      <Tooltip {...TOOLTIP_PROPS} />
                      <Area
                        type="monotone"
                        dataKey="enrollments"
                        name="Enrollments"
                        stroke={SERIES.primary}
                        strokeWidth={2}
                        fill="url(#acInsightsEnrollFill)"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="ac-insights-charts">
          <Col xs={24} lg={12}>
            <Card bordered={false} className="ac-panel" title="Enrollment status (paid cohort)">
              {enrollment.enrollmentPie.length === 0 ? (
                <Empty description="No data yet" />
              ) : (
                <div className="ac-insights-chart">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={enrollment.enrollmentPie}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={2}
                        stroke="none"
                      >
                        {enrollment.enrollmentPie.map((entry: { fill: string }, i: number) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip {...TOOLTIP_PROPS} />
                      <Legend wrapperStyle={LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card bordered={false} className="ac-panel" title="Course type mix">
              {enrollment.coursePie.length === 0 ? (
                <Empty description="No data yet" />
              ) : (
                <div className="ac-insights-chart">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={enrollment.coursePie}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={2}
                        stroke="none"
                      >
                        {enrollment.coursePie.map((entry: { fill: string }, i: number) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip {...TOOLTIP_PROPS} />
                      <Legend wrapperStyle={LEGEND_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <p className="ac-insights-footnote">
          <strong>Full Support is excluded from these aggregates</strong> — enrollment, progress, conversion, and
          course-type figures cover Admissions and SAT Prep only. Use Programs → Full Support for that cohort.
        </p>
      </Spin>
    );
  };

  /* ---- Revenue & subscriptions section body (point-in-time snapshot) ---- */
  const renderRevenueSection = () => {
    if (subStatsLoading) {
      return <Skeleton active paragraph={{ rows: 3 }} />;
    }

    if (subStatsIsError || !subStats) {
      return (
        <p className="ac-insights-quiet-note">
          Subscription stats are unavailable right now. The rest of this page is unaffected — retry later or check
          the Subscriptions page.
        </p>
      );
    }

    const mrrUsd = Number(subStats.mrrUsd ?? 0);
    const failures24h = Number(subStats.failures24h ?? 0);
    const pastDue = Number(subStats.pastDueOverdue ?? 0);

    return (
      <>
        <Row gutter={[16, 16]} className="ac-kpi-row ac-kpi-row--equal">
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              accent="green"
              label="MRR"
              value={formatUZS(subStats.mrrUzs)}
              note={mrrUsd > 0 ? `+ $${mrrUsd.toLocaleString()} USD` : 'Monthly recurring revenue'}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              accent="blue"
              label="Active subscriptions"
              value={activeSubscriptions.toLocaleString()}
              note="Active + trialing"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              accent={pastDue > 0 ? 'red' : 'green'}
              label="Past due"
              value={pastDue.toLocaleString()}
              note="Overdue for renewal"
              noteTone={pastDue > 0 ? 'danger' : undefined}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              accent={failures24h > 0 ? 'red' : 'blue'}
              label="Charges (last 24h)"
              value={Number(subStats.charges24h ?? 0).toLocaleString()}
              note={failures24h > 0 ? `${failures24h.toLocaleString()} failed` : 'No failed charges'}
              noteTone={failures24h > 0 ? 'danger' : undefined}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="ac-insights-charts">
          <Col xs={24} lg={12}>
            <Card bordered={false} className="ac-panel" title="Subscriptions by status">
              {subStatusRows.length === 0 ? (
                <Empty description="No subscriptions yet" />
              ) : (
                <div className="ac-insights-chart">
                  <ResponsiveContainer>
                    <BarChart
                      layout="vertical"
                      data={subStatusRows}
                      margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                      <XAxis type="number" stroke={AXIS_COLOR} tick={AXIS_TICK} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" stroke={AXIS_COLOR} tick={AXIS_TICK} width={72} />
                      <Tooltip
                        {...TOOLTIP_PROPS}
                        formatter={(value: number) => [Number(value).toLocaleString(), 'Subscriptions']}
                      />
                      <Bar dataKey="value" name="Subscriptions" barSize={18} radius={[0, 4, 4, 0]}>
                        {subStatusRows.map((row, i) => (
                          <Cell key={i} fill={row.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {subStats.generatedAt ? (
          <p className="ac-insights-footnote">
            Point-in-time snapshot generated {new Date(subStats.generatedAt).toLocaleString()}. No historical trend
            is available for these figures.
          </p>
        ) : null}
      </>
    );
  };

  /* ---- Sessions section body ---- */
  const renderSessionsSection = () => {
    if (sessionsLoading) {
      return (
        <>
          <Skeleton active paragraph={{ rows: 2 }} />
          <Skeleton active paragraph={{ rows: 5 }} />
        </>
      );
    }

    if (sessionsIsError || !sessionsData) {
      return (
        <Alert
          type="error"
          showIcon
          message="Failed to load session analytics"
          description={
            (sessionsError as { status?: number })?.status
              ? `Server returned ${(sessionsError as { status?: number }).status}.`
              : 'Check your connection and retry.'
          }
        />
      );
    }

    return (
      <>
        <Row gutter={[16, 16]} className="ac-kpi-row ac-kpi-row--equal">
          <Col xs={24} sm={12} xl={6}>
            <KpiCard accent="green" label="Session completion" value={`${totals.completionRate.toFixed(1)}%`} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard accent="amber" label="Delayed sessions" value={totals.delayed.toLocaleString()} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard accent="red" label="Cancellation rate" value={`${totals.cancellationRate.toFixed(1)}%`} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard accent="blue" label="Total sessions (6mo)" value={totals.sessions.toLocaleString()} />
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="ac-insights-charts">
          <Col xs={24} lg={14}>
            <Card bordered={false} className="ac-panel" title="Monthly session volume">
              {sessionVolume.length === 0 ? (
                <Empty description="No session data yet" />
              ) : (
                <div className="ac-insights-chart">
                  <ResponsiveContainer>
                    <LineChart data={sessionVolume} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                      <XAxis dataKey="m" stroke={AXIS_COLOR} tick={AXIS_TICK} />
                      <YAxis stroke={AXIS_COLOR} tick={AXIS_TICK} allowDecimals={false} />
                      <Tooltip {...TOOLTIP_PROPS} />
                      <Line
                        type="monotone"
                        dataKey="sessions"
                        name="Sessions"
                        stroke={SERIES.primary}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
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
                <div className="ac-insights-chart">
                  <ResponsiveContainer>
                    <BarChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                      <XAxis dataKey="month" stroke={AXIS_COLOR} tick={AXIS_TICK} />
                      <YAxis stroke={AXIS_COLOR} tick={AXIS_TICK} allowDecimals={false} />
                      <Tooltip {...TOOLTIP_PROPS} />
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      <Bar dataKey="completed" name="Completed" stackId="a" fill={SERIES.primary} />
                      <Bar dataKey="delayed" name="Delayed" stackId="a" fill={SERIES.warn} />
                      <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill={SERIES.danger} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  return (
    <div className="ac-admin-page">
      <h1 className="ac-page-title">Insights</h1>
      <p className="ac-page-lead">Platform analytics — growth, enrollments, revenue, and sessions.</p>

      <section className="ac-insights-section">
        <div className="ac-insights-section-head">
          <div>
            <h2 className="ac-insights-section-title">Platform growth</h2>
            <p className="ac-insights-section-sub">
              Accounts, signups, and Telegram reach across the whole platform. These figures are not affected by
              program scope.
            </p>
          </div>
        </div>
        {renderPlatformSection()}
      </section>

      <section className="ac-insights-section">
        <div className="ac-insights-section-head">
          <div>
            <h2 className="ac-insights-section-title">Enrollments — Admissions &amp; SAT</h2>
            <p className="ac-insights-section-sub">
              Paid access, enrollment flow, and course progress for the selected program scope.
            </p>
          </div>
          <div className="ac-insights-scope">
            <span className="ac-insights-scope-label">Scope</span>
            <Select<AnalyticsProgramScope>
              value={programScope}
              onChange={setProgramScope}
              style={{ minWidth: 220 }}
              options={[
                { value: 'all', label: 'Admissions + SAT (combined)' },
                { value: 'admissions', label: 'Admissions only' },
                { value: 'sat', label: 'SAT Prep only' },
              ]}
            />
          </div>
        </div>
        {renderEnrollmentsSection()}
      </section>

      <section className="ac-insights-section">
        <div className="ac-insights-section-head">
          <div>
            <h2 className="ac-insights-section-title">Revenue &amp; subscriptions</h2>
            <p className="ac-insights-section-sub">
              Billing snapshot across all subscription plans — MRR, active base, and charge health.
            </p>
          </div>
        </div>
        {renderRevenueSection()}
      </section>

      <section className="ac-insights-section">
        <div className="ac-insights-section-head">
          <div>
            <h2 className="ac-insights-section-title">Sessions</h2>
            <p className="ac-insights-section-sub">
              Completion, delays, and cancellations across the last 6 months.
            </p>
          </div>
        </div>
        {renderSessionsSection()}
      </section>
    </div>
  );
}
