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

import React from 'react';
import { ArrowLeft, ChevronRight, FlaskConical, LayoutDashboard, BookOpen } from 'lucide-react';

interface ResearchTopBarProps {
  view: 'overview' | 'module';
  selectedWeekNumber?: number;
  selectedWeekTitle?: string;
  weeksCompleted: number;
  totalWeeks: number;
  overallPercent: number;
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
  onSwitchView,
  onBackToMain,
}) => {
  const weekShort = selectedWeekTitle?.split(/[—:·]/)[0].trim();

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
          <button
            type="button"
            className={`rp-tab ${view === 'module' ? 'rp-tab--active' : ''} ${
              !selectedWeekNumber ? 'rp-tab--disabled' : ''
            }`}
            onClick={() => selectedWeekNumber && onSwitchView('module')}
            disabled={!selectedWeekNumber}
            title={selectedWeekNumber ? '' : 'Pick a week from the dashboard first'}
          >
            <BookOpen size={15} />
            <span>{selectedWeekNumber ? `Week ${selectedWeekNumber} Module` : 'Module'}</span>
          </button>
        </div>
      </nav>
    </header>
  );
};

export default ResearchTopBar;
