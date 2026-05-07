/**
 * SAT Prep dashboard — editorial layout. Real data only; empty states for
 * everything we don't yet track (attempts, mastery, score history) so the
 * UI is honest about what's persistent vs. session-only.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Clock,
  Compass,
  Flame,
  Layers,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import {
  useAggregateSatCountsQuery,
  useComposeMockTestMutation,
} from 'src/app/services/sat-prep';
import { useGetSatProgressQuery, type SessionRecord, type SkillMastery } from 'src/app/services/sat-prep/local-progress';
import 'src/components/sat-prep/sat-prep-shell.scss';
import './sat-dashboard.scss';

// ─── helpers ────────────────────────────────────────────────────────────
const timeAgo = (iso: string): string => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr === 1 ? 'An hour ago' : `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
};

const fmtDuration = (sec: number): string => {
  if (!sec || sec < 60) return `${Math.max(0, sec | 0)}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
};

const masteryTier = (pct: number): 'mastered' | 'building' | 'focus' => {
  if (pct >= 80) return 'mastered';
  if (pct >= 60) return 'building';
  return 'focus';
};

const SatDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: counts } = useAggregateSatCountsQuery();
  const [composeMockTest, { isLoading: composing }] = useComposeMockTestMutation();

  // Backend-driven progress. RTK Query auto-refetches on window focus and
  // when invalidated by recording a new session — no manual reload needed.
  const { data: progress } = useGetSatProgressQuery();
  const personalBest = progress?.personalBest ?? null;
  const streak = progress?.streak ?? { count: 0, lastPracticeDate: null };
  const lastSession = progress?.lastSession ?? null;
  const focus = progress?.focusArea ?? null;
  const recentSessions = progress?.recentSessions ?? [];
  const masteryRows = progress?.masteryRows ?? [];
  const mockSessions = progress?.mockSessions ?? [];

  const [masteryFilter, setMasteryFilter] = useState<'all' | 'math' | 'reading-writing'>('all');
  const visibleMastery = useMemo(() => {
    const rows = masteryFilter === 'all'
      ? masteryRows
      : masteryRows.filter((m) => m.section === masteryFilter);
    // Show focus areas first so they're visible without scrolling.
    return [...rows].sort((a, b) => a.pct - b.pct);
  }, [masteryRows, masteryFilter]);

  const domains = useMemo(() => {
    if (!counts) return { math: [] as string[], rw: [] as string[] };
    const setMath = new Set<string>();
    const setRw = new Set<string>();
    for (const c of counts) {
      if (c.section === 'math') setMath.add(c.domain);
      else setRw.add(c.domain);
    }
    return { math: Array.from(setMath), rw: Array.from(setRw) };
  }, [counts]);

  const startQuickPractice = async (section: 'math' | 'reading-writing') => {
    try {
      const result = await composeMockTest({
        section,
        totalQuestions: 10,
        distribution: { easy: 0.4, medium: 0.4, hard: 0.2 },
      }).unwrap();
      sessionStorage.setItem('sat-mock-test', JSON.stringify(result));
      sessionStorage.setItem('sat-mock-test-meta', JSON.stringify({
        title: section === 'math' ? '10-question Math drill' : '10-question R&W drill',
        section,
      }));
      navigate('/student-hub/sat-prep/runner');
    } catch (e) { /* swallow */ }
  };

  return (
    <div className="sat-dash">
      {/* Stat tiles — driven by localStorage progress */}
      <section className="sat-dash__stats">
        <StatTile
          icon={<Trophy size={18} />}
          tone="brand"
          label="Personal best"
          value={personalBest ? personalBest.score : '—'}
          sub={personalBest ? personalBest.title : 'Take a mock to set'}
        />
        <StatTile
          icon={<Flame size={18} />}
          tone="orange"
          label="Study streak"
          value={<>{streak.count} <span className="sat-stat__value-unit">day{streak.count === 1 ? '' : 's'}</span></>}
          sub={streak.count ? 'Keep it going — practice today!' : 'Practice today to start'}
        />
        <StatTile
          icon={<TrendingUp size={18} />}
          tone="green"
          label="Last session"
          value={
            lastSession
              ? <>{lastSession.totalQ ? Math.round((lastSession.correctQ / lastSession.totalQ) * 100) : 0}<span className="sat-stat__value-unit">%</span></>
              : '—'
          }
          sub={
            lastSession
              ? `${lastSession.correctQ} of ${lastSession.totalQ} correct · ${lastSession.title}`
              : 'No sessions yet'
          }
        />
        <StatTile
          icon={<Target size={18} />}
          tone="purple"
          label="Focus area"
          value={focus ? `${focus.pct}%` : '—'}
          sub={focus ? `${focus.skill} needs work` : "We'll pick after a few sessions"}
        />
      </section>

      {/* Quick start */}
      <section className="sat-card">
        <div className="sat-card__header">
          <h2 className="sat-card__title">Quick start</h2>
          <span className="sat-card__subtitle">Jump into practice in one click</span>
        </div>
        <div className="sat-dash__quick-grid">
          <QuickAction
            icon={<Calculator size={18} />}
            tone="blue"
            title="10-question Math drill"
            desc="Mixed difficulty across all 4 math domains"
            onClick={() => startQuickPractice('math')}
            cta={composing ? 'Loading…' : 'Start drill'}
          />
          <QuickAction
            icon={<BookOpen size={18} />}
            tone="purple"
            title="10-question R&W drill"
            desc="Inferences, words in context, and structure"
            onClick={() => startQuickPractice('reading-writing')}
            cta={composing ? 'Loading…' : 'Start drill'}
          />
          <QuickAction
            icon={<Sparkles size={18} />}
            tone="brand"
            title="Full mock test"
            desc="Bluebook-style with timing and scoring"
            onClick={() => navigate('/student-hub/sat-prep/mock-tests')}
            cta="Browse"
          />
          <QuickAction
            icon={<Compass size={18} />}
            tone="green"
            title="Browse by topic"
            desc="Pick subtopics like 'Linear functions'"
            onClick={() => navigate('/student-hub/sat-prep/practice')}
            cta="Open"
          />
        </div>
      </section>

      {/* Two-column: domains + recent */}
      <section className="sat-dash__two-col">
        <div className="sat-card">
          <div className="sat-card__header">
            <h2 className="sat-card__title">Jump into a domain</h2>
            <span className="sat-card__subtitle">{(domains.math.length + domains.rw.length)} areas</span>
          </div>

          <div className="sat-dash__domain-section">
            <div className="sat-dash__domain-section-label">
              <Calculator size={13} /> Math
            </div>
            <div className="sat-dash__domain-pills">
              {domains.math.map((d) => (
                <button key={d} className="sat-dash__domain-pill" onClick={() => navigate('/student-hub/sat-prep/practice')}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="sat-dash__domain-section">
            <div className="sat-dash__domain-section-label">
              <BookOpen size={13} /> Reading & Writing
            </div>
            <div className="sat-dash__domain-pills">
              {domains.rw.map((d) => (
                <button key={d} className="sat-dash__domain-pill" onClick={() => navigate('/student-hub/sat-prep/practice')}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <RecentActivityCard sessions={recentSessions} onStartDrill={() => startQuickPractice('math')} />
      </section>

      {/* Score progress + skill mastery */}
      <section className="sat-dash__two-col">
        <ScoreProgressCard mocks={mockSessions} onBrowse={() => navigate('/student-hub/sat-prep/mock-tests')} />
        <SkillMasteryCard
          rows={visibleMastery}
          allRows={masteryRows}
          filter={masteryFilter}
          onFilter={setMasteryFilter}
          onPractice={() => navigate('/student-hub/sat-prep/practice')}
        />
      </section>

    </div>
  );
};

// ─── Recent activity ──────────────────────────────────────────────────
const ModeBadge: React.FC<{ mode: SessionRecord['mode'] }> = ({ mode }) => {
  const cfg = mode === 'mock'
    ? { icon: <Timer size={16} />, label: 'Mock' }
    : mode === 'pack'
      ? { icon: <Layers size={16} />, label: 'Pack' }
      : { icon: <Zap size={16} />, label: 'Drill' };
  return (
    <div className={`sat-activity__icon sat-activity__icon--${mode}`} aria-label={cfg.label}>
      {cfg.icon}
    </div>
  );
};

const RecentActivityCard: React.FC<{ sessions: SessionRecord[]; onStartDrill: () => void }> = ({ sessions, onStartDrill }) => {
  const showing = sessions.slice(0, 4);
  return (
    <div className="sat-card">
      <div className="sat-card__header">
        <div>
          <h2 className="sat-card__title">Recent activity</h2>
          {showing.length > 0 && (
            <div className="sat-card__sublabel">Last {showing.length} session{showing.length === 1 ? '' : 's'}</div>
          )}
        </div>
        {sessions.length > 4 && <span className="sat-card__subtitle">All sessions</span>}
      </div>

      {showing.length === 0 ? (
        <div className="sat-dash__empty">
          <div className="sat-dash__empty-glyph"><Clock size={20} /></div>
          <div className="sat-dash__empty-title">No sessions yet</div>
          <div className="sat-dash__empty-desc">
            Take a quick drill or a Bluebook-style mock to start your study history.
          </div>
          <button className="sat-btn sat-btn--ghost" onClick={onStartDrill}>
            Try a 10-question drill <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        <ul className="sat-activity">
          {showing.map((s) => {
            const pct = s.totalQ ? Math.round((s.correctQ / s.totalQ) * 100) : 0;
            return (
              <li key={s.id} className="sat-activity__row">
                <ModeBadge mode={s.mode} />
                <div className="sat-activity__body">
                  <div className="sat-activity__eyebrow">
                    {s.mode.toUpperCase()} <span className="sat-activity__sep">·</span> {fmtDuration(s.durationSec)}
                  </div>
                  <div className="sat-activity__title">{s.title}</div>
                  <div className="sat-activity__time">{timeAgo(s.completedAt)}</div>
                </div>
                <div className="sat-activity__score">
                  <div className="sat-activity__score-main">
                    {s.estimatedScore != null ? s.estimatedScore : `${s.correctQ}/${s.totalQ}`}
                  </div>
                  <div className={`sat-activity__score-tag sat-activity__score-tag--${masteryTier(pct)}`}>
                    {pct}%
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// ─── Score progress ────────────────────────────────────────────────────
// Two render modes, chosen by what the user has actually mocked:
//   - 'composite': both Math + R&W have a score → chart the projected total
//     (200–1600) and the SAT-style 1500 target.
//   - 'section':   only one section has been mocked → chart that section
//     alone (200–800) so we don't pretend the missing half is zero.
type ChartMode = 'composite' | 'math' | 'rw';
interface ScorePoint { date: string; value: number; }

const SECTION_TARGET = 700;          // ~700 is a strong section score
const COMPOSITE_TARGET = 1500;       // matches what we already advertise

const buildScoreSeries = (mocks: SessionRecord[]): {
  mode: ChartMode | null;
  series: ScorePoint[];
  latestMath: number | null;
  latestRw: number | null;
  heroValue: number | null;        // big number shown in the hero
  heroLabel: string;               // "Latest mock total" / "Latest math" / etc.
  delta: number | null;            // vs. previous point in the active series
  target: number;                  // matching the chart mode
  latestAt: string | null;
} => {
  const scored = mocks.filter((s) => s.estimatedScore != null);
  if (!scored.length) {
    return {
      mode: null, series: [], latestMath: null, latestRw: null,
      heroValue: null, heroLabel: '', delta: null,
      target: COMPOSITE_TARGET, latestAt: null,
    };
  }

  const sortedAsc = [...scored].sort((a, b) =>
    new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  );
  const mathPoints = sortedAsc.filter((s) => s.section === 'math');
  const rwPoints   = sortedAsc.filter((s) => s.section === 'reading-writing');
  const latestMath = mathPoints.length ? mathPoints[mathPoints.length - 1].estimatedScore! : null;
  const latestRw   = rwPoints.length   ? rwPoints[rwPoints.length - 1].estimatedScore!   : null;
  const latestAt   = sortedAsc[sortedAsc.length - 1].completedAt;

  // Composite mode — only when both sections actually have a score.
  if (latestMath != null && latestRw != null) {
    let m: number | null = null;
    let r: number | null = null;
    const series: ScorePoint[] = [];
    for (const s of sortedAsc) {
      if (s.section === 'math') m = s.estimatedScore!;
      else if (s.section === 'reading-writing') r = s.estimatedScore!;
      if (m != null && r != null) series.push({ date: s.completedAt, value: m + r });
    }
    const hero = series.length ? series[series.length - 1].value : null;
    const prev = series.length >= 2 ? series[series.length - 2].value : null;
    return {
      mode: 'composite',
      series,
      latestMath, latestRw,
      heroValue: hero,
      // The composite is `latestMath + latestRw`, not the score of the
      // most recent single attempt — call that out so a 200 R&W mock
      // following a 222 R&W mock doesn't look like the headline regressed
      // to "200" when in fact the projected total is 200 + 200 = 400.
      heroLabel: 'Projected SAT total',
      delta: hero != null && prev != null ? hero - prev : null,
      target: COMPOSITE_TARGET,
      latestAt,
    };
  }

  // Single-section mode — show that section's progression on a 200–800 axis.
  const sectionPoints = mathPoints.length ? mathPoints : rwPoints;
  const isMath = mathPoints.length > 0;
  const series: ScorePoint[] = sectionPoints.map((s) => ({ date: s.completedAt, value: s.estimatedScore! }));
  const hero = series[series.length - 1].value;
  const prev = series.length >= 2 ? series[series.length - 2].value : null;
  return {
    mode: isMath ? 'math' : 'rw',
    series,
    latestMath, latestRw,
    heroValue: hero,
    heroLabel: isMath ? 'Latest math mock' : 'Latest reading & writing mock',
    delta: prev != null ? hero - prev : null,
    target: SECTION_TARGET,
    latestAt,
  };
};

// Pick a Y-axis range that always shows the data + target with breathing room,
// then snap to the nearest 100. Returns ~5 evenly-spaced round-number ticks.
const buildYScale = (values: number[], target: number, hardMin: number, hardMax: number) => {
  const all = [...values, target];
  const dataMin = Math.min(...all);
  const dataMax = Math.max(...all);
  const span = Math.max(dataMax - dataMin, 100);
  const pad = Math.max(80, span * 0.18);
  const yMin = Math.max(hardMin, Math.floor((dataMin - pad) / 100) * 100);
  const yMax = Math.min(hardMax, Math.ceil((dataMax + pad) / 100) * 100);
  // Choose a tick step so we land on ~5 nicely-spaced ticks.
  const range = yMax - yMin;
  const rawStep = range / 5;
  const step = rawStep <= 50 ? 50 : rawStep <= 100 ? 100 : rawStep <= 200 ? 200 : 100 * Math.ceil(rawStep / 100);
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== yMax) ticks.push(yMax);
  return { yMin, yMax, ticks };
};

const fmtChartDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const LineChart: React.FC<{ series: ScorePoint[]; target: number; mode: ChartMode }> = ({ series, target, mode }) => {
  if (series.length < 1) return null;
  // Viewbox tuned so the chart looks crisp at typical card widths (~360–520).
  const W = 480, H = 200;
  const padL = 42, padR = 18, padT = 12, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Y range: always show the data + target, padded out to nice round numbers.
  // 200–1600 for composite, 200–800 for a single section.
  const isComposite = mode === 'composite';
  const { yMin, yMax, ticks: yTicks } = buildYScale(
    series.map((p) => p.value),
    target,
    isComposite ? 0 : 200,
    isComposite ? 1600 : 800,
  );
  const yToPx = (v: number) => padT + innerH - ((v - yMin) / Math.max(yMax - yMin, 1)) * innerH;
  // With a single mock the only sensible location is the left edge — that
  // way the marker aligns with its date label below.
  const xToPx = (i: number) =>
    series.length === 1 ? padL : padL + (i / (series.length - 1)) * innerW;

  const points = series.map((p, i) => `${xToPx(i)},${yToPx(p.value)}`).join(' ');
  const areaPath = series.length >= 2
    ? `M${xToPx(0)},${yToPx(yMin)} ${series.map((p, i) => `L${xToPx(i)},${yToPx(p.value)}`).join(' ')} L${xToPx(series.length - 1)},${yToPx(yMin)} Z`
    : '';

  const lastIdx = series.length - 1;
  const lastX = xToPx(lastIdx);
  const lastY = yToPx(series[lastIdx].value);
  const showFirstX = fmtChartDate(series[0].date);
  const midIdx = Math.floor((series.length - 1) / 2);
  const showMidX = series.length >= 3 ? fmtChartDate(series[midIdx].date) : null;
  const showLastX = series.length >= 2 ? fmtChartDate(series[lastIdx].date) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sat-score__chart" role="img" aria-label="Mock score progression">
      <defs>
        <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7B1F2F" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#7B1F2F" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y-axis grid + labels */}
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={yToPx(t)} y2={yToPx(t)}
            stroke="#ece9df" strokeWidth="1" />
          <text x={padL - 8} y={yToPx(t) + 4} textAnchor="end"
            fill="#9ca3af" fontSize="10" fontFamily="var(--sat-sans)">
            {t}
          </text>
        </g>
      ))}

      {/* Target dashed line + label */}
      <line x1={padL} x2={W - padR} y1={yToPx(target)} y2={yToPx(target)}
        stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 4" />
      <text x={W - padR - 4} y={yToPx(target) - 6} textAnchor="end"
        fill="#6b7280" fontSize="10" fontWeight="700" letterSpacing="0.06em" fontFamily="var(--sat-sans)">
        TARGET {target}
      </text>

      {/* Area fill + line */}
      {series.length >= 2 && <path d={areaPath} fill="url(#line-grad)" />}
      {series.length >= 2 && (
        <polyline points={points} fill="none" stroke="#7B1F2F" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Markers. A halo around the latest point only makes sense in a
          multi-point series — with a single mock the halo and the dot read
          as two stacked circles, which is what the user flagged. So:
            - 2+ points: faint halo + solid red dot on the latest, white-on-red on the rest
            - 1 point:    one clean small dot, no halo */}
      {series.length >= 2 && (
        <circle cx={lastX} cy={lastY} r="10" fill="#7B1F2F" fillOpacity="0.12" />
      )}
      {series.map((p, i) => {
        const isLast = i === lastIdx;
        const r = series.length === 1 ? 4 : isLast ? 5 : 3.5;
        return (
          <circle
            key={i}
            cx={xToPx(i)}
            cy={yToPx(p.value)}
            r={r}
            fill={isLast ? '#7B1F2F' : 'white'}
            stroke="#7B1F2F"
            strokeWidth={isLast ? 1.8 : 1.6}
          />
        );
      })}

      {/* Latest value text — flip to the left of the marker if it's near the
          right edge, otherwise sit to the right of it. */}
      {(() => {
        const nearRight = lastX > padL + innerW * 0.75;
        return (
          <text
            x={nearRight ? lastX - 8 : lastX + 9}
            y={lastY - 7}
            textAnchor={nearRight ? 'end' : 'start'}
            fill="#1f2937"
            fontSize="12"
            fontWeight="600"
            fontFamily="var(--sat-serif)"
          >
            {series[lastIdx].value}
          </text>
        );
      })()}

      {/* X-axis date ticks */}
      <text x={padL} y={H - 8} textAnchor="start"
        fill="#9ca3af" fontSize="10" fontFamily="var(--sat-sans)">
        {showFirstX}
      </text>
      {showMidX && (
        <text x={padL + innerW / 2} y={H - 8} textAnchor="middle"
          fill="#9ca3af" fontSize="10" fontFamily="var(--sat-sans)">
          {showMidX}
        </text>
      )}
      {showLastX && (
        <text x={W - padR} y={H - 8} textAnchor="end"
          fill="#9ca3af" fontSize="10" fontFamily="var(--sat-sans)">
          {showLastX}
        </text>
      )}
    </svg>
  );
};

const ScoreProgressCard: React.FC<{ mocks: SessionRecord[]; onBrowse: () => void }> = ({ mocks, onBrowse }) => {
  const { mode, series, latestMath, latestRw, heroValue, heroLabel, delta, target } =
    useMemo(() => buildScoreSeries(mocks), [mocks]);

  if (mode == null || heroValue == null) {
    return (
      <div className="sat-card sat-score sat-score--empty">
        <div className="sat-card__header">
          <div>
            <div className="sat-card__eyebrow">Projected SAT score</div>
            <h2 className="sat-card__title sat-score__title">No mocks yet</h2>
          </div>
        </div>
        <div className="sat-dash__empty">
          <div className="sat-dash__empty-glyph"><Sparkles size={20} /></div>
          <div className="sat-dash__empty-title">Track your projected score</div>
          <div className="sat-dash__empty-desc">
            Take a Bluebook-style math + R&amp;W mock to start tracking your projected SAT total.
          </div>
          <button className="sat-btn sat-btn--ghost" onClick={onBrowse}>
            Browse mock tests <ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sat-card sat-score">
      <div className="sat-score__header">
        <div className="sat-card__eyebrow">{heroLabel}</div>
        {mode !== 'composite' && (
          <span className="sat-score__mode-pill">
            {mode === 'math' ? 'Math · 200–800' : 'R&W · 200–800'}
          </span>
        )}
      </div>

      <div className="sat-score__hero">
        <div className="sat-score__score-block">
          <div className="sat-score__score">{heroValue}</div>
          {mode === 'composite' && (
            <div className="sat-score__score-meta">
              latest math + latest R&amp;W mock · out of 1600
            </div>
          )}
        </div>
        {delta !== null && (
          <div className={`sat-score__delta sat-score__delta--${delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'}`}>
            {delta > 0 ? <TrendingUp size={13} /> : delta < 0 ? <TrendingDown size={13} /> : null}
            <span className="sat-score__delta-num">{delta > 0 ? '+' : ''}{delta} pts</span>
            <span className="sat-score__delta-meta">vs. previous total</span>
          </div>
        )}
      </div>

      <div className="sat-score__sections">
        <div className="sat-score__section">
          <span className="sat-score__section-num">{latestMath ?? '—'}</span>
          <span className="sat-score__section-label">Math</span>
        </div>
        <span className="sat-score__section-dot">·</span>
        <div className="sat-score__section">
          <span className="sat-score__section-num">{latestRw ?? '—'}</span>
          <span className="sat-score__section-label">Reading &amp; Writing</span>
        </div>
        <span className="sat-score__section-dot">·</span>
        <div className="sat-score__section sat-score__section--target">
          <span className="sat-score__section-label">Target</span>
          <span className="sat-score__section-num">{target}</span>
        </div>
      </div>

      <div className="sat-score__chart-wrap">
        <LineChart series={series} target={target} mode={mode} />
      </div>

      {mode !== 'composite' && (
        <div className="sat-score__hint">
          Take a {mode === 'math' ? 'Reading &amp; Writing' : 'Math'} mock to start tracking your projected total (out of 1600).
        </div>
      )}
    </div>
  );
};

// ─── Skill mastery ─────────────────────────────────────────────────────
const SegmentBar: React.FC<{ pct: number }> = ({ pct }) => {
  const total = 10;
  const filled = Math.round((pct / 100) * total);
  const tier = masteryTier(pct);
  return (
    <div className={`sat-mastery__bar sat-mastery__bar--${tier}`} aria-label={`${pct}% mastery`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`sat-mastery__seg ${i < filled ? 'sat-mastery__seg--on' : ''}`} />
      ))}
    </div>
  );
};

const SkillMasteryCard: React.FC<{
  rows: SkillMastery[];
  allRows: SkillMastery[];
  filter: 'all' | 'math' | 'reading-writing';
  onFilter: (f: 'all' | 'math' | 'reading-writing') => void;
  onPractice: () => void;
}> = ({ rows, allRows, filter, onFilter, onPractice }) => {
  return (
    <div className="sat-card sat-mastery">
      <div className="sat-card__header">
        <div>
          <h2 className="sat-card__title">Skill mastery</h2>
          <div className="sat-card__sublabel">Accuracy across attempted skills</div>
        </div>
        {allRows.length > 0 && (
          <div className="sat-mastery__tabs">
            <button
              className={`sat-mastery__tab ${filter === 'all' ? 'sat-mastery__tab--active' : ''}`}
              onClick={() => onFilter('all')}
            >All skills</button>
            <button
              className={`sat-mastery__tab ${filter === 'math' ? 'sat-mastery__tab--active' : ''}`}
              onClick={() => onFilter('math')}
            >Math</button>
            <button
              className={`sat-mastery__tab ${filter === 'reading-writing' ? 'sat-mastery__tab--active' : ''}`}
              onClick={() => onFilter('reading-writing')}
            >R&amp;W</button>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="sat-dash__empty">
          <div className="sat-dash__empty-glyph"><Target size={20} /></div>
          <div className="sat-dash__empty-title">{allRows.length ? 'No skills here yet' : 'No data yet'}</div>
          <div className="sat-dash__empty-desc">
            Mastery levels appear after 5+ attempts in each skill.
          </div>
          <button className="sat-btn sat-btn--ghost" onClick={onPractice}>
            Practice by topic <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        <>
          <ul className="sat-mastery__list">
            {rows.map((m) => (
              <li key={`${m.section}/${m.domain}/${m.skill}`} className="sat-mastery__row">
                <div className="sat-mastery__name">
                  <div className="sat-mastery__skill">{m.skill}</div>
                  <div className="sat-mastery__domain">{m.attempts} questions attempted</div>
                </div>
                <SegmentBar pct={m.pct} />
                <div className={`sat-mastery__pct sat-mastery__pct--${masteryTier(m.pct)}`}>{m.pct}%</div>
              </li>
            ))}
          </ul>
          <div className="sat-mastery__legend">
            <span className="sat-mastery__legend-item"><span className="sat-mastery__legend-dot sat-mastery__legend-dot--mastered" /> ≥80% Mastered</span>
            <span className="sat-mastery__legend-item"><span className="sat-mastery__legend-dot sat-mastery__legend-dot--building" /> 60–79% Building</span>
            <span className="sat-mastery__legend-item"><span className="sat-mastery__legend-dot sat-mastery__legend-dot--focus" /> &lt;60% Focus area</span>
          </div>
        </>
      )}
    </div>
  );
};

const StatTile: React.FC<{
  icon: React.ReactNode;
  tone: 'brand' | 'blue' | 'green' | 'orange' | 'purple';
  label: string;
  value: React.ReactNode;
  sub?: string;
}> = ({ icon, tone, label, value, sub }) => (
  <div className="sat-stat sat-dash__stat">
    <div className={`sat-dash__stat-icon sat-dash__stat-icon--${tone}`}>{icon}</div>
    <div className="sat-stat__label">{label}</div>
    <div className="sat-stat__value">{value}</div>
    {sub && <div className="sat-stat__sub">{sub}</div>}
  </div>
);

const QuickAction: React.FC<{
  icon: React.ReactNode;
  tone: 'brand' | 'blue' | 'green' | 'purple';
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
}> = ({ icon, tone, title, desc, cta, onClick }) => (
  <button type="button" className={`sat-dash__quick sat-dash__quick--${tone}`} onClick={onClick}>
    <div className="sat-dash__quick-icon">{icon}</div>
    <div className="sat-dash__quick-title">{title}</div>
    <div className="sat-dash__quick-desc">{desc}</div>
    <div className="sat-dash__quick-cta">
      {cta} <ArrowRight size={13} />
    </div>
  </button>
);

export default SatDashboardPage;
