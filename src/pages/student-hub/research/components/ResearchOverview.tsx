/**
 * Overview — what the student sees when they open the Research Program.
 *
 *   1. Current week — the one thing to do next, with its three steps.
 *   2. Milestones   — the three program deliverables (Weeks 2, 5, 8).
 *   3. Curriculum   — all eight weeks; each tile opens its module.
 */

import React from 'react';
import { ArrowRight, Check, Flag, Lock, Trophy } from 'lucide-react';
import type { ResearchWeek, WeekLockState } from 'src/app/services/research-prep';
import {
  MILESTONES,
  WEEK_STATUS_LABEL,
  isWeekDone,
  milestoneForWeek,
  videoProgress,
  weekStatus,
  type WeekStatus,
} from '../researchStatus';

interface ResearchOverviewProps {
  weeks: ResearchWeek[];
  lockState: WeekLockState[];
  currentWeekNumber: number;
  allWeeksDone: boolean;
  onOpenWeek: (weekNumber: number) => void;
}

type StepState = 'done' | 'current' | 'locked';

const StepIcon: React.FC<{ state: StepState; index: number }> = ({ state, index }) => (
  <span className={`rp-step-dot is-${state}`} aria-hidden>
    {state === 'done' ? <Check size={12} strokeWidth={3} /> : state === 'locked' ? <Lock size={11} /> : index}
  </span>
);

/** The three steps of a week, in unlock order. */
function weekSteps(lock: WeekLockState | undefined) {
  const { watched, total } = videoProgress(lock);
  const videosDone = total > 0 && watched === total;
  const quizPassed = !!lock?.quiz.passed;
  const submitted = !!lock && lock.assignment.submissionStatus !== 'none';
  const revision = lock?.assignment.submissionStatus === 'returned_for_revision';

  const steps: { label: string; detail: string; state: StepState }[] = [
    {
      label: 'Lessons',
      detail: `${watched} of ${total} watched`,
      state: videosDone ? 'done' : 'current',
    },
    {
      label: 'Knowledge check',
      detail: quizPassed
        ? 'Passed'
        : lock?.quiz.locked
          ? 'After the lessons'
          : lock && lock.quiz.attempts > 0
            ? `Best ${lock.quiz.bestScorePercent}% · 100% to pass`
            : 'Ready to take',
      state: quizPassed ? 'done' : lock?.quiz.locked ? 'locked' : 'current',
    },
    {
      label: 'Assignment',
      detail: revision
        ? 'Revision requested'
        : submitted
          ? 'Submitted'
          : lock?.assignment.locked
            ? 'After the quiz'
            : 'Ready to submit',
      state: revision ? 'current' : submitted ? 'done' : lock?.assignment.locked ? 'locked' : 'current',
    },
  ];
  return steps;
}

const ResearchOverview: React.FC<ResearchOverviewProps> = ({
  weeks,
  lockState,
  currentWeekNumber,
  allWeeksDone,
  onOpenWeek,
}) => {
  const lockFor = (n: number) => lockState.find((l) => l.weekNumber === n);
  const statusFor = (n: number) => weekStatus(lockFor(n));

  // A returned assignment needs attention before anything else.
  const focusNumber =
    lockState.find((l) => l.assignment.submissionStatus === 'returned_for_revision')?.weekNumber ??
    currentWeekNumber;
  const focusWeek = weeks.find((w) => w.weekNumber === focusNumber);
  const focusLock = lockFor(focusNumber);
  const focusStatus = statusFor(focusNumber);
  const lastWeek = weeks[weeks.length - 1];

  return (
    <div className="rp-overview">
      {/* 1. Current week */}
      {allWeeksDone && lastWeek ? (
        <section className="rp-focus rp-focus--complete" aria-label="Program complete">
          <div className="rp-focus__body">
            <span className="rp-kicker">
              <Trophy size={13} aria-hidden /> Program complete
            </span>
            <h2>You’ve finished all {weeks.length} weeks</h2>
            <p>Every assignment is in. You can revisit any week below to review lessons and feedback.</p>
          </div>
          <div className="rp-focus__action">
            <button type="button" className="rp-btn rp-btn--primary" onClick={() => onOpenWeek(lastWeek.weekNumber)}>
              Review Week {lastWeek.weekNumber}
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </section>
      ) : (
        focusWeek && (
          <section className="rp-focus" aria-label={`Current week: ${focusWeek.title}`}>
            <div className="rp-focus__body">
              <span className="rp-kicker">
                Week {focusWeek.weekNumber} · {focusStatus === 'revision' ? 'Revision requested' : focusStatus === 'not-started' ? 'Up next' : 'In progress'}
              </span>
              <h2>{focusWeek.title}</h2>
              <p>{focusWeek.tagline}</p>
              <ol className="rp-focus__steps">
                {weekSteps(focusLock).map((step, i) => (
                  <li key={step.label} className={`is-${step.state}`}>
                    <StepIcon state={step.state} index={i + 1} />
                    <span className="rp-focus__step-text">
                      <strong>{step.label}</strong>
                      <small>{step.detail}</small>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rp-focus__action">
              <button type="button" className="rp-btn rp-btn--primary" onClick={() => onOpenWeek(focusWeek.weekNumber)}>
                {focusStatus === 'not-started' ? 'Start' : 'Continue'} Week {focusWeek.weekNumber}
                <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          </section>
        )
      )}

      {/* 2. Milestones */}
      <section className="rp-block" aria-labelledby="rp-milestones-title">
        <div className="rp-block__head">
          <h2 id="rp-milestones-title">Milestones</h2>
          <span className="rp-block__note">Three deliverables that shape your portfolio</span>
        </div>
        <ol className="rp-milestones">
          {MILESTONES.map((m) => {
            const status = statusFor(m.weekNumber);
            const week = weeks.find((w) => w.weekNumber === m.weekNumber);
            const state = isWeekDone(status) ? 'done' : status === 'locked' ? 'upcoming' : 'current';
            return (
              <li key={m.weekNumber} className={`rp-milestone is-${state}`}>
                <span className="rp-milestone__icon" aria-hidden>
                  {state === 'done' ? <Check size={16} strokeWidth={2.5} /> : <Flag size={15} />}
                </span>
                <span className="rp-milestone__text">
                  <strong>{m.title}</strong>
                  <small>
                    Week {m.weekNumber}
                    {week ? ` · ${week.title}` : ''}
                  </small>
                </span>
                <span className={`rp-pill rp-pill--${state === 'upcoming' ? 'locked' : status}`}>
                  {state === 'upcoming' ? 'Upcoming' : WEEK_STATUS_LABEL[status]}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 3. Curriculum */}
      <section className="rp-block" aria-labelledby="rp-curriculum-title">
        <div className="rp-block__head">
          <h2 id="rp-curriculum-title">Curriculum</h2>
          <span className="rp-block__note">{weeks.length} weeks · each unlocks after the one before</span>
        </div>
        <div className="rp-week-grid">
          {weeks.map((week) => {
            const status: WeekStatus = statusFor(week.weekNumber);
            const locked = status === 'locked';
            const done = isWeekDone(status);
            const isCurrent = !allWeeksDone && week.weekNumber === focusNumber;
            const milestone = milestoneForWeek(week.weekNumber);
            const statusText = locked
              ? `Unlocks after Week ${week.weekNumber - 1}`
              : status === 'submitted'
                ? 'Submitted · awaiting review'
                : WEEK_STATUS_LABEL[status];

            return (
              <button
                key={week.id}
                type="button"
                className={`rp-week is-${status}${isCurrent ? ' is-current' : ''}`}
                onClick={() => onOpenWeek(week.weekNumber)}
                disabled={locked}
                aria-label={`Week ${week.weekNumber}: ${week.title}. ${statusText}`}
              >
                <span className="rp-week__top">
                  <span className="rp-week__num">Week {week.weekNumber}</span>
                  <span className="rp-week__state" aria-hidden>
                    {done ? (
                      <Check size={13} strokeWidth={2.75} />
                    ) : locked ? (
                      <Lock size={12} />
                    ) : (
                      <span className="rp-week__dot" />
                    )}
                  </span>
                </span>
                <span className="rp-week__title">{week.title}</span>
                <span className="rp-week__tagline">{week.tagline}</span>
                <span className="rp-week__foot">
                  <span className="rp-week__status">{statusText}</span>
                  {milestone && (
                    <span className="rp-week__milestone">
                      <Flag size={11} aria-hidden />
                      {milestone.title}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ResearchOverview;
