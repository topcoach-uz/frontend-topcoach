import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from 'antd';
import {
  Users,
  UserCheck,
  TrendingUp,
  CalendarClock,
  AlertTriangle,
  LineChart as LineChartIcon,
  ChevronRight,
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
  useGetOrgStudentsQuery,
  type OrgDashboardNeedsAttention,
} from 'src/app/services/counselorConsoleApi';
import { CcStat } from '../components/CcStat';
import { CcEmpty, NoOrgPlaceholder } from '../components/CcEmpty';
import { CcPageHead } from '../components/CcPageHead';
import { CcAvatar } from '../components/CcAvatar';
import {
  CcChart,
  CC_ACCENT,
  ccTooltipFormatter,
  type EChartsCoreOption,
} from '../charts/ccEcharts';
import { ccRampFor } from '../colors';
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

/** Clamp a 0-100 progress reading to a whole percent. */
function clampPct(value: number | null | undefined): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Readable ink for a label sitting ON a ramp segment. `ccRampFor` returns
 * `rgb(...)` strings; the light end of the maroon ramp needs dark ink and the
 * dark end needs cream. Both returns are tokens, never raw hex.
 */
function inkOnBand(color: string): string {
  const parts = color.match(/\d+/g);
  if (!parts || parts.length < 3) return 'var(--cc-bg-surface)';
  const [r, g, b] = parts.map(Number);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? 'var(--cc-text)' : 'var(--cc-bg-surface)';
}

/** Below this many students a distribution is noise, so we name names instead. */
const NAMED_LIST_MAX = 8;

/** A segment narrower than this can't hold its own label; the key carries it. */
const DIRECT_LABEL_MIN_SHARE = 12;

export default function CounselorConsoleDashboardPage() {
  const { org, orgId, branchId } = useCounselorConsole();
  const navigate = useNavigate();
  const { data, isLoading, isFetching, isError } = useGetOrgDashboardQuery(
    { orgId: orgId as string, branchId },
    { skip: !orgId },
  );

  // Program participation is pulled from the broad analytics endpoint (a 90d
  // snapshot is plenty for an at-a-glance count on the dashboard).
  const { data: analytics, isLoading: analyticsLoading } =
    useGetOrgAnalyticsQuery(
      { orgId: orgId as string, branchId, range: '90d' },
      { skip: !orgId },
    );

  /* ── Progress card, adaptive ──────────────────────────────────────────────
     Small orgs get NAMES; large orgs get a distribution. A 4-bucket histogram
     over 2 students told the counselor nothing they couldn't see by looking at
     their two students, and it silently folded "hasn't started a program" in
     with "is genuinely early" — the two cases that need opposite responses.

     THE INVARIANT, in both modes: bar length and the printed number encode the
     SAME quantity. The old card drew count/peak and printed count/total, so a
     full-width bar could be captioned 40%. Don't reintroduce a second scale. */
  const totalStudents = data?.totalStudents ?? 0;
  const useNamedList = totalStudents > 0 && totalStudents < NAMED_LIST_MAX;

  /* Only the named-list mode needs per-student rows, so the students query is
     skipped entirely for larger orgs. Its loading/error states degrade inside
     the card; they never block it (the flagged students below come from the
     dashboard query and render regardless). */
  const {
    data: studentsPage,
    isLoading: studentsLoading,
    isError: studentsError,
  } = useGetOrgStudentsQuery(
    {
      orgId: orgId as string,
      branchId,
      page: 1,
      limit: NAMED_LIST_MAX,
      // Server-side sort, so the furthest-along student leads the list.
      sort: 'progress:desc',
    },
    { skip: !orgId || !useNamedList },
  );

  const needsAttention: OrgDashboardNeedsAttention[] = useMemo(
    () => data?.needsAttention ?? [],
    [data?.needsAttention],
  );

  /** userId → flag, so a named row can show WHY a student is flagged. */
  const attentionByUser = useMemo(() => {
    const map = new Map<string, OrgDashboardNeedsAttention>();
    needsAttention.forEach((n) => map.set(n.userId, n));
    return map;
  }, [needsAttention]);

  /* Ordered progress bands. `ccRampFor` — NOT the categorical CC_SERIES hues:
     these bands have a natural order, and a nominal palette would throw that
     ordering away. Share is kept unrounded for geometry and rounded only for
     display, so the segments always sum to the full width. */
  const bands = useMemo(() => {
    const buckets = analytics?.programs.progressDistribution ?? [];
    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    const ramp = ccRampFor(buckets.length);
    return buckets.map((b, i) => {
      const color = ramp[i] ?? ramp[ramp.length - 1];
      return {
        key: `${b.bucket}-${i}`,
        bucket: b.bucket,
        count: b.count,
        share: total > 0 ? (b.count / total) * 100 : 0,
        color,
        ink: inkOnBand(color),
      };
    });
  }, [analytics?.programs.progressDistribution]);

  const bandTotal = bands.reduce((sum, b) => sum + b.count, 0);

  /* ── Profile completeness ─────────────────────────────────────────────────
     `avgProfileCompletion` is a 0-100 integer averaged over every student in
     the org, taken from `student_profiles.completionPercentage` — a column the
     student profile service genuinely writes on every save, so unlike the old
     last-active reading this one reflects real work.

     A 0% average is therefore a FINDING, not a broken card: Major Match and the
     AI essay and major guidance read from these profiles, so 0% means those
     features are running on nothing. The card is built to make that legible. */
  const avgCompletion = clampPct(data?.avgProfileCompletion);

  /* Per-student rows, reusing the SAME students query the progress card already
     runs in named-list mode (same 8-student threshold, no second request). The
     rows are re-sorted here by completion, so the emptiest profile is easy to
     find; the query's own sort is by program progress. */
  const completionRows = useMemo(() => {
    const items = studentsPage?.items ?? [];
    return items
      .map((s) => ({
        userId: s.userId,
        name: s.name,
        avatarUrl: s.avatarUrl,
        completion: clampPct(s.profileCompletion),
      }))
      .sort(
        (a, b) => a.completion - b.completion || a.name.localeCompare(b.name),
      );
  }, [studentsPage?.items]);

  /* Profile completion splits into three states a counselor can act on
     differently: untouched, part-filled, and done. Counting them here keeps
     the summary line factual rather than advisory, and lets the all-untouched
     and all-done cases read as their own plain statements instead of being
     described as if they were the mixed case. */
  const profileSplit = useMemo(() => {
    const notStarted = completionRows.filter((r) => r.completion === 0).length;
    const complete = completionRows.filter((r) => r.completion === 100).length;
    return {
      notStarted,
      complete,
      inProgress: completionRows.length - notStarted - complete,
      total: completionRows.length,
    };
  }, [completionRows]);

  /* Reads as a list of what is actually there: empty categories are dropped
     rather than printed as "0 complete". */
  const profileSummary = useMemo(() => {
    const { notStarted, inProgress, complete, total } = profileSplit;
    if (!total) return '';
    if (complete === total) return 'All profiles complete.';
    if (notStarted === total) return 'No profiles started yet.';
    return [
      notStarted ? `${notStarted} not started` : '',
      inProgress ? `${inProgress} in progress` : '',
      complete ? `${complete} complete` : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }, [profileSplit]);

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
    <CcPageHead
      eyebrow="Overview"
      orgName={org?.name}
      title="Dashboard"
      lead="A live snapshot of your organization: enrollment, engagement and application progress. It also surfaces the students who need attention right now."
    />
  );

  // ── No organization selected ──
  if (!orgId) {
    return (
      <div className="cc-dash">
        {header}
        <NoOrgPlaceholder
          title="Select an organization"
          text="Choose an organization from the switcher to see its overview."
        />
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
        <NoOrgPlaceholder
          icon={<AlertTriangle size={22} />}
          title="Couldn’t load the dashboard"
          text="Something went wrong fetching this organization’s overview. Please refresh, or switch organizations and back."
        />
      </div>
    );
  }

  const students = studentsPage?.items ?? [];

  /* The flagged students, named. This array was already being fetched and was
     rendered nowhere except as a bare count in the KPI tile above. */
  const flaggedBlock =
    needsAttention.length > 0 ? (
      <div className="cc-dash-prog-flags">
        <div className="cc-dash-prog-flags-head">
          Needs attention ({needsAttention.length})
        </div>
        {needsAttention.map((s) => (
          <button
            key={s.userId}
            type="button"
            className="cc-dash-attn-row"
            onClick={() => navigate(`/counselor-console/students/${s.userId}`)}
          >
            <CcAvatar
              name={s.name}
              src={s.avatarUrl}
              size={32}
              className="cc-dash-attn-avatar"
            />
            <span className="cc-dash-attn-main">
              <span className="cc-dash-attn-name">{s.name}</span>
              <span className="cc-dash-attn-reason">
                <span className="cc-dash-attn-dot" aria-hidden="true" />
                {s.reason}
              </span>
            </span>
            <ChevronRight size={16} className="cc-dash-attn-arrow" />
          </button>
        ))}
      </div>
    ) : null;

  /* One 100% stacked bar, four ordered bands. Segment width and the printed
     number are the same share, and the key repeats every value so the bands are
     never told apart by colour alone. */
  const bandBlock = (
    <div className="cc-dash-band">
      <div className="cc-dash-band-bar">
        {bands
          .filter((b) => b.share > 0)
          .map((b) => (
            <span
              key={b.key}
              className="cc-dash-band-seg"
              style={{ flexGrow: b.share, background: b.color, color: b.ink }}
              title={`${b.bucket}: ${Math.round(b.share)}% (${b.count})`}
            >
              {b.share >= DIRECT_LABEL_MIN_SHARE ? (
                <span className="cc-dash-band-seg-label">
                  {Math.round(b.share)}%
                </span>
              ) : null}
            </span>
          ))}
      </div>
      <div className="cc-dash-band-key">
        {bands.map((b) => (
          <span key={b.key} className="cc-dash-band-key-item">
            <span
              className="cc-dash-band-swatch"
              style={{ background: b.color }}
              aria-hidden="true"
            />
            <span className="cc-dash-band-key-label">{b.bucket}</span>
            <span className="cc-dash-band-key-val">
              {Math.round(b.share)}%
            </span>
          </span>
        ))}
      </div>
      <div className="cc-dash-prog-foot">
        {bandTotal.toLocaleString()} student{bandTotal === 1 ? '' : 's'} with
        program progress · {pct(data.avgProgress)} average
      </div>
    </div>
  );

  /* Named rows: bar length IS the printed percentage. */
  const namedBlock = studentsLoading ? (
    <div className="cc-dash-prog-list" aria-hidden>
      {Array.from({ length: Math.min(totalStudents, 4) || 3 }).map((_, i) => (
        <div key={i} className="cc-dash-prog-skel">
          <Skeleton
            active
            avatar={{ size: 34 }}
            title={{ width: '38%' }}
            paragraph={{ rows: 1, width: ['70%'] }}
          />
        </div>
      ))}
    </div>
  ) : (
    <>
      {studentsError || students.length === 0 ? (
        <p className="cc-dash-prog-note">
          Per student progress isn’t available right now. Open Students for the
          full list.
        </p>
      ) : (
        <>
          <div className="cc-dash-prog-list">
            {students.map((s) => {
              const flag = attentionByUser.get(s.userId);
              const p = clampPct(s.progress);
              return (
                <button
                  key={s.userId}
                  type="button"
                  className="cc-dash-prog-row"
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
                  <span className="cc-dash-prog-main">
                    <span className="cc-dash-prog-name">{s.name}</span>
                    <span className="cc-dash-prog-program">
                      {s.topProgram ?? 'No program started'}
                    </span>
                    {flag ? (
                      <span className="cc-dash-prog-chip">
                        <AlertTriangle size={11} aria-hidden="true" />
                        {flag.reason}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="cc-dash-prog-track"
                    role="img"
                    aria-label={`${p}% complete`}
                  >
                    <span
                      className="cc-dash-prog-fill"
                      style={{ width: `${p}%` }}
                    />
                  </span>
                  <span className="cc-dash-prog-pct">{p}%</span>
                </button>
              );
            })}
          </div>
          <div className="cc-dash-prog-foot">
            {totalStudents.toLocaleString()} student
            {totalStudents === 1 ? '' : 's'} · {pct(data.avgProgress)} average
            progress
          </div>
        </>
      )}
    </>
  );

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
              <CcEmpty
                icon={<LineChartIcon size={20} />}
                title="No trend data yet"
                text="Enrollment history will appear here as students join over time."
              />
            ) : (
              <div className="cc-dash-chart">
                <CcChart option={enrollmentOption} />
              </div>
            )}
          </section>

          {/* Program progress — named list for a small org, a distribution
              once names stop fitting. */}
          <section className="cc-dash-card cc-dash-card--fill">
            <div className="cc-dash-card-head">
              <div>
                <h2 className="cc-dash-card-title">
                  {useNamedList ? 'Progress by student' : 'Progress spread'}
                </h2>
                <p className="cc-dash-card-sub">
                  {useNamedList
                    ? 'Each student, their furthest-along program, and why anyone is flagged.'
                    : 'Share of students in each progress band, with everyone flagged for follow-up named below.'}
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

            {!useNamedList && analyticsLoading ? (
              <div className="cc-dash-prog-list" aria-hidden>
                <Skeleton active title={{ width: '30%' }} paragraph={{ rows: 3 }} />
              </div>
            ) : totalStudents === 0 || (!useNamedList && bandTotal === 0) ? (
              <CcEmpty
                icon={<GraduationCap size={20} />}
                title="No progress data yet"
                text="This fills in as students work through their programs."
              />
            ) : (
              <div className="cc-dash-prog">
                {useNamedList ? namedBlock : bandBlock}
                {useNamedList ? null : flaggedBlock}
              </div>
            )}
          </section>
        </div>

        {/* Right rail */}
        <aside className="cc-dash-col cc-dash-col--rail">
          {/* Profile completeness — the average leads, as a number and as one
              meter of the same length. Below it, either every student named
              (small org) or a plain aggregate line. A 0% reading is a real
              finding and is written as one. */}
          <section className="cc-dash-card cc-dash-card--fill">
            <div className="cc-dash-card-head">
              <div>
                <h2 className="cc-dash-card-title">Profile completeness</h2>
                <p className="cc-dash-card-sub">
                  How complete your students' profiles are.
                </p>
              </div>
              <button
                type="button"
                className="cc-dash-card-link"
                onClick={() => navigate('/counselor-console/students')}
              >
                Students <ArrowUpRight size={13} />
              </button>
            </div>

            {totalStudents === 0 ? (
              /* No students at all. Genuinely nothing to measure, which is a
                 different situation from students who have measured 0%. */
              <CcEmpty
                icon={<Users size={20} />}
                title="No students yet"
                text="Invite students and their profile completeness will appear here."
              />
            ) : (
              <div className="cc-dash-pc">
                <div className="cc-dash-pc-hero">
                  <span className="cc-dash-pc-num">{avgCompletion}%</span>
                  <span className="cc-dash-pc-cap">
                    average profile completion across{' '}
                    {totalStudents.toLocaleString()} student
                    {totalStudents === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Meter length IS the printed number. One quantity, one scale;
                    nothing here is normalised against a peak. */}
                <span
                  className="cc-dash-pc-track"
                  role="img"
                  aria-label={`${avgCompletion}% average profile completion`}
                >
                  <span
                    className="cc-dash-pc-fill"
                    style={{ width: `${avgCompletion}%` }}
                  />
                </span>

                {useNamedList && studentsLoading ? (
                  <div className="cc-dash-prog-list" aria-hidden>
                    <Skeleton
                      active
                      title={{ width: '35%' }}
                      paragraph={{ rows: 3 }}
                    />
                  </div>
                ) : useNamedList && !studentsError && completionRows.length ? (
                  <>
                    {/* Least-complete first, so the next action is the top row.
                        Row bar length is that student's own percentage. */}
                    <div className="cc-dash-prog-list">
                      {completionRows.map((r) => (
                        <button
                          key={r.userId}
                          type="button"
                          className="cc-dash-prog-row"
                          onClick={() =>
                            navigate(`/counselor-console/students/${r.userId}`)
                          }
                        >
                          <CcAvatar
                            name={r.name}
                            src={r.avatarUrl}
                            size={34}
                            className="cc-dash-attn-avatar"
                          />
                          <span className="cc-dash-prog-main">
                            <span className="cc-dash-prog-name">{r.name}</span>
                            <span className="cc-dash-prog-program">
                              {r.completion === 0
                                ? 'Not started'
                                : r.completion === 100
                                  ? 'Complete'
                                  : 'In progress'}
                            </span>
                          </span>
                          <span
                            className="cc-dash-prog-track"
                            role="img"
                            aria-label={`${r.completion}% of profile complete`}
                          >
                            <span
                              className="cc-dash-prog-fill"
                              style={{ width: `${r.completion}%` }}
                            />
                          </span>
                          <span className="cc-dash-prog-pct">
                            {r.completion}%
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="cc-dash-prog-foot">{profileSummary}</div>
                  </>
                ) : (
                  /* Too many students to name. Only the org average is
                     available at this size, so state its coverage and stop.
                     The per-student split needs the students list, which is
                     deliberately not fetched for large orgs. */
                  <div className="cc-dash-prog-foot">
                    {studentsError
                      ? 'Individual profiles could not be loaded.'
                      : `Averaged across ${totalStudents.toLocaleString()} students. Open Students for individual profiles.`}
                  </div>
                )}
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
                  // Deep-links the Students page's Invitations tab.
                  to: '/counselor-console/students?tab=invitations',
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
