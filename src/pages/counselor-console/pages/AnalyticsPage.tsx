import { useMemo, useState, type ReactNode } from 'react';
import { Skeleton } from 'antd';
import {
  Building2,
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  Gauge,
  Filter,
  LineChart as LineChartIcon,
  BarChart3,
  MessageSquare,
  Sparkles,
  Coins,
  CalendarClock,
  CalendarDays,
  Trophy,
  Users,
  Info,
} from 'lucide-react';
import { useCounselorConsole } from '../CounselorConsoleContext';
import {
  useGetOrgAnalyticsQuery,
  type OrgAnalyticsRange,
} from 'src/app/services/counselorConsoleApi';
import { CcStat } from '../components/CcStat';
import {
  CcChart,
  CC_SERIES,
  ccRampAt,
  CC_MAROON_RAMP,
  ccTooltipFormatter,
  type EChartsCoreOption,
} from '../charts/ccEcharts';
import './AnalyticsPage.scss';

/* ── One chart system ──────────────────────────────────────────────────────
   Every chart on this page renders through <CcChart> (Apache ECharts, SVG
   renderer) using the shared 'cc' theme registered in charts/ccEcharts.tsx.
   Pages only supply data + which series to draw — the editorial palette,
   typography, gridlines and cream-on-ink tooltip all live in the theme. */

const RANGES: { value: OrgAnalyticsRange; label: string }[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '365d', label: '12 months' },
];

/* ── Section tabs ────────────────────────────────────────────────────────────
   The page's sections are horizontal tabs rather than a long vertical scroll.
   The range selector above stays global — every tab reads the same query
   result. Order: Overview, Sessions, Programs, Admissions, Engagement, AI,
   Coins (Sessions sits second; the old Events tab has been removed). */
type TabKey =
  | 'trend'
  | 'sessions'
  | 'programs'
  | 'admissions'
  | 'engagement'
  | 'ai'
  | 'coins';

const TABS: { key: TabKey; label: string; icon: ReactNode }[] = [
  { key: 'trend', label: 'Overview', icon: <TrendingUp size={15} /> },
  { key: 'sessions', label: 'Sessions', icon: <CalendarClock size={15} /> },
  { key: 'programs', label: 'Programs', icon: <GraduationCap size={15} /> },
  { key: 'admissions', label: 'Admissions', icon: <Filter size={15} /> },
  { key: 'engagement', label: 'Engagement', icon: <Users size={15} /> },
  { key: 'ai', label: 'AI', icon: <Sparkles size={15} /> },
  { key: 'coins', label: 'Coins', icon: <Coins size={15} /> },
];

/* ── Formatting helpers ──────────────────────────────────────────────────── */

/** 'YYYY-MM' → short month label ("Jan", or "Jan '25" in January to mark the year). */
function formatMonth(month: string): string {
  const [y, m] = String(month).split('-').map(Number);
  if (!y || !m) return String(month);
  const d = new Date(Date.UTC(y, m - 1, 1));
  const short = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  return m === 1 ? `${short} '${String(y).slice(2)}` : short;
}

/** ISO date → "Mmm d" (used for the daily history axis). */
function formatDay(value: string | number): string {
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** 'YYYY-Www' or ISO week start → compact week label. Falls back to raw. */
function formatWeek(value: string | number): string {
  const raw = String(value);
  const isoWeek = raw.match(/W(\d{1,2})/i);
  if (isoWeek) return `W${isoWeek[1]}`;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
  return raw;
}

function num(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString();
}

/* ── Shared chart-option scaffolding ─────────────────────────────────────────
   A faint-grid cartesian base every bar/line chart extends, so spacing and
   axis treatment stay identical across the page. */
function cartesianBase(withLegend: boolean): EChartsCoreOption {
  return {
    grid: {
      left: 6,
      right: 14,
      top: withLegend ? 34 : 12,
      bottom: 6,
      containLabel: true,
    },
    legend: withLegend
      ? { show: true, top: 0, left: 0, itemGap: 16 }
      : { show: false },
  };
}

/* ── Small building blocks ──────────────────────────────────────────────── */

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="cc-analytics-section-head">
      <span className="cc-analytics-section-eyebrow">{eyebrow}</span>
      <h2 className="cc-analytics-section-title">{title}</h2>
      <p className="cc-analytics-section-sub">{sub}</p>
    </div>
  );
}

function ChartCard({
  title,
  sub,
  hasData,
  emptyIcon,
  emptyTitle,
  emptyText,
  children,
  className = '',
}: {
  title: string;
  sub?: string;
  hasData: boolean;
  emptyIcon: ReactNode;
  emptyTitle: string;
  emptyText: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`cc-analytics-card ${className}`.trim()}>
      <div className="cc-analytics-card-head">
        <div>
          <h3 className="cc-analytics-card-title">{title}</h3>
          {sub ? <p className="cc-analytics-card-sub">{sub}</p> : null}
        </div>
      </div>
      {hasData ? (
        <div className="cc-analytics-chart">{children}</div>
      ) : (
        <div className="cc-analytics-empty">
          <span className="cc-analytics-empty-ico">{emptyIcon}</span>
          <div className="cc-analytics-empty-title">{emptyTitle}</div>
          <div className="cc-analytics-empty-text">{emptyText}</div>
        </div>
      )}
    </section>
  );
}

export default function CounselorConsoleAnalyticsPage() {
  const { org, orgId } = useCounselorConsole();
  const [range, setRange] = useState<OrgAnalyticsRange>('90d');
  const [activeTab, setActiveTab] = useState<TabKey>('trend');

  const { data, isLoading, isFetching, isError } = useGetOrgAnalyticsQuery(
    { orgId: orgId as string, range },
    { skip: !orgId },
  );

  /* ── Derived, memoized chart datasets (shapes unchanged) ── */
  const historyData = useMemo(
    () => data?.history ?? [],
    [data?.history],
  );

  const programData = useMemo(
    () => data?.programs.byProgram ?? [],
    [data?.programs.byProgram],
  );

  const distributionData = useMemo(
    () => data?.programs.progressDistribution ?? [],
    [data?.programs.progressDistribution],
  );

  const funnelData = useMemo(
    () => data?.admissions.funnel ?? [],
    [data?.admissions.funnel],
  );

  const applicationsData = useMemo(
    () => data?.admissions.applicationsOverTime ?? [],
    [data?.admissions.applicationsOverTime],
  );

  const weeklyActiveData = useMemo(
    () => data?.engagement.weeklyActive ?? [],
    [data?.engagement.weeklyActive],
  );

  const cohortData = useMemo(
    () => data?.engagement.lastActiveCohorts ?? [],
    [data?.engagement.lastActiveCohorts],
  );

  const aiUsageData = useMemo(
    () => data?.ai.usageByType ?? [],
    [data?.ai.usageByType],
  );

  const sessionsByMonth = useMemo(
    () => data?.sessions.byMonth ?? [],
    [data?.sessions.byMonth],
  );

  /* ── Chart options (one per chart) ── */
  const trendOption = useMemo<EChartsCoreOption>(
    () => ({
      ...cartesianBase(true),
      tooltip: {
        trigger: 'axis',
        formatter: ccTooltipFormatter({ heading: (r) => formatDay(r) }),
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: historyData.map((h) => h.date),
        axisLabel: {
          formatter: (v: string) => formatDay(v),
          hideOverlap: true,
        },
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'line',
          name: 'Students',
          data: historyData.map((h) => h.students),
          color: CC_SERIES.maroon,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(123,31,47,0.20)' },
                { offset: 1, color: 'rgba(123,31,47,0)' },
              ],
            },
          },
        },
        {
          type: 'line',
          name: 'Active',
          data: historyData.map((h) => h.activeStudents),
          color: CC_SERIES.sage,
        },
        {
          type: 'line',
          name: 'Applications submitted',
          data: historyData.map((h) => h.applicationsSubmitted),
          color: CC_SERIES.gold,
        },
      ],
    }),
    [historyData],
  );

  const programOption = useMemo<EChartsCoreOption>(
    () => ({
      ...cartesianBase(true),
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: ccTooltipFormatter(),
      },
      xAxis: {
        type: 'category',
        data: programData.map((p) => p.program),
        axisLabel: { interval: 0, hideOverlap: true },
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'bar',
          name: 'Enrolled',
          data: programData.map((p) => p.enrolled),
          color: CC_SERIES.maroon,
          barMaxWidth: 30,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
        {
          type: 'bar',
          name: 'Completed',
          data: programData.map((p) => p.completed),
          color: CC_SERIES.sage,
          barMaxWidth: 30,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    }),
    [programData],
  );

  const distributionOption = useMemo<EChartsCoreOption>(
    () => ({
      ...cartesianBase(false),
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: ccTooltipFormatter({ valueSuffix: ' students', bySeries: false }),
      },
      xAxis: {
        type: 'category',
        data: distributionData.map((d) => d.bucket),
        axisLabel: { interval: 0, hideOverlap: true },
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'bar',
          name: 'Students',
          barMaxWidth: 46,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: distributionData.map((d, i) => ({
            value: d.count,
            name: d.bucket,
            itemStyle: { color: ccRampAt(i) },
          })),
        },
      ],
    }),
    [distributionData],
  );

  const funnelOption = useMemo<EChartsCoreOption>(
    () => ({
      tooltip: {
        trigger: 'item',
        formatter: (p: { marker?: string; name?: string; value?: number }) =>
          `<div class="cc-echart-tip"><div class="cc-echart-tip-rows"><div class="cc-echart-tip-row">${
            p.marker ?? ''
          }<span class="cc-echart-tip-name">${p.name ?? ''}</span><span class="cc-echart-tip-val">${Number(
            p.value ?? 0,
          ).toLocaleString()} students</span></div></div></div>`,
      },
      series: [
        {
          type: 'funnel',
          top: 14,
          bottom: 14,
          left: '6%',
          right: '6%',
          minSize: '18%',
          maxSize: '100%',
          sort: 'none',
          gap: 2,
          funnelAlign: 'center',
          label: {
            show: true,
            position: 'inside',
            color: '#fbfaf6',
            fontSize: 12.5,
            fontWeight: 600,
            formatter: (p: { name?: string; value?: number }) =>
              `${p.name ?? ''}  ·  ${Number(p.value ?? 0).toLocaleString()}`,
          },
          labelLine: { show: false },
          itemStyle: { borderWidth: 0 },
          data: funnelData.map((s, i) => ({
            name: s.stage,
            value: s.count,
            itemStyle: {
              color: ccRampAt(CC_MAROON_RAMP.length - 1 - i),
            },
          })),
        },
      ],
    }),
    [funnelData],
  );

  const applicationsOption = useMemo<EChartsCoreOption>(
    () => ({
      ...cartesianBase(true),
      tooltip: { trigger: 'axis', formatter: ccTooltipFormatter() },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: applicationsData.map((a) => formatMonth(a.month)),
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'line',
          name: 'Started',
          data: applicationsData.map((a) => a.started),
          color: CC_SERIES.gold,
        },
        {
          type: 'line',
          name: 'Submitted',
          data: applicationsData.map((a) => a.submitted),
          color: CC_SERIES.maroon,
        },
      ],
    }),
    [applicationsData],
  );

  const weeklyActiveOption = useMemo<EChartsCoreOption>(
    () => ({
      ...cartesianBase(false),
      tooltip: {
        trigger: 'axis',
        formatter: ccTooltipFormatter({
          heading: (r) => formatWeek(r),
          valueSuffix: ' active',
        }),
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: weeklyActiveData.map((w) => w.week),
        axisLabel: {
          formatter: (v: string) => formatWeek(v),
          hideOverlap: true,
        },
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'line',
          name: 'Active students',
          data: weeklyActiveData.map((w) => w.count),
          color: CC_SERIES.maroon,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(123,31,47,0.16)' },
                { offset: 1, color: 'rgba(123,31,47,0)' },
              ],
            },
          },
        },
      ],
    }),
    [weeklyActiveData],
  );

  const cohortOption = useMemo<EChartsCoreOption>(
    () => ({
      ...cartesianBase(false),
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: ccTooltipFormatter({ valueSuffix: ' students', bySeries: false }),
      },
      xAxis: {
        type: 'category',
        data: cohortData.map((c) => c.cohort),
        axisLabel: { interval: 0, hideOverlap: true },
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'bar',
          name: 'Students',
          barMaxWidth: 46,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: cohortData.map((c, i) => ({
            value: c.count,
            name: c.cohort,
            itemStyle: { color: ccRampAt(i) },
          })),
        },
      ],
    }),
    [cohortData],
  );

  const aiUsageOption = useMemo<EChartsCoreOption>(
    () => ({
      ...cartesianBase(false),
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: ccTooltipFormatter({ valueSuffix: ' uses', bySeries: false }),
      },
      xAxis: {
        type: 'category',
        data: aiUsageData.map((a) => a.type),
        axisLabel: { interval: 0, hideOverlap: true },
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'bar',
          name: 'Uses',
          barMaxWidth: 44,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: aiUsageData.map((a, i) => ({
            value: a.count,
            name: a.type,
            itemStyle: { color: ccRampAt(i) },
          })),
        },
      ],
    }),
    [aiUsageData],
  );

  const sessionsOption = useMemo<EChartsCoreOption>(
    () => ({
      ...cartesianBase(false),
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: ccTooltipFormatter({ valueSuffix: ' sessions', bySeries: false }),
      },
      xAxis: {
        type: 'category',
        data: sessionsByMonth.map((s) => formatMonth(s.month)),
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'bar',
          name: 'Sessions',
          data: sessionsByMonth.map((s) => s.count),
          color: CC_SERIES.maroon,
          barMaxWidth: 38,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    }),
    [sessionsByMonth],
  );

  const header = (
    <div className="cc-analytics-header">
      <div className="cc-analytics-header-copy">
        <div className="cc-page-eyebrow">
          <span className="cc-page-eyebrow-accent">Insights</span>
          {org ? <span>· {org.name}</span> : null}
        </div>
        <h1 className="cc-page-title">Analytics</h1>
        <p className="cc-page-lead">
          A broad view of your organization — sessions, programs, admissions,
          engagement, AI usage, and coins across your selected window.
        </p>
      </div>
      <div
        className="cc-analytics-range"
        role="group"
        aria-label="Analytics time range"
      >
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            className={`cc-analytics-range-btn ${
              range === r.value ? 'cc-analytics-range-btn--active' : ''
            }`}
            aria-pressed={range === r.value}
            onClick={() => setRange(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ── No organization selected ──
  if (!orgId) {
    return (
      <div className="cc-analytics">
        {header}
        <div className="cc-analytics-message">
          <span className="cc-analytics-message-ico cc-analytics-message-ico--accent">
            <Building2 size={20} />
          </span>
          <div className="cc-analytics-message-title">Select an organization</div>
          <div className="cc-analytics-message-text">
            Choose an organization from the switcher to see its analytics.
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="cc-analytics">
        {header}
        <div className="cc-stat-grid" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="cc-analytics-skel-stat">
              <Skeleton
                active
                title={{ width: '52%' }}
                paragraph={{ rows: 2, width: ['80%', '40%'] }}
              />
            </div>
          ))}
        </div>
        <div className="cc-analytics-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="cc-analytics-card">
              <Skeleton active title paragraph={{ rows: 6 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──
  if (isError || !data) {
    return (
      <div className="cc-analytics">
        {header}
        <div className="cc-analytics-message">
          <span className="cc-analytics-message-ico cc-analytics-message-ico--danger">
            <AlertTriangle size={20} />
          </span>
          <div className="cc-analytics-message-title">Couldn’t load analytics</div>
          <div className="cc-analytics-message-text">
            Something went wrong fetching this organization’s analytics. Please
            refresh, or switch organizations and back.
          </div>
        </div>
      </div>
    );
  }

  const mmAttempts = data.ai.majorMatchAttempts ?? 0;
  const mmCompleted = data.ai.majorMatchCompleted ?? 0;
  const mmRate = mmAttempts > 0 ? Math.round((mmCompleted / mmAttempts) * 100) : 0;
  const topEarners = data.coins.topEarners ?? [];
  const maxEarner = topEarners.reduce((m, e) => Math.max(m, e.coins), 0);
  const communityMembers = data.programs.communityMembers ?? 0;
  const programsAllZero =
    programData.length > 0 && programData.every((p) => p.enrolled === 0);

  const sessionsBooked = data.sessions.booked ?? 0;
  const sessionsAttended = data.sessions.attended ?? 0;
  const sessionsUpcoming = data.sessions.upcoming ?? 0;
  const sessionsAttendRate =
    sessionsBooked > 0 ? Math.round((sessionsAttended / sessionsBooked) * 100) : 0;
  const hasSessionData =
    sessionsBooked > 0 ||
    sessionsAttended > 0 ||
    sessionsUpcoming > 0 ||
    sessionsByMonth.length > 0;

  return (
    <div className="cc-analytics" aria-busy={isFetching}>
      {header}

      <div className="cc-analytics-tabs" role="tablist" aria-label="Analytics sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`cc-analytics-tab-${t.key}`}
            aria-selected={activeTab === t.key}
            aria-controls={`cc-analytics-panel-${t.key}`}
            className={`cc-analytics-tab ${
              activeTab === t.key ? 'cc-analytics-tab--active' : ''
            }`}
            onClick={() => setActiveTab(t.key)}
          >
            <span className="cc-analytics-tab-ico">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ Overview trend ══ */}
      {activeTab === 'trend' && (
      <section
        className="cc-analytics-section"
        role="tabpanel"
        id="cc-analytics-panel-trend"
        aria-labelledby="cc-analytics-tab-trend"
      >
        <SectionHead
          eyebrow="Trend"
          title="Organization over time"
          sub="Students, weekly-active students, and applications submitted across the window."
        />
        <ChartCard
          title="Growth & activity"
          hasData={historyData.length > 0}
          emptyIcon={<LineChartIcon size={20} />}
          emptyTitle="No history yet"
          emptyText="Daily history appears here as students join and stay active over time."
          className="cc-analytics-card--wide"
        >
          <CcChart option={trendOption} height={300} />
        </ChartCard>
      </section>
      )}

      {/* ══ Sessions ══ */}
      {activeTab === 'sessions' && (
      <section
        className="cc-analytics-section"
        role="tabpanel"
        id="cc-analytics-panel-sessions"
        aria-labelledby="cc-analytics-tab-sessions"
      >
        <SectionHead
          eyebrow="Sessions"
          title="Mentor sessions"
          sub="How many 1:1 mentor sessions your students book, attend, and have coming up — with monthly volume."
        />
        {hasSessionData ? (
          <>
            <div className="cc-stat-grid cc-analytics-stat-row">
              <CcStat
                tone="info"
                icon={<CalendarClock size={15} />}
                label="Booked"
                value={num(sessionsBooked)}
                meta="sessions booked in this window"
              />
              <CcStat
                tone="good"
                icon={<CalendarClock size={15} />}
                label="Attended"
                value={num(sessionsAttended)}
                meta={
                  sessionsBooked > 0
                    ? `${sessionsAttendRate}% of booked were attended`
                    : 'sessions that took place'
                }
              />
              <CcStat
                tone="neutral"
                icon={<CalendarClock size={15} />}
                label="Upcoming"
                value={num(sessionsUpcoming)}
                meta="scheduled but not yet held"
              />
            </div>
            <div className="cc-analytics-grid">
              <ChartCard
                title="Sessions by month"
                sub="Total booked per month"
                hasData={sessionsByMonth.length > 0}
                emptyIcon={<CalendarDays size={20} />}
                emptyTitle="No monthly breakdown yet"
                emptyText="Monthly session volume appears here as sessions are booked over time."
                className="cc-analytics-card--wide"
              >
                <CcChart option={sessionsOption} />
              </ChartCard>
            </div>
          </>
        ) : (
          <div className="cc-analytics-grid">
            <section className="cc-analytics-card cc-analytics-card--wide">
              <div className="cc-analytics-empty">
                <span className="cc-analytics-empty-ico">
                  <CalendarClock size={20} />
                </span>
                <div className="cc-analytics-empty-title">No sessions yet</div>
                <div className="cc-analytics-empty-text">
                  Once your students book 1:1 mentor sessions, you’ll see booked,
                  attended, and upcoming counts here — plus monthly volume.
                </div>
              </div>
            </section>
          </div>
        )}
      </section>
      )}

      {/* ══ Programs ══ */}
      {activeTab === 'programs' && (
      <section
        className="cc-analytics-section"
        role="tabpanel"
        id="cc-analytics-panel-programs"
        aria-labelledby="cc-analytics-tab-programs"
      >
        <SectionHead
          eyebrow="Programs"
          title="Enrollment & progress"
          sub="How students are distributed across programs and how far along they are."
        />
        <div className="cc-stat-grid cc-analytics-stat-row">
          <CcStat
            tone="info"
            icon={<Users size={15} />}
            label="Community members"
            value={num(communityMembers)}
            meta="active Community subscriptions"
          />
        </div>
        {programsAllZero ? (
          <p className="cc-analytics-note">
            <Info size={13} />
            No students enrolled in any program yet.
          </p>
        ) : null}
        <div className="cc-analytics-grid cc-analytics-grid--2">
          <ChartCard
            title="Enrolled vs completed"
            sub="By program"
            hasData={programData.length > 0}
            emptyIcon={<GraduationCap size={20} />}
            emptyTitle="No program data"
            emptyText="Program enrollment shows here once students are enrolled."
          >
            <CcChart option={programOption} />
          </ChartCard>

          <ChartCard
            title="Progress distribution"
            sub="Students grouped by completion"
            hasData={distributionData.length > 0}
            emptyIcon={<Gauge size={20} />}
            emptyTitle="No progress data"
            emptyText="Progress buckets appear once students start their programs."
          >
            <CcChart option={distributionOption} />
          </ChartCard>
        </div>
      </section>
      )}

      {/* ══ Admissions ══ */}
      {activeTab === 'admissions' && (
      <section
        className="cc-analytics-section"
        role="tabpanel"
        id="cc-analytics-panel-admissions"
        aria-labelledby="cc-analytics-tab-admissions"
      >
        <SectionHead
          eyebrow="Admissions"
          title="Application pipeline"
          sub="Where students sit in the funnel, and how applications move month to month."
        />
        <div className="cc-analytics-grid cc-analytics-grid--2">
          <ChartCard
            title="Admissions funnel"
            sub="Students at each stage"
            hasData={funnelData.length > 0}
            emptyIcon={<Filter size={20} />}
            emptyTitle="No funnel data"
            emptyText="Funnel stages fill in as students progress through admissions."
          >
            <CcChart option={funnelOption} />
          </ChartCard>

          <ChartCard
            title="Applications over time"
            sub="Started vs submitted"
            hasData={applicationsData.length > 0}
            emptyIcon={<LineChartIcon size={20} />}
            emptyTitle="No application activity"
            emptyText="Monthly application activity appears here over time."
          >
            <CcChart option={applicationsOption} />
          </ChartCard>
        </div>
      </section>
      )}

      {/* ══ Engagement ══ */}
      {activeTab === 'engagement' && (
      <section
        className="cc-analytics-section"
        role="tabpanel"
        id="cc-analytics-panel-engagement"
        aria-labelledby="cc-analytics-tab-engagement"
      >
        <SectionHead
          eyebrow="Engagement"
          title="How students show up"
          sub="Weekly-active students, recency of last activity, and chat volume."
        />
        <div className="cc-stat-grid cc-analytics-stat-row">
          <CcStat
            tone="info"
            icon={<MessageSquare size={15} />}
            label="Messages sent"
            value={num(data.engagement.messagesSent)}
            meta="across the window"
          />
        </div>
        <div className="cc-analytics-grid cc-analytics-grid--2">
          <ChartCard
            title="Weekly-active students"
            sub="Distinct students active each week"
            hasData={weeklyActiveData.length > 0}
            emptyIcon={<TrendingUp size={20} />}
            emptyTitle="No activity yet"
            emptyText="Weekly activity appears here as students engage."
          >
            <CcChart option={weeklyActiveOption} />
          </ChartCard>

          <ChartCard
            title="Last active"
            sub="Students grouped by recency"
            hasData={cohortData.length > 0}
            emptyIcon={<BarChart3 size={20} />}
            emptyTitle="No recency data"
            emptyText="Last-active cohorts appear once students have activity."
          >
            <CcChart option={cohortOption} />
          </ChartCard>
        </div>
      </section>
      )}

      {/* ══ AI ══ */}
      {activeTab === 'ai' && (
      <section
        className="cc-analytics-section"
        role="tabpanel"
        id="cc-analytics-panel-ai"
        aria-labelledby="cc-analytics-tab-ai"
      >
        <SectionHead
          eyebrow="AI"
          title="AI assistance"
          sub="Major Match usage and the mix of AI tools students reach for."
        />
        <div className="cc-stat-grid cc-analytics-stat-row">
          <CcStat
            tone="info"
            icon={<Sparkles size={15} />}
            label="Major Match attempts"
            value={num(mmAttempts)}
            meta="students who started"
          />
          <CcStat
            tone="good"
            icon={<Sparkles size={15} />}
            label="Major Match completed"
            value={num(mmCompleted)}
            meta={`${mmRate}% completion rate`}
          />
        </div>
        <div className="cc-analytics-grid">
          <ChartCard
            title="AI usage by type"
            sub="Interactions per tool"
            hasData={aiUsageData.length > 0}
            emptyIcon={<Sparkles size={20} />}
            emptyTitle="No AI usage yet"
            emptyText="Usage appears here as students use AI tools."
            className="cc-analytics-card--wide"
          >
            <CcChart option={aiUsageOption} />
          </ChartCard>
        </div>
      </section>
      )}

      {/* ══ Coins ══ */}
      {activeTab === 'coins' && (
      <section
        className="cc-analytics-section"
        role="tabpanel"
        id="cc-analytics-panel-coins"
        aria-labelledby="cc-analytics-tab-coins"
      >
        <SectionHead
          eyebrow="Coins"
          title="Rewards economy"
          sub="Coins earned and redeemed, and the students earning the most."
        />
        <div className="cc-stat-grid cc-analytics-stat-row">
          <CcStat
            tone="good"
            icon={<Coins size={15} />}
            label="Coins earned"
            value={num(data.coins.totalEarned)}
            meta="across all students"
          />
          <CcStat
            tone="neutral"
            icon={<Coins size={15} />}
            label="Coins redeemed"
            value={num(data.coins.totalRedeemed)}
            meta="spent in the marketplace"
          />
        </div>
        <div className="cc-analytics-grid">
          <section className="cc-analytics-card cc-analytics-card--wide">
            <div className="cc-analytics-card-head">
              <div>
                <h3 className="cc-analytics-card-title">Top earners</h3>
                <p className="cc-analytics-card-sub">Students with the most coins earned</p>
              </div>
            </div>
            {topEarners.length === 0 ? (
              <div className="cc-analytics-empty">
                <span className="cc-analytics-empty-ico">
                  <Trophy size={20} />
                </span>
                <div className="cc-analytics-empty-title">No earners yet</div>
                <div className="cc-analytics-empty-text">
                  Top earners appear here as students start earning coins.
                </div>
              </div>
            ) : (
              <ol className="cc-analytics-earners">
                {topEarners.map((e, i) => (
                  <li className="cc-analytics-earner" key={e.userId}>
                    <span className="cc-analytics-earner-rank">{i + 1}</span>
                    <span className="cc-analytics-earner-main">
                      <span className="cc-analytics-earner-name">{e.name}</span>
                      <span className="cc-analytics-earner-bar">
                        <span
                          className="cc-analytics-earner-fill"
                          style={{
                            width: `${maxEarner > 0 ? Math.max(6, (e.coins / maxEarner) * 100) : 0}%`,
                          }}
                        />
                      </span>
                    </span>
                    <span className="cc-analytics-earner-coins">
                      <Coins size={13} />
                      {num(e.coins)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </section>
      )}
    </div>
  );
}
