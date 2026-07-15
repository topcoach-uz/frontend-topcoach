/* ── Counselor Console — SAT Prep program tab ────────────────────────────────
   Read-only drill-down into one student's SAT Prep progress.

   THE SCORING RULE THIS TAB EXISTS TO ENFORCE
   `SatSessionRow.estimatedScore` is a 200–800 PER-SECTION score, produced by
   mock sessions only. It is NOT a composite. The previous card rendered it as
   "/ 1600", which silently halved every student's apparent score.

   So, everywhere below:
     • `composite.math` / `composite.readingWriting` render out of **800**.
     • `composite.total` renders out of **1600** and ONLY when it is non-null —
       the backend returns it non-null exclusively when BOTH sections have a
       mock. A null total is never imputed, doubled or estimated; it renders as
       an explicit "—" plus copy naming the mock that is missing.
     • `personalBest.score` is a SECTION score and is labelled "/ 800".
   A projected total from one section would be a fabrication, so we decline to
   draw one — including the gauge, which is suppressed entirely when total is
   null (a gauge pointing at a made-up number is worse than no gauge). */
import { useMemo, useState } from 'react';
import * as echarts from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import {
  Target,
  Calculator,
  BookOpenText,
  Flame,
  Crosshair,
  TriangleAlert,
  GraduationCap,
  Trophy,
  Clock3,
  Gauge as GaugeIcon,
  LineChart as LineChartIcon,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import {
  useGetStudentSatDetailQuery,
  type SatMasteryRow,
  type SatSessionRow,
} from 'src/app/services/counselorConsoleApi';
import { CcStat } from '../components/CcStat';
import { CcPill, type CcPillVariant } from '../components/CcPill';
import {
  CcChart,
  CC_SERIES,
  ccProgramColor,
  ccTooltipFormatter,
  type EChartsCoreOption,
} from '../charts/ccEcharts';
import {
  ProgramCard,
  ProgramMessage,
  ProgramRetry,
  ProgramSkeletonCard,
  ProgramSkeletonTiles,
  ProgramState,
  ProgramTab,
} from './programChrome';
import './SatPrepTab.scss';

/* ── Local ECharts registration ──────────────────────────────────────────────
   charts/ccEcharts.tsx registers only Bar + Line (it is tree-shaken on
   purpose). The score-vs-target gauge needs GaugeChart, so we register it here
   against the SAME echarts/core singleton the wrapper renders with — the 'cc'
   theme still applies. Skill mastery deliberately uses CSS bars rather than an
   ECharts heatmap (see the section comment), so no HeatmapChart/VisualMap
   registration is required. */
echarts.use([GaugeChart]);

/* ── Constants ───────────────────────────────────────────────────────────── */

/** Per-section SAT scale. */
const SECTION_MIN = 200;
const SECTION_MAX = 800;
/** Composite scale = both sections summed. */
const TOTAL_MIN = 400;
const TOTAL_MAX = 1600;
/** Target composite. Editorial default — a competitive-admissions benchmark. */
const TARGET_TOTAL = 1400;

/** SAT's identity hue, from the validated CC_PROGRAM_COLOR map. Colour follows
 *  the entity: this is the same gold SAT is drawn in on every other console
 *  surface. Resolved, never restated as a hex. */
const SAT_HUE = ccProgramColor('SAT');

/** Mastery bands. Weakest-first is the coaching order, so FOCUS leads. */
const BAND_MASTERED = 80;
const BAND_BUILDING = 60;

/** Below this, a percentage is noise — one lucky/unlucky question moves it a lot. */
const LOW_CONFIDENCE_ATTEMPTS = 3;

type BandKey = 'focus' | 'building' | 'mastered';

const BANDS: Record<
  BandKey,
  { label: string; variant: CcPillVariant; hint: string }
> = {
  focus: { label: 'Focus area', variant: 'danger', hint: 'under 60%' },
  building: { label: 'Building', variant: 'warning', hint: '60–79%' },
  mastered: { label: 'Mastered', variant: 'success', hint: '80% and up' },
};

function bandOf(pct: number): BandKey {
  if (pct >= BAND_MASTERED) return 'mastered';
  if (pct >= BAND_BUILDING) return 'building';
  return 'focus';
}

/* ── Formatting ──────────────────────────────────────────────────────────── */

const DASH = '—';

function isReadingWriting(section: string): boolean {
  return String(section).toLowerCase().startsWith('reading');
}

function sectionLabel(section: string): string {
  if (isReadingWriting(section)) return 'Reading & Writing';
  if (String(section).toLowerCase() === 'math') return 'Math';
  return String(section);
}

/** ISO → "Mmm d, yyyy". */
function formatDate(value: string | null | undefined): string {
  if (!value) return DASH;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return DASH;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** ISO → "Mmm d" (chart axis / dense rows). */
function formatDayShort(value: string | number): string {
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(sec: number): string {
  const total = Math.max(0, Math.round(Number(sec) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.round((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m} min`;
  return '<1 min';
}

function accuracy(correct: number, total: number): number | null {
  if (!total) return null;
  return Math.round((correct / total) * 100);
}

const MODE_VARIANT: Record<SatSessionRow['mode'], CcPillVariant> = {
  mock: 'accent',
  pack: 'info',
  practice: 'neutral',
};
const MODE_LABEL: Record<SatSessionRow['mode'], string> = {
  mock: 'Mock',
  pack: 'Pack',
  practice: 'Practice',
};

/* ── Composite copy ──────────────────────────────────────────────────────────
   The single most important string on the page: when we cannot show a total, we
   say exactly which mock would unlock it rather than showing a soft blank. */
function compositeMeta(math: number | null, rw: number | null): string {
  if (math != null && rw != null) return 'Best mock per section, out of 1600';
  if (math != null) return 'Needs a Reading & Writing mock to project a total';
  if (rw != null) return 'Needs a Math mock to project a total';
  return 'Needs a mock in both sections to project a total';
}

/* ── Tab ─────────────────────────────────────────────────────────────────── */

type MasteryFilter = 'all' | 'math' | 'reading-writing';

export default function SatPrepTab({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  const { data, isLoading, isError, refetch } = useGetStudentSatDetailQuery(
    { orgId, userId },
    { skip: !orgId || !userId },
  );

  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('all');

  const composite = data?.composite;
  const total = composite?.total ?? null;
  const math = composite?.math ?? null;
  const rw = composite?.readingWriting ?? null;

  /* ── Mastery: weakest-first, grouped by domain ────────────────────────────
     Sorted so the domain the student is losing most points in leads, and the
     weakest skill leads inside it. This is a coaching tool, not a trophy case. */
  const masteryGroups = useMemo(() => {
    const rows = (data?.masteryRows ?? []).filter((r) =>
      masteryFilter === 'all'
        ? true
        : masteryFilter === 'math'
          ? !isReadingWriting(r.section)
          : isReadingWriting(r.section),
    );
    const byDomain = new Map<string, SatMasteryRow[]>();
    rows.forEach((r) => {
      const key = r.domain || 'Other';
      const list = byDomain.get(key);
      if (list) list.push(r);
      else byDomain.set(key, [r]);
    });
    return [...byDomain.entries()]
      .map(([domain, list]) => {
        const skills = [...list].sort((a, b) => a.pct - b.pct);
        const attempts = skills.reduce((s, r) => s + r.attempts, 0);
        const correct = skills.reduce((s, r) => s + r.correct, 0);
        return {
          domain,
          skills,
          attempts,
          // Domain accuracy is recomputed from raw counts, never averaged from
          // per-skill percentages (that would weight a 1-attempt skill equally
          // with a 40-attempt one).
          pct: attempts ? Math.round((correct / attempts) * 100) : 0,
          section: skills[0]?.section ?? '',
        };
      })
      .sort((a, b) => a.pct - b.pct);
  }, [data?.masteryRows, masteryFilter]);

  const masteryCounts = useMemo(() => {
    const rows = data?.masteryRows ?? [];
    return {
      mastered: rows.filter((r) => bandOf(r.pct) === 'mastered').length,
      building: rows.filter((r) => bandOf(r.pct) === 'building').length,
      focus: rows.filter((r) => bandOf(r.pct) === 'focus').length,
    };
  }, [data?.masteryRows]);

  /* ── Gauge: composite vs target ───────────────────────────────────────────
     Built ONLY when total != null. Gold = SAT's pinned program colour. A second
     silent gauge series draws the 1400 target tick; gauges have no markLine. */
  const gaugeOption = useMemo<EChartsCoreOption | null>(() => {
    if (total == null) return null;
    const geometry = {
      min: TOTAL_MIN,
      max: TOTAL_MAX,
      startAngle: 200,
      endAngle: -20,
      radius: '96%',
      center: ['50%', '64%'] as [string, string],
    };
    return {
      tooltip: {
        trigger: 'item',
        formatter: ccTooltipFormatter({ valueSuffix: ` / ${TOTAL_MAX}` }),
      },
      series: [
        {
          ...geometry,
          type: 'gauge',
          name: 'Composite',
          progress: {
            show: true,
            width: 13,
            roundCap: true,
            itemStyle: { color: SAT_HUE },
          },
          axisLine: {
            roundCap: true,
            lineStyle: { width: 13, color: [[1, 'rgba(28,25,23,0.08)']] },
          },
          pointer: { show: false },
          anchor: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: {
            distance: 18,
            fontSize: 11,
            color: '#9a8f7d',
            formatter: (v: number) =>
              v === TOTAL_MIN || v === TOTAL_MAX ? String(v) : '',
          },
          title: { show: false },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '-6%'],
            fontSize: 38,
            fontWeight: 500,
            fontFamily:
              "'Iowan Old Style', 'Charter', 'Georgia', 'Times New Roman', serif",
            color: '#1c1a17',
            formatter: '{value}',
          },
          data: [{ value: total, name: 'Composite' }],
        },
        {
          ...geometry,
          type: 'gauge',
          name: 'Target',
          silent: true,
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          progress: { show: false },
          anchor: { show: false },
          title: { show: false },
          detail: { show: false },
          pointer: {
            show: true,
            icon: 'rect',
            width: 2,
            length: '14%',
            offsetCenter: [0, '-86%'],
            itemStyle: { color: '#9a8f7d' },
          },
          data: [{ value: TARGET_TOTAL }],
        },
      ],
    };
  }, [total]);

  /* ── Mock history: one 200–800 line per section ───────────────────────────
     Math and R&W are the SAME 200–800 scale but are NOT the same measure, so
     they are two clearly-identified series on ONE shared axis — never merged
     into a single line, and never split onto two y-axes. Colour slots are the
     fixed CVD-safe pair: maroon (slot 1) then gold (slot 2). */
  const mockOption = useMemo<EChartsCoreOption | null>(() => {
    const rows = (data?.mockSessions ?? []).filter(
      (s) => s.estimatedScore != null,
    );
    if (rows.length === 0) return null;

    const build = (
      name: string,
      color: string,
      predicate: (s: SatSessionRow) => boolean,
    ) => {
      const points = rows
        .filter(predicate)
        .slice()
        .sort(
          (a, b) => +new Date(a.completedAt) - +new Date(b.completedAt),
        )
        .map((s) => [s.completedAt, s.estimatedScore as number]);
      if (points.length === 0) return null;
      return {
        name,
        type: 'line' as const,
        data: points,
        smooth: false,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2, color },
        itemStyle: { color, borderColor: '#fbfaf6', borderWidth: 2 },
        // Selective direct labels: only the latest point of each series is
        // labelled, so identity never rests on colour alone — and the chart
        // never becomes a number on every point.
        endLabel: {
          show: true,
          distance: 8,
          fontSize: 12,
          fontWeight: 600,
          color: '#5b5347',
          formatter: (p: { value: [string, number] }) => String(p.value[1]),
        },
        emphasis: { focus: 'series' as const },
      };
    };

    const series = [
      build('Math', CC_SERIES.maroon, (s) => !isReadingWriting(s.section)),
      build('Reading & Writing', CC_SERIES.gold, (s) =>
        isReadingWriting(s.section),
      ),
    ].filter(Boolean);

    return {
      grid: { left: 6, right: 46, top: series.length > 1 ? 34 : 14, bottom: 6, containLabel: true },
      legend:
        series.length > 1
          ? { show: true, top: 0, left: 0, itemGap: 18 }
          : { show: false },
      tooltip: {
        trigger: 'axis',
        formatter: ccTooltipFormatter({
          heading: (raw) => formatDayShort(raw),
          valueSuffix: ` / ${SECTION_MAX}`,
        }),
      },
      xAxis: {
        type: 'time',
        axisLabel: { formatter: (v: number) => formatDayShort(v), hideOverlap: true },
      },
      yAxis: {
        type: 'value',
        min: SECTION_MIN,
        max: SECTION_MAX,
        interval: 100,
        name: 'Section score',
        nameTextStyle: { color: '#9a8f7d', fontSize: 11, align: 'left' },
        nameGap: 12,
      },
      series,
    };
  }, [data?.mockSessions]);

  /* ── States ─────────────────────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <ProgramTab program="SAT" className="cc-sat" busy>
        <ProgramSkeletonTiles count={5} />
        <ProgramSkeletonCard rows={5} />
      </ProgramTab>
    );
  }

  if (isError || !data) {
    return (
      <ProgramTab program="SAT" className="cc-sat">
        <ProgramMessage
          icon={<TriangleAlert size={20} />}
          tone="danger"
          title="Couldn’t load SAT Prep"
          text="The student’s SAT Prep progress didn’t load. This is usually temporary."
          action={<ProgramRetry onClick={() => refetch()} />}
        />
      </ProgramTab>
    );
  }

  /* Not enrolled — nothing to coach yet, and no data will ever arrive until
     the student joins the program. Distinct from "enrolled, no data". */
  if (!data.enrolled) {
    return (
      <ProgramTab program="SAT" className="cc-sat">
        <ProgramMessage
          icon={<GraduationCap size={20} />}
          title="Not enrolled in SAT Prep"
          text="This student isn’t on the SAT Prep program, so there are no practice sessions, mocks or skill data to show."
        />
      </ProgramTab>
    );
  }

  const hasAnyActivity =
    (data.recentSessions?.length ?? 0) > 0 ||
    (data.masteryRows?.length ?? 0) > 0 ||
    (data.mockSessions?.length ?? 0) > 0;

  /* Enrolled but silent — the program is live, the student simply hasn't
     practised. The fix is nudging the student, not enrolment. */
  if (!hasAnyActivity) {
    return (
      <ProgramTab program="SAT" className="cc-sat">
        <ProgramMessage
          icon={<Sparkles size={20} />}
          title="Enrolled — no practice yet"
          text="This student is on SAT Prep but hasn’t finished a practice set or mock. Scores, skill mastery and streaks appear here after their first completed session."
        />
      </ProgramTab>
    );
  }

  const streakCount = data.streak?.count ?? 0;
  const focus = data.focusArea;
  const best = data.personalBest;
  const last = data.lastSession;

  return (
    <ProgramTab program="SAT" className="cc-sat">
      {/* ── Headline stats ── */}
      <div className="cc-stat-grid">
        <CcStat
          icon={<Target size={14} />}
          label="Composite"
          /* /1600 ONLY when both sections are mocked. Never imputed. */
          value={total != null ? `${total} / ${TOTAL_MAX}` : DASH}
          meta={compositeMeta(math, rw)}
          tone={total != null ? 'good' : 'neutral'}
        />
        <CcStat
          icon={<Calculator size={14} />}
          label="Math"
          value={math != null ? `${math} / ${SECTION_MAX}` : DASH}
          meta={math != null ? 'Best mock section score' : 'No Math mock yet'}
          tone={math != null ? 'info' : 'neutral'}
        />
        <CcStat
          icon={<BookOpenText size={14} />}
          label="Reading & Writing"
          value={rw != null ? `${rw} / ${SECTION_MAX}` : DASH}
          meta={
            rw != null
              ? 'Best mock section score'
              : 'No Reading & Writing mock yet'
          }
          tone={rw != null ? 'info' : 'neutral'}
        />
        <CcStat
          icon={<Flame size={14} />}
          label="Study streak"
          value={streakCount > 0 ? `${streakCount}` : DASH}
          meta={
            streakCount > 0
              ? `${streakCount === 1 ? 'day' : 'days'} in a row · last ${formatDate(data.streak?.lastPracticeDate)}`
              : 'No active streak'
          }
          tone={streakCount > 0 ? 'good' : 'neutral'}
        />
        <CcStat
          icon={<Crosshair size={14} />}
          label="Focus area"
          value={focus ? focus.skill : DASH}
          meta={
            focus
              ? `${Math.round(focus.pct)}% correct · ${focus.attempts} ${focus.attempts === 1 ? 'attempt' : 'attempts'}`
              : 'Not enough attempts to name one'
          }
          tone={focus ? 'warn' : 'neutral'}
        />
      </div>

      {/* Personal best is a SECTION score — labelled /800, never /1600. */}
      {(best || last) && (
        <div className="cc-sat-notes">
          {best && (
            <div className="cc-sat-note">
              <span className="cc-sat-note-ico">
                <Trophy size={14} />
              </span>
              <span className="cc-sat-note-label">Personal best</span>
              <span className="cc-sat-note-value">
                {best.score} / {SECTION_MAX}
              </span>
              <span className="cc-sat-note-text">
                {best.title} · {formatDate(best.completedAt)}
              </span>
            </div>
          )}
          {last && (
            <div className="cc-sat-note">
              <span className="cc-sat-note-ico">
                <Clock3 size={14} />
              </span>
              <span className="cc-sat-note-label">Last session</span>
              <span className="cc-sat-note-value">
                {last.correctQ}/{last.totalQ}
              </span>
              <span className="cc-sat-note-text">
                {last.title} · {formatDate(last.completedAt)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="cc-sat-grid">
        {/* ── Score vs target ── */}
        <ProgramCard
          eyebrow="Projection"
          title="Score vs target"
          sub={`Composite against a ${TARGET_TOTAL} target on the 400–1600 scale.`}
        >
          {gaugeOption ? (
            <>
              <CcChart option={gaugeOption} height={244} />
              <div className="cc-sat-gauge-legend">
                <span className="cc-sat-gauge-tick" aria-hidden />
                <span>Target {TARGET_TOTAL}</span>
                <span className="cc-sat-gauge-gap">
                  {total != null && total >= TARGET_TOTAL
                    ? `${total - TARGET_TOTAL} above target`
                    : `${TARGET_TOTAL - (total ?? 0)} to go`}
                </span>
              </div>
            </>
          ) : (
            /* No honest total ⇒ no gauge. Naming the missing mock is more
               useful than a dial pointing at an invented number. */
            <ProgramState
              icon={<GaugeIcon size={20} />}
              title="No composite to project yet"
              text={
                math != null
                  ? 'A composite needs a mock in both sections. Math is done — a Reading & Writing mock unlocks the projection.'
                  : rw != null
                    ? 'A composite needs a mock in both sections. Reading & Writing is done — a Math mock unlocks the projection.'
                    : 'A composite needs one full mock in Math and one in Reading & Writing. Section practice alone cannot produce a 1600-scale score.'
              }
            />
          )}
        </ProgramCard>

        {/* ── Mock history ── */}
        <ProgramCard
          eyebrow="Mocks"
          title="Mock history"
          sub="Estimated section score per mock, 200–800. Math and Reading & Writing are separate measures on a shared scale."
        >
          {mockOption ? (
            <CcChart option={mockOption} height={244} />
          ) : (
            <ProgramState
              icon={<LineChartIcon size={20} />}
              title="No mocks completed"
              text="Only mock sessions produce an estimated section score. Once this student sits a mock, their score history plots here."
            />
          )}
        </ProgramCard>
      </div>

      {/* ── Skill mastery ──────────────────────────────────────────────────────
          CSS bars grouped by domain rather than an ECharts heatmap: mastery is
          ONE metric per skill, and skills nest inside a single domain, so a
          domain × skill grid would be block-diagonal — mostly empty cells.
          Bars also let long skill names, the attempt count and the band pill sit
          on the same row, which is what makes the view coachable. */}
      <ProgramCard
        eyebrow="Diagnostics"
        title="Skill mastery"
        sub="Weakest first, grouped by domain. Percentages on few attempts are noisy — read the attempt count next to them."
      >
        <div className="cc-sat-mastery-bar">
          <div className="cc-sat-legend">
            {(['focus', 'building', 'mastered'] as BandKey[]).map((k) => (
              <span key={k} className="cc-sat-legend-item">
                <span className={`cc-sat-swatch cc-sat-swatch--${k}`} aria-hidden />
                <span className="cc-sat-legend-label">{BANDS[k].label}</span>
                <span className="cc-sat-legend-hint">{BANDS[k].hint}</span>
                <span className="cc-sat-legend-count">{masteryCounts[k]}</span>
              </span>
            ))}
          </div>
          <div className="cc-sat-filter" role="group" aria-label="Filter skills by section">
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'math', label: 'Math' },
                { key: 'reading-writing', label: 'R&W' },
              ] as { key: MasteryFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                className={`cc-sat-filter-btn${masteryFilter === f.key ? ' cc-sat-filter-btn--active' : ''}`}
                aria-pressed={masteryFilter === f.key}
                onClick={() => setMasteryFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {masteryGroups.length === 0 ? (
          <ProgramState
            icon={<ListChecks size={20} />}
            title={
              masteryFilter === 'all'
                ? 'No skill data yet'
                : 'No skills in this section yet'
            }
            text={
              masteryFilter === 'all'
                ? 'Skill mastery is built from answered questions. It fills in as this student completes practice sets and mocks.'
                : 'This student hasn’t answered questions in this section yet. Switch to All to see where they have practised.'
            }
          />
        ) : (
          <div className="cc-sat-domains">
            {masteryGroups.map((g) => (
              <div key={g.domain} className="cc-sat-domain">
                <div className="cc-sat-domain-head">
                  <h4 className="cc-sat-domain-name">{g.domain}</h4>
                  <span className="cc-sat-domain-section">
                    {sectionLabel(g.section)}
                  </span>
                  <span className="cc-sat-domain-stat">
                    <b>{g.pct}%</b> across {g.attempts}{' '}
                    {g.attempts === 1 ? 'attempt' : 'attempts'}
                  </span>
                </div>
                <ul className="cc-ptab-list">
                  {g.skills.map((s) => {
                    const band = bandOf(s.pct);
                    const low = s.attempts < LOW_CONFIDENCE_ATTEMPTS;
                    const pct = Math.max(0, Math.min(100, Math.round(s.pct)));
                    return (
                      <li
                        key={`${g.domain}-${s.skill}`}
                        className="cc-ptab-row cc-sat-skill"
                      >
                        <span className="cc-sat-skill-name" title={s.skill}>
                          {s.skill}
                        </span>
                        <span
                          className={`cc-sat-track${low ? ' cc-sat-track--low' : ''}`}
                          role="img"
                          aria-label={`${s.skill}: ${pct}% correct, ${s.correct} of ${s.attempts} attempts, ${BANDS[band].label}`}
                        >
                          <span
                            className={`cc-sat-fill cc-sat-fill--${band}`}
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span className="cc-sat-skill-pct">{pct}%</span>
                        <span className="cc-sat-skill-attempts">
                          {s.correct}/{s.attempts}
                          {low && (
                            <span
                              className="cc-sat-skill-low"
                              title="Too few attempts to read this percentage confidently"
                            >
                              low data
                            </span>
                          )}
                        </span>
                        <CcPill variant={BANDS[band].variant}>
                          {BANDS[band].label}
                        </CcPill>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </ProgramCard>

      {/* ── Recent activity ── */}
      <ProgramCard
        eyebrow="Activity"
        title="Recent sessions"
        sub="Most recent completed SAT work, newest first."
      >
        {(data.recentSessions?.length ?? 0) === 0 ? (
          <ProgramState
            icon={<Clock3 size={20} />}
            title="No sessions yet"
            text="Completed practice sets, packs and mocks appear here with their accuracy."
          />
        ) : (
          <ul className="cc-ptab-list">
            {data.recentSessions.map((s) => {
              const acc = accuracy(s.correctQ, s.totalQ);
              return (
                <li key={s.id} className="cc-ptab-row cc-sat-activity-row">
                  <div className="cc-sat-activity-main">
                    <span className="cc-sat-activity-title" title={s.title}>
                      {s.title}
                    </span>
                    <span className="cc-sat-activity-meta">
                      {sectionLabel(s.section)} · {formatDuration(s.durationSec)}
                    </span>
                  </div>
                  <CcPill variant={MODE_VARIANT[s.mode] ?? 'neutral'}>
                    {MODE_LABEL[s.mode] ?? s.mode}
                  </CcPill>
                  <span className="cc-sat-activity-score">
                    {s.correctQ}/{s.totalQ}
                  </span>
                  <span className="cc-sat-activity-acc">
                    {acc != null ? `${acc}%` : DASH}
                  </span>
                  <span className="cc-sat-activity-date">
                    {formatDate(s.completedAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </ProgramCard>
    </ProgramTab>
  );
}
