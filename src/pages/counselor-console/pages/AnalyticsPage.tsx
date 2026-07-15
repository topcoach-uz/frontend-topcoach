import { useMemo, useState, type ReactNode } from 'react';
import { Skeleton } from 'antd';
import {
  Building2,
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  Gauge,
  Sparkles,
  Coins,
  CalendarClock,
  CalendarDays,
  Trophy,
  Users,
  UserPlus,
  Info,
} from 'lucide-react';
import { useCounselorConsole } from '../CounselorConsoleContext';
import {
  useGetOrgAnalyticsQuery,
  useGetOrgDashboardQuery,
  type OrgAnalyticsRange,
} from 'src/app/services/counselorConsoleApi';
import { CcStat } from '../components/CcStat';
import {
  CcChart,
  CC_SERIES,
  CC_SURFACE,
  ccProgramColor,
  ccRampFor,
  ccTint,
  ccAreaWash,
  ccTooltipFormatter,
  type EChartsCoreOption,
} from '../charts/ccEcharts';
import './AnalyticsPage.scss';

/* ── One chart system ──────────────────────────────────────────────────────
   Every chart on this page renders through <CcChart> (Apache ECharts, SVG
   renderer) using the shared 'cc' theme registered in charts/ccEcharts.tsx.
   Pages only supply data + which series to draw — the editorial palette,
   typography, gridlines and cream-on-ink tooltip all live in the theme.

   The forms here are chosen per tab by the data's JOB, not by variety:
     · Overview   — leads with RETROACTIVE truth (monthly joins, computed from
                    join dates, so it works on day one). The snapshot-derived
                    daily history is a progressive enhancement: three measures
                    on three DIFFERENT scales → small multiples with one linked
                    crosshair. Never a dual axis.
     · Sessions   — booked vs attended is a RATIO → state the rate, don't make
                    the reader divide two bars.
     · Programs   — completed ⊆ enrolled → one bar per program, filled portion
                    = completed. avgProgress gets its own 0–100 chart.
     · AI         — attempts vs completed is a RATIO (same meter as Sessions);
                    usageByType is NOMINAL → one hue, ranked.
     · Coins      — earned vs redeemed is a RATIO; topEarners is a ranked list.

   The rate meter is deliberately shared across Sessions / AI / Coins: three
   tabs asking "what share of X became Y" should answer in the same shape. */

/* ── Time range ──────────────────────────────────────────────────────────────
   `value` is what the analytics endpoint takes; `months` is the same window
   expressed in whole calendar months, which is the only unit the monthly joins
   series on Overview can honour. 12 months is not an arbitrary cap: the joins
   series only ever covers the last 12 months, so "12 months" is exactly its
   full extent. */
const RANGES: {
  value: OrgAnalyticsRange;
  label: string;
  months: number;
}[] = [
  { value: '30d', label: '30 days', months: 1 },
  { value: '90d', label: '90 days', months: 3 },
  { value: '365d', label: '12 months', months: 12 },
];

/** "this month" / "the last N months" — for prose about the monthly series. */
function monthsLabel(months: number): string {
  return months <= 1 ? 'this month' : `the last ${months} months`;
}

/* ── Section tabs ────────────────────────────────────────────────────────────
   The page's sections are horizontal tabs rather than a long vertical scroll.
   The range selector above stays global and every tab honours it. On Overview
   it drives the monthly joins chart, the daily small multiples and the change
   figures on the tiles; the tile VALUES are present-tense counts of what is
   true right now, which no window can scope, and they say so. Order: Overview,
   Sessions, Programs, AI, Coins (the old Events, Admissions and Engagement
   tabs have been removed). */
type TabKey = 'trend' | 'sessions' | 'programs' | 'ai' | 'coins';

const TABS: { key: TabKey; label: string; icon: ReactNode }[] = [
  { key: 'trend', label: 'Overview', icon: <TrendingUp size={15} /> },
  { key: 'sessions', label: 'Sessions', icon: <CalendarClock size={15} /> },
  { key: 'programs', label: 'Programs', icon: <GraduationCap size={15} /> },
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

function num(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString();
}

/** Whole-percent share, guarded against a zero denominator. */
function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/* Typography constants mirrored from the 'cc' theme, for the few places a chart
   must set label text itself. Text wears TEXT tokens, never the series colour. */
const TEXT = '#1c1a17';
const TEXT_MUTED = '#9a8f7d';
const SANS =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/** Small-caps eyebrow used as a panel title inside a chart. */
const panelTitleStyle = {
  fontFamily: SANS,
  fontSize: 10.5,
  fontWeight: 700,
  color: TEXT_MUTED,
  // ECharts has no letter-spacing; the caps + weight carry the eyebrow read.
};

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
  footer,
  className = '',
}: {
  title: string;
  sub?: string;
  hasData: boolean;
  /* Optional: a card whose data is gated by its CALLER (rendered only when it
     has something to show) has no empty state of its own to describe. */
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyText?: string;
  children: ReactNode;
  /** Key / caption rail under the plot (doubles as the readable value list). */
  footer?: ReactNode;
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
        <>
          <div className="cc-analytics-chart">{children}</div>
          {footer ? (
            <div className="cc-analytics-card-foot">{footer}</div>
          ) : null}
        </>
      ) : (
        <div className="cc-analytics-empty">
          {emptyIcon ? (
            <span className="cc-analytics-empty-ico">{emptyIcon}</span>
          ) : null}
          {emptyTitle ? (
            <div className="cc-analytics-empty-title">{emptyTitle}</div>
          ) : null}
          {emptyText ? (
            <div className="cc-analytics-empty-text">{emptyText}</div>
          ) : null}
        </div>
      )}
    </section>
  );
}

/* ── The rate meter ──────────────────────────────────────────────────────────
   A ratio against a limit is a METER, not two bars the reader has to divide.
   Shared by Sessions (attendance), AI (Major Match completion) and Coins
   (redemption) so the same question always answers in the same shape.

   The track is a light step of the fill's own hue (the ramp's own light end),
   so the whole bar reads as one scale. The figure is text-token ink; the fill
   beside it carries identity. */
function CcRateMeter({
  eyebrow,
  part,
  whole,
  caption,
  emptyCaption,
}: {
  eyebrow: string;
  part: number;
  whole: number;
  caption: string;
  /** Shown instead of the rate when the denominator is zero — a rate out of
   *  nothing is not 0%, it is undefined, and printing "0%" would be a lie. */
  emptyCaption: string;
}) {
  const known = whole > 0;
  const rate = pct(part, whole);
  return (
    <div className="cc-analytics-meter">
      <div className="cc-analytics-meter-eyebrow">{eyebrow}</div>
      <div className="cc-analytics-meter-figure">
        {known ? (
          <>
            <span className="cc-analytics-meter-val">{rate}</span>
            <span className="cc-analytics-meter-unit">%</span>
          </>
        ) : (
          <span className="cc-analytics-meter-none">—</span>
        )}
      </div>
      <div
        className="cc-analytics-meter-track"
        role="img"
        aria-label={
          known
            ? `${eyebrow}: ${rate} percent. ${caption}`
            : `${eyebrow}: ${emptyCaption}`
        }
      >
        {known ? (
          <span
            className="cc-analytics-meter-fill"
            style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
          />
        ) : null}
      </div>
      <p className="cc-analytics-meter-caption">
        {known ? caption : emptyCaption}
      </p>
    </div>
  );
}

/** A key row: a coloured mark carrying identity, with text in text tokens. */
function CcKey({
  items,
}: {
  items: { color: string; label: string; value?: string }[];
}) {
  return (
    <ul className="cc-analytics-key">
      {items.map((it) => (
        <li className="cc-analytics-key-item" key={it.label}>
          <span
            className="cc-analytics-key-swatch"
            style={{ background: it.color }}
            aria-hidden
          />
          <span className="cc-analytics-key-label">{it.label}</span>
          {it.value ? (
            <span className="cc-analytics-key-val">{it.value}</span>
          ) : null}
        </li>
      ))}
    </ul>
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

  /* Overview's day-one source. `analytics.history` is written by a NIGHTLY
     rollup (org_daily_metrics), so for any org younger than the first cron run
     it is empty — and after one night it is a single point, which is not a
     trend. The dashboard payload is computed from live rows instead, so it is
     true the moment an org exists. Overview leads with it; history enhances.

     This endpoint takes no range — it always returns present-tense totals plus
     the last 12 months of joins. The selected window is therefore applied to
     its output HERE (see `joinsInWindow`), never pretended at: the totals are
     "right now" by nature and are labelled that way. */
  const { data: dashboard } = useGetOrgDashboardQuery(orgId as string, {
    skip: !orgId,
  });

  const rangeMonths =
    RANGES.find((r) => r.value === range)?.months ?? RANGES[1].months;

  /* ── Derived, memoized chart datasets (shapes unchanged) ── */
  const historyData = useMemo(() => data?.history ?? [], [data?.history]);

  /* Monthly student joins, derived from membership `createdAt` — retroactive by
     construction. The backend zero-fills the last 12 months and returns them
     oldest → newest, always ending with the current month, so the series is
     always exactly 12 points. */
  const enrollmentTrends = useMemo(
    () => dashboard?.enrollmentTrends ?? [],
    [dashboard?.enrollmentTrends],
  );

  /* The selected window, applied. Because the series is a fixed 12 points
     ending at the current month, taking the last N months IS the window — no
     interpolation, no invented buckets, and at 12 months it is the whole
     series. Sub-month precision is not available and is not faked: a 30-day
     window shows the current month, which is the finest this data supports. */
  const joinsInWindow = useMemo(
    () => enrollmentTrends.slice(-rangeMonths),
    [enrollmentTrends, rangeMonths],
  );

  const programData = useMemo(
    () => data?.programs.byProgram ?? [],
    [data?.programs.byProgram],
  );

  const distributionData = useMemo(
    () => data?.programs.progressDistribution ?? [],
    [data?.programs.progressDistribution],
  );

  const aiUsageData = useMemo(
    () => data?.ai.usageByType ?? [],
    [data?.ai.usageByType],
  );

  const sessionsByMonth = useMemo(
    () => data?.sessions.byMonth ?? [],
    [data?.sessions.byMonth],
  );

  /* ══ Overview lead — students joined per month ════════════════════════════
     One measure over ordered time → ONE colour for every column (nominal-vs-
     ordered doesn't matter here: it is a single measure, so a ramp would
     double-encode height as hue).

     Columns, not a line: these are discrete monthly counts, not a continuous
     level. (The Dashboard plots the same series as a filled area line named
     "Students", which reads as total student count over time — it isn't; it is
     joins per month, and September's 4 does not mean the org had 4 students.)

     NOT cumulative: the series only counts joins inside the window, so a
     running total would silently omit every student who joined earlier and
     would disagree with the Students tile above it. */
  const enrollmentOption = useMemo<EChartsCoreOption>(
    () => ({
      ...cartesianBase(false),
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: ccTooltipFormatter({
          valueSuffix: ' joined',
          bySeries: false,
        }),
      },
      xAxis: {
        type: 'category',
        data: joinsInWindow.map((t) => formatMonth(t.month)),
        axisLabel: { interval: 0, hideOverlap: true },
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'bar',
          name: 'Students joined',
          data: joinsInWindow.map((t) => t.count),
          color: CC_SERIES.maroon,
          barMaxWidth: 28,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          label: {
            show: true,
            position: 'top',
            /* An empty month's zero is already shown by the absent bar —
               printing "0" twelve times would be louder than the data. */
            formatter: (p: { value: number }) =>
              p.value > 0 ? num(p.value) : '',
            color: TEXT_MUTED,
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 600,
          },
        },
      ],
    }),
    [joinsInWindow],
  );

  /* ══ Overview history — SMALL MULTIPLES ═══════════════════════════════════
     students (a count), activeStudents (a count with a much smaller range) and
     avgProgress (a percentage) do not share a scale. Plotting them on one axis
     would either flatten the two small series into the floor or, with a second
     axis, invent a correlation by arbitrary scale alignment.

     Instead: three stacked panels, each with its OWN y-scale, sharing one
     x-axis — and ONE crosshair linked across all three, so a single hover still
     reads all three measures at the same date. Each panel is one series, so no
     panel needs a legend or a hue of its own: the panel title names it.

     `applicationsSubmitted` is deliberately NOT plotted. It exists in the
     payload but application creation was never adopted, so the series is a flat
     zero — drawing it would imply a measured "no activity" finding rather than
     an unused feature. (The old chart plotted it, and additionally gave it the
     SAME gold as Active students — two different series, one colour.) */
  const trendOption = useMemo<EChartsCoreOption>(() => {
    const dates = historyData.map((h) => h.date);
    const PANEL_H = 68;
    const PANEL_GAP = 44;
    const TOP = 22;
    const tops = [TOP, TOP + PANEL_H + PANEL_GAP, TOP + 2 * (PANEL_H + PANEL_GAP)];

    const panels = [
      {
        name: 'Students',
        values: historyData.map((h) => h.students),
        suffix: '',
        axisSuffix: '',
      },
      {
        name: 'Active students',
        values: historyData.map((h) => h.activeStudents),
        suffix: '',
        axisSuffix: '',
      },
      {
        name: 'Avg progress',
        values: historyData.map((h) => Math.round(h.avgProgress ?? 0)),
        suffix: '%',
        axisSuffix: '%',
      },
    ];

    return {
      /* One crosshair, all three panels. */
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
        label: { show: false },
      },
      tooltip: {
        trigger: 'axis',
        formatter: ccTooltipFormatter({
          heading: (r) => formatDay(r),
          suffixBySeries: { 'Avg progress': '%' },
        }),
      },
      title: panels.map((p, i) => ({
        text: p.name.toUpperCase(),
        left: 0,
        top: tops[i] - 18,
        textStyle: panelTitleStyle,
      })),
      grid: tops.map((top) => ({
        left: 46,
        right: 58,
        top,
        height: PANEL_H,
      })),
      xAxis: panels.map((_, i) => ({
        type: 'category' as const,
        gridIndex: i,
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: 'rgba(28, 25, 23, 0.08)' } },
        /* Only the bottom panel carries date labels — the panels are aligned,
           so repeating them three times would be noise. */
        axisLabel:
          i === panels.length - 1
            ? { formatter: (v: string) => formatDay(v), hideOverlap: true }
            : { show: false },
      })),
      yAxis: panels.map((p, i) => ({
        type: 'value' as const,
        gridIndex: i,
        minInterval: 1,
        /* Each panel scales to its own measure — that is the point. */
        splitNumber: 2,
        axisLabel: {
          formatter: (v: number) => `${v}${p.axisSuffix}`,
          showMinLabel: false,
        },
      })),
      series: panels.map((p, i) => ({
        type: 'line' as const,
        name: p.name,
        xAxisIndex: i,
        yAxisIndex: i,
        data: p.values,
        color: CC_SERIES.maroon,
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        lineStyle: { width: 2 },
        areaStyle: { color: ccAreaWash(CC_SERIES.maroon) },
        /* Label the endpoint only — never a number on every point. */
        endLabel: {
          show: true,
          formatter: (params: { value: number }) =>
            `${num(params.value)}${p.suffix}`,
          color: TEXT,
          fontFamily: SANS,
          fontSize: 11.5,
          fontWeight: 600,
          distance: 6,
        },
        emphasis: {
          itemStyle: {
            borderColor: CC_SURFACE,
            borderWidth: 2,
          },
        },
      })),
    };
  }, [historyData]);

  /* ══ Sessions by month — single-series volume column ═══════════════════════
     One measure over ordered time → one colour for every column. Note this is
     BOOKED per month only; the payload carries no attended-per-month, so an
     attendance-rate trend is not available (see the note in the UI). */
  const sessionsOption = useMemo<EChartsCoreOption>(
    () => ({
      ...cartesianBase(false),
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: ccTooltipFormatter({
          valueSuffix: ' booked',
          bySeries: false,
        }),
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
          barMaxWidth: 24,
          /* 4px rounded cap, square at the baseline. */
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    }),
    [sessionsByMonth],
  );

  /* ══ Programs — completed WITHIN enrolled ═════════════════════════════════
     completed is a SUBSET of enrolled, so grouping them as two adjacent bars
     (the old form) asked the reader to eyeball a division to get the only
     number that matters. Instead each program is one bar: the full track is
     enrolled, the filled portion is completed, and the completion rate is
     printed at the tip.

     Colour follows the ENTITY (ccProgramColor) — a program keeps its hue here
     and everywhere else, and the track is a tint of that same hue rather than a
     second categorical colour. The programme names sit on the y-axis, so
     identity never rests on colour at all. */
  const programOption = useMemo<EChartsCoreOption>(() => {
    const rows = [...programData].sort((a, b) => b.enrolled - a.enrolled);
    return {
      grid: { left: 6, right: 56, top: 8, bottom: 4, containLabel: true },
      legend: { show: false },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: ccTooltipFormatter(),
      },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: {
        type: 'category',
        data: rows.map((p) => p.program),
        inverse: true,
        axisLabel: {
          color: TEXT,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: SANS,
        },
      },
      series: [
        {
          type: 'bar',
          name: 'Enrolled',
          data: rows.map((p) => ({
            value: p.enrolled,
            itemStyle: { color: ccTint(ccProgramColor(p.program), 0.22) },
          })),
          barMaxWidth: 20,
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          /* The completion rate rides the ENROLLED series, not the completed
             one: this series' right edge is the end of the full track, so the
             label always clears both marks. (Putting it on the completed series
             parks it at the end of the FILL — i.e. on top of the track it is
             describing — which renders as a collision on every low-completion
             program.) */
          label: {
            show: true,
            position: 'right',
            formatter: (params: { dataIndex: number }) => {
              const r = rows[params.dataIndex];
              return r.enrolled > 0 ? `${pct(r.completed, r.enrolled)}%` : '—';
            },
            color: TEXT_MUTED,
            fontFamily: SANS,
            fontSize: 11.5,
            fontWeight: 600,
          },
        },
        {
          type: 'bar',
          name: 'Completed',
          /* Overlaid, not grouped — completed lives inside enrolled. */
          barGap: '-100%',
          data: rows.map((p) => ({
            value: p.completed,
            itemStyle: { color: ccProgramColor(p.program) },
          })),
          barMaxWidth: 20,
          itemStyle: { borderRadius: [0, 4, 4, 0] },
        },
      ],
    };
  }, [programData]);

  /* ══ Average progress by program ══════════════════════════════════════════
     avgProgress was in the payload but went unplotted entirely. It is a
     percentage per program, so it gets its own 0–100 chart rather than being
     forced onto the enrolment count's axis. */
  const programProgressOption = useMemo<EChartsCoreOption>(() => {
    const rows = [...programData].sort((a, b) => b.avgProgress - a.avgProgress);
    return {
      grid: { left: 6, right: 44, top: 8, bottom: 4, containLabel: true },
      legend: { show: false },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: ccTooltipFormatter({ valueSuffix: '%', bySeries: false }),
      },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: (v: number) => `${v}%` },
      },
      yAxis: {
        type: 'category',
        data: rows.map((p) => p.program),
        inverse: true,
        axisLabel: {
          color: TEXT,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: SANS,
        },
      },
      series: [
        {
          type: 'bar',
          name: 'Avg progress',
          barMaxWidth: 20,
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          data: rows.map((p) => ({
            value: Math.round(p.avgProgress ?? 0),
            name: p.program,
            itemStyle: { color: ccProgramColor(p.program) },
          })),
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: TEXT_MUTED,
            fontFamily: SANS,
            fontSize: 11.5,
            fontWeight: 600,
          },
        },
      ],
    };
  }, [programData]);

  /* ══ Progress distribution — a histogram ══════════════════════════════════
     Ordered bands (0–20%, 20–40%, …) that sum to the cohort. Ordered → a
     SEQUENTIAL single-hue ramp, sampled to the actual band count so the light→
     dark read holds no matter how many buckets the backend returns. (The old
     code indexed a 5-stop ramp with `i % 5`, which would wrap a 6th band back
     to the lightest colour and invert the ordering.) */
  const distributionOption = useMemo<EChartsCoreOption>(() => {
    const ramp = ccRampFor(distributionData.length);
    return {
      ...cartesianBase(false),
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: ccTooltipFormatter({
          valueSuffix: ' students',
          bySeries: false,
        }),
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
          /* A histogram's bands are contiguous — a small, even gap, not the
             wide slots of a categorical bar chart. The width cap matters as
             much as the gap: uncapped in a full-width card these become ~130px
             slabs of saturated colour, which reads loud and childish however
             correct the ramp is. Capped + half-width card, the bands sit close
             enough to read as a distribution. */
          barCategoryGap: '18%',
          barMaxWidth: 72,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: distributionData.map((d, i) => ({
            value: d.count,
            name: d.bucket,
            itemStyle: { color: ramp[i] },
          })),
          label: {
            show: true,
            position: 'top',
            color: TEXT_MUTED,
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 600,
          },
        },
      ],
    };
  }, [distributionData]);

  /* ══ AI usage by type — NOMINAL, so ONE hue ═══════════════════════════════
     AI tool names have no natural order. The old chart ramped them light→dark
     by slot index, which double-encodes bar length as hue: it makes the biggest
     bar darkest, implying a magnitude scale the categories don't have, and
     re-colours every tool the moment the ranking shifts. One measure across
     nominal categories → one colour for every bar, ranked, labelled at the tip. */
  const aiUsageOption = useMemo<EChartsCoreOption>(() => {
    const rows = [...aiUsageData].sort((a, b) => b.count - a.count);
    return {
      grid: { left: 6, right: 44, top: 8, bottom: 4, containLabel: true },
      legend: { show: false },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: ccTooltipFormatter({ valueSuffix: ' uses', bySeries: false }),
      },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: {
        type: 'category',
        data: rows.map((a) => a.type),
        inverse: true,
        axisLabel: {
          color: TEXT,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: SANS,
        },
      },
      series: [
        {
          type: 'bar',
          name: 'Uses',
          data: rows.map((a) => a.count),
          color: CC_SERIES.maroon,
          barMaxWidth: 20,
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          label: {
            show: true,
            position: 'right',
            formatter: (params: { value: number }) => num(params.value),
            color: TEXT_MUTED,
            fontFamily: SANS,
            fontSize: 11.5,
            fontWeight: 600,
          },
        },
      ],
    };
  }, [aiUsageData]);

  const header = (
    <div className="cc-analytics-header">
      <div className="cc-analytics-header-copy">
        <div className="cc-page-eyebrow">
          <span className="cc-page-eyebrow-accent">Insights</span>
          {org ? <span>· {org.name}</span> : null}
        </div>
        <h1 className="cc-page-title">Analytics</h1>
        <p className="cc-page-lead">
          A broad view of your organization — sessions, programs, AI usage, and
          coins across your selected window.
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
          <div className="cc-analytics-message-title">
            Select an organization
          </div>
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
          <div className="cc-analytics-message-title">
            Couldn’t load analytics
          </div>
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
  const topEarners = data.coins.topEarners ?? [];
  const maxEarner = topEarners.reduce((m, e) => Math.max(m, e.coins), 0);
  const communityMembers = data.programs.communityMembers ?? 0;
  const programsAllZero =
    programData.length > 0 && programData.every((p) => p.enrolled === 0);

  const sessionsBooked = data.sessions.booked ?? 0;
  const sessionsAttended = data.sessions.attended ?? 0;
  const sessionsUpcoming = data.sessions.upcoming ?? 0;
  const hasSessionData =
    sessionsBooked > 0 ||
    sessionsAttended > 0 ||
    sessionsUpcoming > 0 ||
    sessionsByMonth.length > 0;

  const coinsEarned = data.coins.totalEarned ?? 0;
  const coinsRedeemed = data.coins.totalRedeemed ?? 0;

  /* ── Overview figures ──
     Present-tense truth comes from the dashboard payload (live rows → correct
     on day one). `history` is only consulted for the delta across the window,
     and only when there is enough of it to HAVE a delta. Oldest → newest. */
  const first = historyData[0];
  const last = historyData[historyData.length - 1];
  /* One snapshot is a reading, not a trend — two is the minimum that can show
     direction. Below that the small multiples are suppressed entirely. */
  const hasHistoryTrend = historyData.length >= 2;
  const delta = (a?: number, b?: number) => {
    if (a == null || b == null) return undefined;
    const d = Math.round(a - b);
    return `${d > 0 ? '+' : ''}${num(d)}`;
  };

  const totalStudents = dashboard?.totalStudents ?? last?.students ?? 0;
  const activeStudents = dashboard?.activeStudents ?? last?.activeStudents ?? 0;
  const avgProgress = Math.round(
    dashboard?.avgProgress ?? last?.avgProgress ?? 0,
  );
  const newThisMonth = dashboard?.newThisMonth ?? 0;
  /* Scoped to the window, so the empty state answers "no joins in THIS window"
     rather than "no joins ever" — the difference the reader acts on. */
  const hasJoins = joinsInWindow.some((t) => t.count > 0);
  const hasJoinsEver = enrollmentTrends.some((t) => t.count > 0);
  const windowLabel = monthsLabel(rangeMonths);

  return (
    <div className="cc-analytics" aria-busy={isFetching}>
      {header}

      <div
        className="cc-analytics-tabs"
        role="tablist"
        aria-label="Analytics sections"
      >
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

      {/* ══ Overview ══ */}
      {activeTab === 'trend' && (
        <section
          className="cc-analytics-section"
          role="tabpanel"
          id="cc-analytics-panel-trend"
          aria-labelledby="cc-analytics-tab-trend"
        >
          <SectionHead
            eyebrow="Overview"
            title="Where your organization stands"
            sub={`Students, activity and progress as they are right now, plus who joined month by month over ${windowLabel}.`}
          />
          {/* Present-tense truth first. These come from live rows, not from the
              nightly snapshot table, so they are correct on an org's first day
              — which is exactly when a blank flagship tab is most damaging. */}
          <div className="cc-stat-grid cc-analytics-stat-row">
            <CcStat
              tone="info"
              icon={<Users size={15} />}
              label="Students"
              value={num(totalStudents)}
              meta={
                hasHistoryTrend
                  ? `${delta(last?.students, first?.students)} across the window`
                  : 'in your organization today'
              }
            />
            <CcStat
              tone="good"
              icon={<TrendingUp size={15} />}
              label="Active students"
              value={num(activeStudents)}
              meta={
                totalStudents > 0
                  ? `${pct(activeStudents, totalStudents)}% of all students`
                  : 'active recently'
              }
            />
            <CcStat
              tone="neutral"
              icon={<Gauge size={15} />}
              label="Avg progress"
              value={`${avgProgress}%`}
              meta={
                hasHistoryTrend
                  ? `${delta(last?.avgProgress, first?.avgProgress)} pts across the window`
                  : 'across enrolled programs'
              }
            />
            <CcStat
              tone="info"
              icon={<UserPlus size={15} />}
              label="New this month"
              value={num(newThisMonth)}
              meta="students joined this month"
            />
          </div>

          {/* The lead chart: computed from join dates, so it has real history
              from the first day rather than from the first nightly rollup. */}
          <div className="cc-analytics-grid">
            <ChartCard
              title="Students joined by month"
              sub={
                rangeMonths <= 1
                  ? 'New students who joined this month'
                  : `New students per month over ${windowLabel}`
              }
              hasData={hasJoins}
              emptyIcon={<UserPlus size={20} />}
              emptyTitle={`No joins ${rangeMonths <= 1 ? 'this month' : `in ${windowLabel}`}`}
              emptyText={
                totalStudents === 0
                  ? 'Once students accept an invitation and join your organization, their joins are charted here by month.'
                  : hasJoinsEver
                    ? 'None of your students joined inside this window. Widen the range to see earlier joins.'
                    : `All ${num(totalStudents)} of your students joined more than a year ago, which is as far back as this chart reaches.`
              }
              className="cc-analytics-card--wide"
              footer={
                <p className="cc-analytics-caption">
                  <Info size={13} />
                  Counted from each student’s join date, so every month is
                  complete. This chart follows the selected range
                  {hasHistoryTrend
                    ? ', as do the change figures on the tiles above — their values are counts as of today.'
                    : '; the tile values above are counts as of today.'}
                </p>
              }
            >
              <CcChart option={enrollmentOption} height={248} />
            </ChartCard>
          </div>

          {/* Progressive enhancement. Daily snapshots only exist from the day
              tracking began for this org, so this section appears once there
              are at least two of them — a single point cannot show direction. */}
          {hasHistoryTrend ? (
            <div className="cc-analytics-grid cc-analytics-grid--stacked">
              <ChartCard
                title="Growth & activity"
                sub="Three measures, three scales — hover to read all three at one date."
                hasData
                className="cc-analytics-card--wide"
              >
                <CcChart option={trendOption} height={348} />
              </ChartCard>
            </div>
          ) : (
            <p className="cc-analytics-note">
              <Info size={13} />
              Day-by-day trends appear here once there are at least two daily
              snapshots. Snapshots are recorded nightly and start from when
              tracking began for this organization — the figures above are
              current either way.
            </p>
          )}
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
              <div className="cc-analytics-grid cc-analytics-grid--split">
                <section className="cc-analytics-card cc-analytics-card--meter">
                  <CcRateMeter
                    eyebrow="Attendance rate"
                    part={sessionsAttended}
                    whole={sessionsBooked}
                    caption={`${num(sessionsAttended)} of ${num(sessionsBooked)} booked sessions were attended.`}
                    emptyCaption="No sessions were booked in this window, so there is no attendance rate to report."
                  />
                </section>
                <div className="cc-stat-grid cc-analytics-stat-col">
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
                    meta="sessions that took place"
                  />
                  <CcStat
                    tone="neutral"
                    icon={<CalendarClock size={15} />}
                    label="Upcoming"
                    value={num(sessionsUpcoming)}
                    meta="scheduled but not yet held"
                  />
                </div>
              </div>
              <div className="cc-analytics-grid">
                <ChartCard
                  title="Sessions booked by month"
                  sub="Booking volume over time"
                  hasData={sessionsByMonth.length > 0}
                  emptyIcon={<CalendarDays size={20} />}
                  emptyTitle="No monthly breakdown yet"
                  emptyText="Monthly session volume appears here as sessions are booked over time."
                  className="cc-analytics-card--wide"
                  footer={
                    <p className="cc-analytics-caption">
                      <Info size={13} />
                      Monthly figures cover sessions <em>booked</em>. Attendance
                      is only available as a window total, so the rate above
                      can’t yet be broken out per month.
                    </p>
                  }
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
                    Once your students book 1:1 mentor sessions, you’ll see
                    booked, attended, and upcoming counts here — plus monthly
                    volume.
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
          {/* Completion leads at full width — it is the tab's headline. */}
          <div className="cc-analytics-grid">
            <ChartCard
              title="Completion by program"
              sub="Filled portion of each bar is completed; the rate is at the tip"
              hasData={programData.length > 0}
              emptyIcon={<GraduationCap size={20} />}
              emptyTitle="No program data"
              emptyText="Program enrollment shows here once students are enrolled."
              className="cc-analytics-card--wide"
              footer={
                <CcKey
                  items={[
                    { color: CC_SERIES.maroon, label: 'Completed' },
                    {
                      color: ccTint(CC_SERIES.maroon, 0.22),
                      label: 'Enrolled (full track)',
                    },
                  ]}
                />
              }
            >
              <CcChart option={programOption} height={228} />
            </ChartCard>
          </div>
          <div className="cc-analytics-grid cc-analytics-grid--2 cc-analytics-grid--stacked">
            <ChartCard
              title="Average progress by program"
              sub="Mean completion of enrolled students"
              hasData={programData.length > 0}
              emptyIcon={<Gauge size={20} />}
              emptyTitle="No progress data"
              emptyText="Average progress appears once students start their programs."
            >
              <CcChart option={programProgressOption} height={228} />
            </ChartCard>

            <ChartCard
              title="Progress distribution"
              sub="How many students sit in each completion band"
              hasData={distributionData.length > 0}
              emptyIcon={<Gauge size={20} />}
              emptyTitle="No progress data"
              emptyText="Progress buckets appear once students start their programs."
            >
              <CcChart option={distributionOption} height={228} />
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
          <div className="cc-analytics-grid cc-analytics-grid--split">
            <section className="cc-analytics-card cc-analytics-card--meter">
              <CcRateMeter
                eyebrow="Major Match completion"
                part={mmCompleted}
                whole={mmAttempts}
                caption={`${num(mmCompleted)} of ${num(mmAttempts)} students who started Major Match finished it.`}
                emptyCaption="No students have started Major Match in this window, so there is no completion rate to report."
              />
            </section>
            <div className="cc-stat-grid cc-analytics-stat-col">
              <CcStat
                tone="info"
                icon={<Sparkles size={15} />}
                label="Attempts"
                value={num(mmAttempts)}
                meta="students who started"
              />
              <CcStat
                tone="good"
                icon={<Sparkles size={15} />}
                label="Completed"
                value={num(mmCompleted)}
                meta="students who finished"
              />
            </div>
          </div>
          <div className="cc-analytics-grid cc-analytics-grid--stacked">
            <ChartCard
              title="AI usage by tool"
              sub="Interactions per tool, most used first"
              hasData={aiUsageData.length > 0}
              emptyIcon={<Sparkles size={20} />}
              emptyTitle="No AI usage yet"
              emptyText="Usage appears here as students use AI tools."
              className="cc-analytics-card--wide"
            >
              <CcChart
                option={aiUsageOption}
                height={Math.max(160, aiUsageData.length * 40 + 24)}
              />
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
          <div className="cc-analytics-grid cc-analytics-grid--split">
            <section className="cc-analytics-card cc-analytics-card--meter">
              <CcRateMeter
                eyebrow="Redemption rate"
                part={coinsRedeemed}
                whole={coinsEarned}
                caption={`${num(coinsRedeemed)} of ${num(coinsEarned)} coins earned have been spent.`}
                emptyCaption="No coins have been earned in this window, so there is no redemption rate to report."
              />
            </section>
            <div className="cc-stat-grid cc-analytics-stat-col">
              <CcStat
                tone="good"
                icon={<Coins size={15} />}
                label="Coins earned"
                value={num(coinsEarned)}
                meta="across all students"
              />
              <CcStat
                tone="neutral"
                icon={<Coins size={15} />}
                label="Coins redeemed"
                value={num(coinsRedeemed)}
                meta="spent in the marketplace"
              />
            </div>
          </div>
          <div className="cc-analytics-grid cc-analytics-grid--stacked">
            {/* A ranked list of named people is a LIST — reading names off a
                category axis is worse than reading them off rows. The bar is a
                magnitude cue beside the name, not the chart. */}
            <section className="cc-analytics-card cc-analytics-card--wide">
              <div className="cc-analytics-card-head">
                <div>
                  <h3 className="cc-analytics-card-title">Top earners</h3>
                  <p className="cc-analytics-card-sub">
                    Students with the most coins earned
                  </p>
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
                        <span className="cc-analytics-earner-name">
                          {e.name}
                        </span>
                        <span className="cc-analytics-earner-bar">
                          <span
                            className="cc-analytics-earner-fill"
                            style={{
                              width: `${
                                maxEarner > 0
                                  ? Math.max(2, (e.coins / maxEarner) * 100)
                                  : 0
                              }%`,
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
