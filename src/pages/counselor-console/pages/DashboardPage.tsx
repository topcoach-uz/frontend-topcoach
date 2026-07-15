import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from 'antd';
import {
  Users,
  UserCheck,
  UserPlus,
  TrendingUp,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  LineChart as LineChartIcon,
  ChevronRight,
  Building2,
  GraduationCap,
  MailPlus,
  BarChart3,
  Megaphone,
  ArrowUpRight,
} from 'lucide-react';
import { useCounselorConsole } from '../CounselorConsoleContext';
import {
  useGetOrgDashboardQuery,
  useGetOrgAnalyticsQuery,
  type OrgDashboardNeedsAttention,
} from 'src/app/services/counselorConsoleApi';
import { CcStat } from '../components/CcStat';
import { CcAvatar } from '../components/CcAvatar';
import {
  CcChart,
  CC_ACCENT,
  ccTooltipFormatter,
  type EChartsCoreOption,
} from '../charts/ccEcharts';
import './DashboardPage.scss';

/* One chart system — the dashboard's enrollment trend renders through the same
   <CcChart> / 'cc' ECharts theme as the Analytics page, so the two views match
   exactly (faint grid, cream-on-ink tooltip, maroon primary series). */

/** 'YYYY-MM' → short month label ("Jan", or "Jan '25" in January to mark the year). */
function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  const d = new Date(Date.UTC(y, m - 1, 1));
  const short = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  return m === 1 ? `${short} '${String(y).slice(2)}` : short;
}

function pct(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `${Number.isFinite(n) ? Math.round(n) : 0}%`;
}

export default function CounselorConsoleDashboardPage() {
  const { org, orgId } = useCounselorConsole();
  const navigate = useNavigate();
  const { data, isLoading, isFetching, isError } = useGetOrgDashboardQuery(
    orgId as string,
    { skip: !orgId },
  );

  // Program participation is pulled from the broad analytics endpoint (a 90d
  // snapshot is plenty for an at-a-glance count on the dashboard).
  const { data: analytics, isLoading: analyticsLoading } =
    useGetOrgAnalyticsQuery(
      { orgId: orgId as string, range: '90d' },
      { skip: !orgId },
    );

  // Cohort progress — how the org's students are distributed across progress
  // bands. Answers the counselor's core question ("who's behind?") from data
  // students actually generate, and pairs with the Needs-attention rail.
  const distribution = useMemo(() => {
    const buckets = analytics?.programs.progressDistribution ?? [];
    const peak = buckets.reduce((m, b) => Math.max(m, b.count), 0);
    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    return buckets.map((b, i) => ({
      key: `${b.bucket}-${i}`,
      bucket: b.bucket,
      count: b.count,
      // Bar width is relative to the busiest band so small cohorts stay legible.
      width: peak > 0 ? Math.max(4, Math.round((b.count / peak) * 100)) : 0,
      share: total > 0 ? Math.round((b.count / total) * 100) : 0,
    }));
  }, [analytics?.programs.progressDistribution]);

  const distributionTotal = distribution.reduce((sum, b) => sum + b.count, 0);

  const chartData = useMemo(
    () =>
      (data?.enrollmentTrends ?? []).map((t) => ({
        month: formatMonth(t.month),
        count: t.count,
      })),
    [data?.enrollmentTrends],
  );

  /* An editorial trend line, per the console's design language.
     `enrollmentTrends` is students who JOINED each month — NOT total student
     count over time. The line form is a deliberate design choice; the HONESTY
     lives in the labelling, so keep it: the series is "New students", the
     tooltip reads "4 joined", and the card subtitle says "New students per
     month". Do NOT rename the series back to "Students" or suffix the tooltip
     with " students" — that made a month reading 4 look like the org had 4
     students. And never cumsum this into a running total: the backend returns
     only the last 12 months of joins, so a cumulative line would silently omit
     every earlier student and contradict the Total students tile above it. */
  const enrollmentOption = useMemo<EChartsCoreOption>(() => {
    const last = chartData.length - 1;
    return {
      grid: { left: 6, right: 14, top: 12, bottom: 6, containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: ccTooltipFormatter({ valueSuffix: ' joined' }),
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.map((d) => d.month),
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'line',
          name: 'New students',
          smooth: true,
          color: CC_ACCENT,
          showSymbol: true,
          symbol: 'circle',
          /* Emphasize only the final data point (editorial endpoint dot). */
          symbolSize: (_v: unknown, p: { dataIndex: number }) =>
            p.dataIndex === last ? 9 : 0,
          itemStyle: { color: CC_ACCENT, borderColor: '#fbfaf6', borderWidth: 2 },
          lineStyle: { width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(123,31,47,0.22)' },
                { offset: 1, color: 'rgba(123,31,47,0)' },
              ],
            },
          },
          emphasis: { focus: 'series' },
          data: chartData.map((d) => d.count),
        },
      ],
    };
  }, [chartData]);

  const header = (
    <div className="cc-page-head--ruled">
      <div className="cc-page-eyebrow">
        <span className="cc-page-eyebrow-accent">Overview</span>
        {org ? <span>· {org.name}</span> : null}
      </div>
      <h1 className="cc-page-title">Dashboard</h1>
      <p className="cc-page-lead">
        A live snapshot of your organization — enrollment, engagement,
        application progress, and the students who need attention right now.
      </p>
    </div>
  );

  // ── No organization selected ──
  if (!orgId) {
    return (
      <div className="cc-dash">
        {header}
        <div className="cc-dash-empty cc-dash-empty--page">
          <span className="cc-dash-empty-ico cc-dash-empty-ico--accent">
            <Building2 size={20} />
          </span>
          <div className="cc-dash-empty-title">Select an organization</div>
          <div className="cc-dash-empty-text">
            Choose an organization from the switcher to see its overview.
          </div>
        </div>
      </div>
    );
  }

  // ── Loading: AntD skeletons for the stat row + panels ──
  if (isLoading) {
    return (
      <div className="cc-dash">
        {header}
        {/* Band-shaped, matching the real KPI row it replaces — and 5 cells,
            not 6, so the count doesn't change when data lands. */}
        <div className="cc-dash-skel-band" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="cc-dash-skel-stat">
              <Skeleton
                active
                title={{ width: '52%' }}
                paragraph={{ rows: 2, width: ['80%', '40%'] }}
              />
            </div>
          ))}
        </div>
        <div className="cc-dash-panels">
          <div className="cc-dash-card">
            <Skeleton active title paragraph={{ rows: 6 }} />
          </div>
          <div className="cc-dash-card">
            <Skeleton active title paragraph={{ rows: 6 }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (isError || !data) {
    return (
      <div className="cc-dash">
        {header}
        <div className="cc-dash-empty cc-dash-empty--page">
          <span className="cc-dash-empty-ico cc-dash-empty-ico--danger">
            <AlertTriangle size={20} />
          </span>
          <div className="cc-dash-empty-title">Couldn’t load the dashboard</div>
          <div className="cc-dash-empty-text">
            Something went wrong fetching this organization’s overview. Please
            refresh, or switch organizations and back.
          </div>
        </div>
      </div>
    );
  }

  const needsAttention: OrgDashboardNeedsAttention[] = data.needsAttention ?? [];

  return (
    <div className="cc-dash" aria-busy={isFetching}>
      {header}

      {/* ── KPI row ── */}
      <div className="cc-stat-grid">
        <CcStat
          tone="info"
          icon={<Users size={15} />}
          label="Total students"
          value={data.totalStudents.toLocaleString()}
          meta={`${data.newThisMonth.toLocaleString()} new this month`}
          cta="View students"
          onClick={() => navigate('/counselor-console/students')}
        />
        <CcStat
          tone="good"
          icon={<UserCheck size={15} />}
          label="Active students"
          value={data.activeStudents.toLocaleString()}
          meta={`of ${data.totalStudents.toLocaleString()} total`}
        />
        <CcStat
          tone="good"
          icon={<TrendingUp size={15} />}
          label="Avg program progress"
          value={pct(data.avgProgress)}
          meta={`Profiles ${pct(data.avgProfileCompletion)} complete on average`}
        />
        <CcStat
          tone="info"
          icon={<CalendarClock size={15} />}
          label="Upcoming sessions"
          value={data.upcomingSessions.toLocaleString()}
          meta="scheduled across the org"
        />
        <CcStat
          tone={data.needsAttention.length > 0 ? 'alert' : 'neutral'}
          icon={<AlertTriangle size={15} />}
          label="Needs attention"
          value={data.needsAttention.length.toLocaleString()}
          meta={
            data.needsAttention.length > 0
              ? 'students flagged below'
              : 'all students on track'
          }
        />
      </div>

      {/* ── Two-column working area: main (chart + programs) + right rail ── */}
      <div className="cc-dash-grid">
        {/* Main column */}
        <div className="cc-dash-col cc-dash-col--main">
          <section className="cc-dash-card">
            <div className="cc-dash-card-head">
              <div>
                <h2 className="cc-dash-card-title">Enrollment trends</h2>
                <p className="cc-dash-card-sub">
                  New students per month over the last year.
                </p>
              </div>
              <button
                type="button"
                className="cc-dash-card-link"
                onClick={() => navigate('/counselor-console/analytics')}
              >
                Analytics <ArrowUpRight size={13} />
              </button>
            </div>

            {chartData.length === 0 ? (
              <div className="cc-dash-empty">
                <span className="cc-dash-empty-ico cc-dash-empty-ico--accent">
                  <LineChartIcon size={20} />
                </span>
                <div className="cc-dash-empty-title">No trend data yet</div>
                <div className="cc-dash-empty-text">
                  Enrollment history will appear here as students join over time.
                </div>
              </div>
            ) : (
              <div className="cc-dash-chart">
                <CcChart option={enrollmentOption} />
              </div>
            )}
          </section>

          {/* Cohort progress */}
          <section className="cc-dash-card cc-dash-card--fill">
            <div className="cc-dash-card-head">
              <div>
                <h2 className="cc-dash-card-title">Cohort progress</h2>
                <p className="cc-dash-card-sub">
                  How far along your students are across their programs — spot
                  who's stalled at a glance.
                </p>
              </div>
              <button
                type="button"
                className="cc-dash-card-link"
                onClick={() => navigate('/counselor-console/analytics')}
              >
                Details <ArrowUpRight size={13} />
              </button>
            </div>

            {analyticsLoading ? (
              <div className="cc-dash-funnel" aria-hidden>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="cc-dash-funnel-skel">
                    <Skeleton
                      active
                      title={{ width: '40%' }}
                      paragraph={{ rows: 1, width: ['85%'] }}
                    />
                  </div>
                ))}
              </div>
            ) : distributionTotal === 0 ? (
              <div className="cc-dash-empty">
                <span className="cc-dash-empty-ico cc-dash-empty-ico--accent">
                  <GraduationCap size={20} />
                </span>
                <div className="cc-dash-empty-title">No progress data yet</div>
                <div className="cc-dash-empty-text">
                  This fills in as students work through their programs.
                </div>
              </div>
            ) : (
              <div className="cc-dash-funnel">
                {distribution.map((b) => (
                  <div className="cc-dash-funnel-row" key={b.key}>
                    <div className="cc-dash-funnel-top">
                      <span className="cc-dash-funnel-stage">{b.bucket}</span>
                      <span className="cc-dash-funnel-meta">
                        <strong>{b.count.toLocaleString()}</strong>
                        <span className="cc-dash-funnel-conv">
                          {b.share}% of cohort
                        </span>
                      </span>
                    </div>
                    <div className="cc-dash-funnel-track">
                      <span
                        className="cc-dash-funnel-fill"
                        style={{ width: `${b.width}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right rail */}
        <aside className="cc-dash-col cc-dash-col--rail">
          <section className="cc-dash-card cc-dash-card--fill">
            <div className="cc-dash-card-head">
              <div>
                <h2 className="cc-dash-card-title">Needs attention</h2>
                <p className="cc-dash-card-sub">
                  {needsAttention.length > 0
                    ? `${needsAttention.length} student${needsAttention.length === 1 ? '' : 's'} to follow up with.`
                    : 'Flagged students show up here.'}
                </p>
              </div>
              {needsAttention.length > 0 ? (
                <button
                  type="button"
                  className="cc-dash-card-link"
                  onClick={() => navigate('/counselor-console/students')}
                >
                  All students <ArrowUpRight size={13} />
                </button>
              ) : null}
            </div>

            {needsAttention.length === 0 ? (
              <div className="cc-dash-empty">
                <span className="cc-dash-empty-ico cc-dash-empty-ico--good">
                  <CheckCircle2 size={20} />
                </span>
                <div className="cc-dash-empty-title">All students on track</div>
                <div className="cc-dash-empty-text">
                  No students are flagged for attention right now.
                </div>
              </div>
            ) : (
              <div className="cc-dash-attn-list">
                {needsAttention.map((s) => (
                  <button
                    key={s.userId}
                    type="button"
                    className="cc-dash-attn-row"
                    onClick={() =>
                      navigate(`/counselor-console/students/${s.userId}`)
                    }
                  >
                    <CcAvatar
                      name={s.name}
                      src={s.avatarUrl}
                      size={34}
                      className="cc-dash-attn-avatar"
                    />
                    <span className="cc-dash-attn-main">
                      <span className="cc-dash-attn-name">{s.name}</span>
                      <span className="cc-dash-attn-reason">
                        <span
                          className="cc-dash-attn-dot"
                          aria-hidden="true"
                        />
                        {s.reason}
                      </span>
                      {/* Context is what makes the flag actionable — "Invited 9
                          days ago" tells a counselor what to do; the reason
                          alone doesn't. Null when there's nothing honest to add. */}
                      {s.context ? (
                        <span className="cc-dash-attn-context">{s.context}</span>
                      ) : null}
                    </span>
                    <ChevronRight size={16} className="cc-dash-attn-arrow" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Quick navigation */}
          <section className="cc-dash-card cc-dash-quick">
            <div className="cc-dash-card-head cc-dash-card-head--tight">
              <h2 className="cc-dash-card-title">Quick actions</h2>
            </div>
            <div className="cc-dash-quick-grid">
              {[
                {
                  label: 'Students',
                  hint: 'Manage your students',
                  icon: <Users size={16} />,
                  to: '/counselor-console/students',
                },
                {
                  label: 'Invite',
                  hint: 'Add new students',
                  icon: <MailPlus size={16} />,
                  to: '/counselor-console/invitations',
                },
                {
                  label: 'Analytics',
                  hint: 'Engagement & progress',
                  icon: <BarChart3 size={16} />,
                  to: '/counselor-console/analytics',
                },
                {
                  label: 'Announce',
                  hint: 'Message the org',
                  icon: <Megaphone size={16} />,
                  to: '/counselor-console/announcements',
                },
              ].map((a) => (
                <button
                  key={a.to}
                  type="button"
                  className="cc-dash-quick-btn"
                  onClick={() => navigate(a.to)}
                >
                  <span className="cc-dash-quick-ico">{a.icon}</span>
                  <span className="cc-dash-quick-main">
                    <span className="cc-dash-quick-label">{a.label}</span>
                    <span className="cc-dash-quick-hint">{a.hint}</span>
                  </span>
                  <ChevronRight size={15} className="cc-dash-quick-arrow" />
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
