/**
 * Research Program header.
 *
 *   Row 1 — breadcrumb trail + quiet back link.
 *   Row 2 — page title (program or open week) + program progress meter.
 *   Row 3 — glass segmented control: Overview · Week 1…8, with the sliding
 *           thumb used across the student workspace.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import { Breadcrumb } from '../../applicant/ApplicantPage';
import { useMyLearningPath } from '../../applicant/useMyLearningPath';
import { useSegmentLens } from 'src/hooks/useSegmentLens';
import type { ResearchWeek, WeekLockState } from 'src/app/services/research-prep/types';
import { WEEK_STATUS_LABEL, isWeekDone, weekStatus } from '../researchStatus';

interface ResearchTopBarProps {
  view: 'overview' | 'module';
  selectedWeekNumber?: number;
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
  weeksCompleted,
  totalWeeks,
  overallPercent,
  weeks,
  lockState,
  onOpenWeek,
  onSwitchView,
  onBackToMain,
}) => {
  const myLearningPath = useMyLearningPath();
  const lens = useSegmentLens<HTMLDivElement>('[aria-current="page"]', [view, selectedWeekNumber]);
  const [trackEl, setTrackEl] = useState<HTMLDivElement | null>(null);

  const isModule = view === 'module' && selectedWeekNumber != null;
  const week = isModule ? weeks.find((w) => w.weekNumber === selectedWeekNumber) : undefined;
  const status = week ? weekStatus(lockState.find((l) => l.weekNumber === week.weekNumber)) : undefined;

  // Keep the open tab visible when the strip is wider than the screen.
  useEffect(() => {
    const active = trackEl?.querySelector<HTMLElement>('[aria-current="page"]');
    active?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [trackEl, view, selectedWeekNumber]);

  const lensRef = lens.ref;
  const setTrackRef = useCallback(
    (el: HTMLDivElement | null) => {
      lensRef(el);
      setTrackEl(el);
    },
    [lensRef],
  );

  const lessons = week?.videoLessons.length ?? 0;
  const questions = week?.quiz.questions.length ?? 0;

  return (
    <header className="rp-header">
      <div className="rp-header__crumbs">
        <Breadcrumb>
          <Link to={myLearningPath}>My learning</Link>
          <span>/</span>
          {isModule ? (
            <>
              <button type="button" className="rp-crumb-link" onClick={() => onSwitchView('overview')}>
                Research Program
              </button>
              <span>/</span>
              {`Week ${selectedWeekNumber}`}
            </>
          ) : (
            'Research Program'
          )}
        </Breadcrumb>
        <button type="button" className="rp-back" onClick={onBackToMain}>
          <ArrowLeft size={15} aria-hidden />
          {isModule ? 'All weeks' : 'My learning'}
        </button>
      </div>

      <div className="rp-header__main">
        <div className="rp-header__titles">
          <span className="rp-kicker">
            {isModule ? `Week ${selectedWeekNumber} of ${totalWeeks}` : `${totalWeeks}-week program`}
          </span>
          <div className="rp-header__title-row">
            <h1>{isModule ? week?.title : 'Research Program'}</h1>
            {status && <span className={`rp-pill rp-pill--${status}`}>{WEEK_STATUS_LABEL[status]}</span>}
          </div>
          <p>
            {isModule
              ? `${lessons} lesson${lessons === 1 ? '' : 's'} · ${questions}-question knowledge check · 1 assignment`
              : 'From your first research question to a finished portfolio, one week at a time.'}
          </p>
        </div>

        <div className="rp-meter">
          <div className="rp-meter__top">
            <span>Program progress</span>
            <strong>{overallPercent}%</strong>
          </div>
          <div
            className="rp-meter__bar"
            role="progressbar"
            aria-label="Program progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={overallPercent}
          >
            <span style={{ width: `${overallPercent}%` }} />
          </div>
          <span className="rp-meter__meta">
            {weeksCompleted} of {totalWeeks} weeks complete
          </span>
        </div>
      </div>

      <nav className="rp-nav" aria-label="Research program sections">
        <div
          ref={setTrackRef}
          className="rp-nav__track"
          data-lens={lens.lensStyle.width != null ? 'on' : undefined}
        >
          <span className="rp-nav__lens" style={lens.lensStyle} aria-hidden />
          <button
            type="button"
            className="rp-nav__item"
            aria-current={view === 'overview' ? 'page' : undefined}
            onClick={() => onSwitchView('overview')}
          >
            Overview
          </button>
          <span className="rp-nav__divider" aria-hidden />
          {weeks.map((w) => {
            const s = weekStatus(lockState.find((l) => l.weekNumber === w.weekNumber));
            const locked = s === 'locked';
            const active = view === 'module' && selectedWeekNumber === w.weekNumber;
            return (
              <button
                key={w.id}
                type="button"
                className={`rp-nav__item${isWeekDone(s) ? ' is-done' : ''}`}
                onClick={() => onOpenWeek(w.weekNumber)}
                disabled={locked}
                aria-current={active ? 'page' : undefined}
                title={locked ? `Finish Week ${w.weekNumber - 1} to unlock` : w.title}
              >
                {isWeekDone(s) ? (
                  <Check size={13} strokeWidth={2.5} aria-hidden />
                ) : locked ? (
                  <Lock size={12} aria-hidden />
                ) : null}
                Week {w.weekNumber}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

export default ResearchTopBar;
