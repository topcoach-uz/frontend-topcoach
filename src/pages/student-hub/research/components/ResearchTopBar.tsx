/**
 * Research Prep top bar — mirrors the SAT Test Prep shell so both
 * programs share the same visual hierarchy.
 *
 *   Row 1 — brand badge + breadcrumb (left), program-progress chip
 *           and Back-to-main button (right).
 *   Row 2 — underline tab nav (Overview / Module), centered in a
 *           1200px container exactly like SAT's tabs.
 *
 * No avatar — the global website header already shows the user's
 * identity, so we keep this bar focused on navigation + progress.
 */

import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Check, ChevronRight, FlaskConical, LayoutDashboard, Lock } from 'lucide-react';
import type { ResearchWeek, WeekLockState } from 'src/app/services/research-prep/types';

interface ResearchTopBarProps {
  view: 'overview' | 'module';
  selectedWeekNumber?: number;
  selectedWeekTitle?: string;
  weeksCompleted: number;
  totalWeeks: number;
  overallPercent: number;
  weeks: ResearchWeek[];
  lockState: WeekLockState[];
  onOpenWeek: (weekNumber: number) => void;
  onSwitchView: (next: 'overview' | 'module') => void;
  onBackToMain: () => void;
}

const ResearchTopBar: React.FC<ResearchTopBarProps> = ({
  view,
  selectedWeekNumber,
  selectedWeekTitle,
  weeksCompleted,
  totalWeeks,
  overallPercent,
  weeks,
  lockState,
  onOpenWeek,
  onSwitchView,
  onBackToMain,
}) => {
  const weekShort = selectedWeekTitle?.split(/[—:·]/)[0].trim();
  const stripRef = useRef<HTMLDivElement>(null);
  // Keep the open week visible when the strip is wider than the screen.
  useEffect(() => {
    const active = stripRef.current?.querySelector<HTMLElement>('.rp-tab--active.rp-week-tab');
    active?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [view, selectedWeekNumber]);

  return (
    <header className="rp-topbar" role="banner">
      {/* Row 1 — brand + crumb on the left, progress + back on the right. */}
      <div className="rp-topbar-row rp-topbar-row--head">
        <div className="rp-topbar-row-inner">
          <div className="rp-topbar-left">
            <span className="rp-brand">
              <span className="rp-brand-mark" aria-hidden>
                <FlaskConical size={13} />
              </span>
              <span className="rp-brand-name">Research Program</span>
            </span>
            <ChevronRight size={13} className="rp-crumb-sep" aria-hidden />
            {view === 'overview' ? (
              <span className="rp-crumb-leaf">Dashboard</span>
            ) : (
              <>
                <span className="rp-crumb-leaf">Week {selectedWeekNumber}</span>
                {weekShort && (
                  <>
                    <ChevronRight size={13} className="rp-crumb-sep" aria-hidden />
                    <span className="rp-crumb-trail">{weekShort}</span>
                  </>
                )}
              </>
            )}
          </div>
          <div className="rp-topbar-right">
            <div className="rp-progress-chip" aria-label="Program progress">
              <span className="chip-text">
                <span className="chip-label">Program Progress</span>
                <span className="chip-value">
                  {weeksCompleted}<span className="chip-sep">/</span>{totalWeeks}
                  <span className="chip-unit"> Weeks</span>
                </span>
              </span>
              <span className="bar" aria-hidden>
                <span className="fill" style={{ width: `${overallPercent}%` }} />
              </span>
              <span className="pct">{overallPercent}%</span>
            </div>
            <button type="button" className="rp-back-btn" onClick={onBackToMain}>
              <ArrowLeft size={13} />
              <span>{view === 'module' ? 'Back to Overview' : 'Back to main menu'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2 — Overview / Module as SAT-style underline tabs. */}
      <nav className="rp-topbar-row rp-topbar-row--tabs" aria-label="Research view">
        <div className="rp-topbar-row-inner rp-topbar-row-inner--tabs">
          <button
            type="button"
            className={`rp-tab ${view === 'overview' ? 'rp-tab--active' : ''}`}
            onClick={() => onSwitchView('overview')}
          >
            <LayoutDashboard size={15} />
            <span>Overview</span>
          </button>
          <span className="rp-tab-divider" aria-hidden />
          <div className="rp-week-strip" ref={stripRef} role="group" aria-label="Weeks">
            {weeks.map((week) => {
              const state = lockState.find((l) => l.weekNumber === week.weekNumber);
              const locked = !!state?.weekLocked;
              const done = !!state && state.assignment.submissionStatus !== 'none';
              const active = view === 'module' && selectedWeekNumber === week.weekNumber;
              return (
                <button
                  key={week.id}
                  type="button"
                  className={`rp-tab rp-week-tab${active ? ' rp-tab--active' : ''}${locked ? ' rp-tab--disabled' : ''}${done ? ' rp-week-tab--done' : ''}`}
                  onClick={() => !locked && onOpenWeek(week.weekNumber)}
                  disabled={locked}
                  aria-current={active ? 'page' : undefined}
                  title={locked ? `Finish Week ${week.weekNumber - 1} to unlock` : week.title}
                >
                  {done ? <Check size={14} aria-hidden /> : locked ? <Lock size={13} aria-hidden /> : null}
                  <span>Week {week.weekNumber}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default ResearchTopBar;
