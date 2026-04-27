/**
 * Overview view — the dashboard shown when the user opens Research Prep.
 *
 *   ┌─ MAJOR MILESTONES ───────────────────────────────────────────┐
 *   │  ●─────────────────●─────────────────●                       │
 *   │ Niche      Research Proposal     Final Portfolio             │
 *   ├─ PROGRAM MODULES — 8 WEEKS ──────────────────────────────────┤
 *   │ ┌──┐ ┌──┐ ┌──┐ ┌──┐                                          │
 *   │ │W1│ │W2│ │W3│ │W4│   (active week filled maroon)            │
 *   │ └──┘ └──┘ └──┘ └──┘                                          │
 *   │ ┌──┐ ┌──┐ ┌──┐ ┌──┐                                          │
 *   │ │W5│ │W6│ │W7│ │W8│                                          │
 *   │ └──┘ └──┘ └──┘ └──┘                                          │
 *   └─────────────────────────────────────────────────────────────-┘
 */

import React from 'react';
import { BookOpen, CheckCircle2, FileText, Flag, Lock, Play, Star } from 'lucide-react';
import type { ResearchWeek, WeekLockState } from 'src/app/services/research-prep';

interface MilestoneSpec {
  weekNumber: number;
  title: string;
}

const MILESTONES: MilestoneSpec[] = [
  { weekNumber: 2, title: 'Lab shortlist' },
  { weekNumber: 5, title: 'Research proposal' },
  { weekNumber: 8, title: 'Final portfolio' },
];

interface ResearchOverviewProps {
  weeks: ResearchWeek[];
  lockState: WeekLockState[];
  currentWeekNumber: number;
  onOpenWeek: (weekNumber: number) => void;
}

const tileStatus = (lock: WeekLockState | undefined) => {
  if (!lock) return 'locked';
  if (lock.weekLocked) return 'locked';
  if (lock.assignment.submissionStatus === 'graded') return 'complete';
  if (lock.assignment.submissionStatus === 'submitted') return 'submitted';
  if (lock.assignment.submissionStatus === 'returned_for_revision') return 'revision';
  if (lock.quiz.passed && !lock.assignment.locked) return 'assignment-open';
  if (lock.quiz.locked === false && Object.values(lock.videos).every((v) => v.completed))
    return 'quiz-open';
  if (Object.values(lock.videos).some((v) => v.completed)) return 'in-progress';
  return 'in-progress';
};

const milestoneStatus = (lock: WeekLockState | undefined): 'complete' | 'in-progress' | 'locked' => {
  if (!lock) return 'locked';
  if (lock.assignment.submissionStatus === 'graded') return 'complete';
  if (!lock.weekLocked) return 'in-progress';
  return 'locked';
};

const ResearchOverview: React.FC<ResearchOverviewProps> = ({
  weeks,
  lockState,
  currentWeekNumber,
  onOpenWeek,
}) => {
  return (
    <>
      {/* Major milestones */}
      <div className="rp-section">
        <div className="rp-section-head">
          <span className="icon">
            <Star size={14} />
          </span>
          Major Milestones
        </div>
        <div className="rp-milestones">
          {MILESTONES.map((m) => {
            const week = weeks.find((w) => w.weekNumber === m.weekNumber);
            const lock = lockState.find((l) => l.weekNumber === m.weekNumber);
            const status = milestoneStatus(lock);
            return (
              <div
                key={m.weekNumber}
                className={`rp-milestone ${
                  status === 'complete'
                    ? 'is-complete'
                    : status === 'in-progress'
                      ? 'is-in-progress'
                      : ''
                }`}
              >
                <span className="dot">
                  {status === 'complete' ? (
                    <CheckCircle2 size={20} />
                  ) : status === 'in-progress' ? (
                    <Flag size={18} />
                  ) : (
                    <Lock size={16} />
                  )}
                </span>
                <span className="title">{m.title}</span>
                <span className="week">Week {m.weekNumber}</span>
                <span
                  className={`pill ${
                    status === 'complete'
                      ? 'pill--complete'
                      : status === 'in-progress'
                        ? 'pill--in-progress'
                        : 'pill--locked'
                  }`}
                >
                  {status === 'complete'
                    ? 'Complete'
                    : status === 'in-progress'
                      ? 'In progress'
                      : 'Locked'}
                </span>
                {/* Reference week title under the milestone for context */}
                {week && (
                  <span style={{ fontSize: 11, color: '#8a93a0' }}>
                    {week.title}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4×2 week grid */}
      <div className="rp-section">
        <div className="rp-section-head">
          <span className="icon">
            <BookOpen size={14} />
          </span>
          Program Modules — {weeks.length} Weeks
        </div>
        <div className="rp-week-grid">
          {weeks.map((week) => {
            const lock = lockState.find((l) => l.weekNumber === week.weekNumber);
            const status = tileStatus(lock);
            const isActive = week.weekNumber === currentWeekNumber && status !== 'locked' && status !== 'complete';
            const isLocked = status === 'locked';
            const isComplete = status === 'complete';
            const isFinal = week.weekNumber === 8;
            // "Started" = any signal that the student has touched the week:
            // a video watched, a quiz attempt, or any submission. Drives the
            // Start vs. Resume label on the active week's CTA.
            const isStarted = Boolean(
              lock &&
                (Object.values(lock.videos).some(
                  (v) => v.completed || v.progressPercent > 0,
                ) ||
                  lock.quiz.attempts > 0 ||
                  lock.assignment.submissionStatus !== 'none'),
            );

            const subline = (() => {
              if (isComplete && week.weekNumber === 2) return 'Milestone Complete ✱';
              if (isComplete) return 'Module complete';
              if (status === 'submitted') return 'Submitted — awaiting grade';
              if (status === 'revision') return 'Revision requested';
              if (status === 'assignment-open') return 'Assignment open';
              if (status === 'quiz-open') return 'Quiz unlocked';
              if (isActive) return 'In Progress';
              if (isLocked && week.weekNumber === 8) return 'Grand Milestone';
              if (isLocked) return 'Unlocks after previous week';
              return week.tagline.length > 60 ? week.tagline.slice(0, 56) + '…' : week.tagline;
            })();

            const footerNode = (() => {
              if (isActive) {
                return (
                  <button type="button" className="start-btn">
                    <Play size={13} fill="currentColor" />
                    {isStarted ? 'Resume Module' : 'Start Module'}
                  </button>
                );
              }
              if (isComplete) {
                return (
                  <span className="pill pill--complete">
                    <CheckCircle2 size={12} /> Complete
                  </span>
                );
              }
              if (isLocked) {
                return (
                  <span className="pill pill--locked">
                    <Lock size={12} /> Locked
                  </span>
                );
              }
              if (status === 'submitted' || status === 'assignment-open' || status === 'quiz-open' || status === 'revision') {
                return (
                  <span className="pill pill--in-progress">
                    {status === 'submitted'
                      ? 'Submitted'
                      : status === 'revision'
                        ? 'Revision'
                        : 'In Progress'}
                  </span>
                );
              }
              return null;
            })();

            return (
              <div
                key={week.id}
                className={`rp-week-tile ${isActive ? 'is-active' : ''} ${
                  isLocked ? 'is-locked' : ''
                } ${isComplete ? 'is-complete' : ''} ${isFinal ? 'is-final' : ''}`}
                role="button"
                tabIndex={isLocked ? -1 : 0}
                aria-label={`Week ${week.weekNumber} ${week.title}`}
                onClick={() => !isLocked && onOpenWeek(week.weekNumber)}
                onKeyDown={(e) => {
                  if (!isLocked && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onOpenWeek(week.weekNumber);
                  }
                }}
              >
                <div className="head">
                  <span className="num">Week {week.weekNumber}</span>
                  <span className="icon">
                    {isFinal ? (
                      <Star size={16} className="star" fill={isLocked ? 'none' : 'currentColor'} />
                    ) : status === 'complete' ? (
                      <CheckCircle2 size={16} color="#1f7a3a" />
                    ) : isLocked ? (
                      <Lock size={14} />
                    ) : isActive ? (
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 999,
                          border: '2px solid rgba(255,255,255,0.6)',
                          background: 'rgba(255,255,255,0.1)',
                          display: 'inline-block',
                        }}
                      />
                    ) : (
                      <FileText size={14} />
                    )}
                  </span>
                </div>
                <div className="title">{week.title}</div>
                <div className="sub">{subline}</div>
                <div className="footer">{footerNode}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ResearchOverview;
