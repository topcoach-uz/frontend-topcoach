/**
 * Research Prep top bar.
 *
 * Sticky horizontal header that pins under the main website header. Contains:
 *   - Breadcrumb (Research Program > {Dashboard | Week N · short title})
 *   - View toggle pills (Overview / Week N Module)
 *   - Program progress chip (X/8 weeks · NN%)
 *   - Back button (Back to main menu in overview, ← Back to Overview in module)
 *
 * No avatar — the global website header already shows the user's identity,
 * so we keep this bar focused on navigation + progress.
 */

import React from 'react';
import { ArrowLeft, ChevronRight, FlaskConical } from 'lucide-react';

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
      <div className="rp-topbar-inner">
        {/* Left zone — brand + breadcrumb */}
        <div className="rp-topbar-left">
          <span className="rp-brand">
            <span className="rp-brand-mark" aria-hidden>
              <FlaskConical size={15} />
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

        {/* Center zone — view switch */}
        <div className="rp-topbar-center">
          <div className="rp-viewswitch" role="tablist" aria-label="Research view">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'overview'}
              className={`seg ${view === 'overview' ? 'seg-active' : ''}`}
              onClick={() => onSwitchView('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'module'}
              className={`seg ${view === 'module' ? 'seg-active' : ''} ${
                !selectedWeekNumber ? 'seg-disabled' : ''
              }`}
              onClick={() => selectedWeekNumber && onSwitchView('module')}
              disabled={!selectedWeekNumber}
              title={selectedWeekNumber ? '' : 'Pick a week from the dashboard first'}
            >
              {selectedWeekNumber ? `Week ${selectedWeekNumber} Module` : 'Module'}
            </button>
          </div>
        </div>

        {/* Right zone — progress + back */}
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
            <ArrowLeft size={14} />
            <span>{view === 'module' ? 'Back to Overview' : 'Back to main menu'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default ResearchTopBar;
