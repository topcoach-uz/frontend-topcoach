/**
 * Research Prep — per-program tab on the counselor console student profile.
 *
 * Read-only by contract: the counselor observes a student's run through the
 * 8-week Research Prep curriculum. Never render quiz-taking, submit or grade
 * controls here — grading lives in the mentor console.
 *
 * Card anatomy, states, tables and skeletons come from `programChrome`; the
 * milestone strip, the week ladder and the submissions table body are Research
 * Prep's own forms.
 *
 *   ┌─ HEADLINE ─────────────────────────────────────────────┐
 *   │  Weeks completed · Overall · Current week · Assignments │
 *   ├─ MAJOR MILESTONES ─────────────────────────────────────┤
 *   │  ●───────────────●───────────────●   W2 · W5 · W8       │
 *   ├─ WEEK LADDER (centrepiece) ────────────────────────────┤
 *   │  ①  Title / tagline    videos · quiz · assignment       │
 *   │  ②  …dimmed + plain-English reason when locked          │
 *   ├─ SUBMISSIONS ──────────────────────────────────────────┤
 *   │  week · attempt · status · dates · grader · score       │
 *   └────────────────────────────────────────────────────────┘
 */

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Flag,
  FlaskConical,
  HelpCircle,
  Lock,
  PlayCircle,
} from 'lucide-react';
import {
  useGetStudentResearchDetailQuery,
  type ResearchSubmission,
  type ResearchSubmissionStatus,
  type ResearchWeek,
  type ResearchWeekLockReason,
  type ResearchWeekLockState,
} from 'src/app/services/counselorConsoleApi';
import { CcStat } from '../components/CcStat';
import { CcPill, type CcPillVariant } from '../components/CcPill';
import {
  ProgramCard,
  ProgramMessage,
  ProgramRetry,
  ProgramSkeletonCard,
  ProgramSkeletonTiles,
  ProgramState,
  ProgramTab,
} from './programChrome';
import './ResearchPrepTab.scss';

/* ------------------------------------------------------------------ *
 * Milestones
 *
 * NOTE: milestones are a FRONTEND-DERIVED concept — there is no backend
 * milestone entity. This constant is DUPLICATED from
 * `frontend/src/pages/student-hub/research/components/ResearchOverview.tsx`
 * (the student-facing view). The two copies can drift: if the curriculum's
 * milestone weeks change, BOTH files must be edited. Kept duplicated rather
 * than shared because the student hub and the counselor console are
 * separate feature trees with no common module.
 * ------------------------------------------------------------------ */
interface MilestoneSpec {
  weekNumber: number;
  title: string;
}

const MILESTONES: MilestoneSpec[] = [
  { weekNumber: 2, title: 'Lab shortlist' },
  { weekNumber: 5, title: 'Research proposal' },
  { weekNumber: 8, title: 'Final portfolio' },
];

type MilestoneStatus = 'complete' | 'in-progress' | 'locked';

/** Mirrors `milestoneStatus` in the student's ResearchOverview.tsx. */
const milestoneStatus = (lock: ResearchWeekLockState | undefined): MilestoneStatus => {
  if (!lock) return 'locked';
  if (lock.assignment.submissionStatus === 'graded') return 'complete';
  if (!lock.weekLocked) return 'in-progress';
  return 'locked';
};

/* ------------------------------------------------------------------ *
 * Plain-English copy — raw lock enums must never reach the screen.
 * ------------------------------------------------------------------ */

/** Reason a whole WEEK is gated. */
const WEEK_LOCK_COPY: Record<ResearchWeekLockReason, string> = {
  'previous-week-not-submitted': 'Unlocks after the previous week is submitted',
  'video-lessons-incomplete': 'Complete the video lessons to unlock',
  'quiz-not-passed': 'Pass the quiz to unlock',
  'module-locked': 'Not released by the program yet',
};

/** Same reasons, phrased for a single quiz/assignment row inside a week. */
const STEP_LOCK_COPY: Record<ResearchWeekLockReason, string> = {
  'previous-week-not-submitted': 'Locked: previous week not submitted',
  'video-lessons-incomplete': 'Locked: video lessons incomplete',
  'quiz-not-passed': 'Locked: quiz not passed',
  'module-locked': 'Locked: not released yet',
};

const weekLockText = (reason?: ResearchWeekLockReason): string =>
  (reason && WEEK_LOCK_COPY[reason]) || 'Locked';

const stepLockText = (reason?: ResearchWeekLockReason): string =>
  (reason && STEP_LOCK_COPY[reason]) || 'Locked';

const SUBMISSION_COPY: Record<ResearchSubmissionStatus | 'none', string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  graded: 'Graded',
  returned_for_revision: 'Revision requested',
  none: 'Not submitted',
};

/* Tone mapping is the family's, not this tab's: done → success, waiting on
   someone → warning, in flight → info, needs rework → danger, nothing yet →
   neutral. The same semantics carry the same tone in every program tab. */
const SUBMISSION_TONE: Record<ResearchSubmissionStatus | 'none', CcPillVariant> = {
  submitted: 'info',
  under_review: 'warning',
  graded: 'success',
  returned_for_revision: 'danger',
  none: 'neutral',
};

const formatDate = (value?: string | null): string => {
  if (!value) return '-';
  const d = dayjs(value);
  return d.isValid() ? d.format('MMM D, YYYY') : '-';
};

/* ------------------------------------------------------------------ */

export default function ResearchPrepTab({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  const { data, isLoading, isError, isFetching, refetch } =
    useGetStudentResearchDetailQuery(
      { orgId, userId },
      { skip: !orgId || !userId },
    );

  /** Join the shared curriculum (`weeks`) to this student's gate state. */
  const ladder = useMemo(() => {
    if (!data) return [];
    const byNumber = new Map<number, ResearchWeekLockState>(
      data.lockState.map((l) => [l.weekNumber, l]),
    );
    return [...data.weeks]
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .map((week) => ({ week, lock: byNumber.get(week.weekNumber) }));
  }, [data]);

  /**
   * Effort roll-up. `overallPercent` counts only SUBMITTED assignments, so a
   * student who watched every video and passed every quiz can still sit at 0%.
   * These totals make that effort visible next to the headline number.
   */
  const effort = useMemo(() => {
    if (!data) return { videosDone: 0, videosTotal: 0, quizzesPassed: 0, quizAttempts: 0 };
    let videosDone = 0;
    let videosTotal = 0;
    let quizzesPassed = 0;
    let quizAttempts = 0;
    for (const { week, lock } of ladder) {
      videosTotal += week.videoLessons.length;
      if (!lock) continue;
      videosDone += week.videoLessons.filter((l) => lock.videos[l.id]?.completed).length;
      if (lock.quiz.passed) quizzesPassed += 1;
      quizAttempts += lock.quiz.attempts;
    }
    return { videosDone, videosTotal, quizzesPassed, quizAttempts };
  }, [data, ladder]);

  if (isLoading) {
    return (
      <ProgramTab program="Research Prep" className="cc-rp" busy>
        <ProgramSkeletonTiles count={4} />
        <ProgramSkeletonCard rows={3} />
        <ProgramSkeletonCard rows={8} />
      </ProgramTab>
    );
  }

  if (isError) {
    return (
      <ProgramTab program="Research Prep" className="cc-rp">
        <ProgramMessage
          icon={<AlertCircle size={20} />}
          tone="danger"
          title="Couldn’t load Research Prep"
          text="The student’s Research Prep progress didn’t load. This is usually temporary."
          action={<ProgramRetry onClick={() => refetch()} />}
        />
      </ProgramTab>
    );
  }

  // The hook resolves to null when the student was never enrolled.
  if (!data || !data.enrolled) {
    return (
      <ProgramTab program="Research Prep" className="cc-rp">
        <ProgramMessage
          icon={<FlaskConical size={20} />}
          title="Not enrolled in Research Prep"
          text="This student hasn’t joined the Research Prep program, so there’s no curriculum progress to show."
        />
      </ProgramTab>
    );
  }

  const { summary, submissions } = data;
  const totalWeeks = data.weeks.length;

  /* Enrolled, but nothing has happened yet anywhere in the program. */
  const noActivity =
    submissions.length === 0 &&
    effort.videosDone === 0 &&
    effort.quizAttempts === 0 &&
    summary.overallPercent === 0;

  return (
    <ProgramTab program="Research Prep" className="cc-rp" busy={isFetching}>
      {/* ---------------- Headline ---------------- */}
      <div className="cc-stat-grid">
        <CcStat
          icon={<Flag size={14} aria-hidden="true" />}
          label="Weeks completed"
          value={`${summary.weeksCompleted} / ${totalWeeks}`}
          meta="Assignment submitted"
          tone={summary.weeksCompleted > 0 ? 'good' : 'neutral'}
        />
        <CcStat
          icon={<ClipboardList size={14} aria-hidden="true" />}
          label="Overall"
          value={`${summary.overallPercent}%`}
          meta="Weeks submitted ÷ active weeks"
          tone={summary.overallPercent > 0 ? 'info' : 'neutral'}
        />
        <CcStat
          icon={<PlayCircle size={14} aria-hidden="true" />}
          label="Current week"
          value={summary.currentWeekNumber ? `Week ${summary.currentWeekNumber}` : '-'}
          meta={
            ladder.find((r) => r.week.weekNumber === summary.currentWeekNumber)?.week.title ??
            'Not started'
          }
          tone="neutral"
        />
        <CcStat
          icon={<CheckCircle2 size={14} aria-hidden="true" />}
          label="Assignments"
          value={summary.totalAssignmentsGraded}
          meta={`${summary.totalAssignmentsGraded} graded · ${summary.totalAssignmentsPending} pending`}
          tone={summary.totalAssignmentsPending > 0 ? 'warn' : 'neutral'}
        />
      </div>

      {/*
        Make the metric's meaning legible. "Overall" ignores videos and
        quizzes entirely, so a counselor must not read 0% as "did nothing".
      */}
      <p className="cc-ptab-note">
        <span className="cc-ptab-note-key">How “Overall” is measured</span>
        Weeks with a submitted assignment ÷ active weeks. Watching videos and passing quizzes
        does <strong>not</strong> move it. This student has completed{' '}
        <strong>
          {effort.videosDone} of {effort.videosTotal}
        </strong>{' '}
        video lessons and passed <strong>{effort.quizzesPassed}</strong>{' '}
        {effort.quizzesPassed === 1 ? 'quiz' : 'quizzes'} across{' '}
        <strong>{effort.quizAttempts}</strong>{' '}
        {effort.quizAttempts === 1 ? 'attempt' : 'attempts'}.
      </p>

      {noActivity && (
        <div className="cc-rp-banner" role="status">
          <FlaskConical size={16} aria-hidden="true" />
          <span>
            Enrolled, but no activity yet — no videos watched, no quiz attempts and no assignments
            submitted.
          </span>
        </div>
      )}

      {/* ---------------- Milestones ---------------- */}
      <ProgramCard
        flush
        eyebrow="Major milestones"
        title="The three that matter"
        titleId="cc-rp-ms-h"
      >
        <ol className="cc-rp-milestones">
          {MILESTONES.map((m) => {
            const row = ladder.find((r) => r.week.weekNumber === m.weekNumber);
            const status = milestoneStatus(row?.lock);
            return (
              <li key={m.weekNumber} className={`cc-rp-ms cc-rp-ms--${status}`}>
                <span className="cc-rp-ms-dot" aria-hidden="true">
                  {status === 'complete' ? (
                    <CheckCircle2 size={18} />
                  ) : status === 'in-progress' ? (
                    <Flag size={16} />
                  ) : (
                    <Lock size={14} />
                  )}
                </span>
                <span className="cc-rp-ms-week">Week {m.weekNumber}</span>
                <span className="cc-rp-ms-title">{m.title}</span>
                {row?.week.title && <span className="cc-rp-ms-sub">{row.week.title}</span>}
                <CcPill
                  variant={
                    status === 'complete' ? 'success' : status === 'in-progress' ? 'info' : 'neutral'
                  }
                >
                  {status === 'complete'
                    ? 'Complete'
                    : status === 'in-progress'
                      ? 'In progress'
                      : 'Locked'}
                </CcPill>
              </li>
            );
          })}
        </ol>
      </ProgramCard>

      {/* ---------------- Week ladder ---------------- */}
      <ProgramCard
        flush
        eyebrow="The programme"
        title="Week by week"
        sub={`${totalWeeks} weeks · currently on week ${summary.currentWeekNumber || '-'}`}
        titleId="cc-rp-ladder-h"
      >
        <ol className="cc-rp-ladder">
          {ladder.map(({ week, lock }) => (
            <WeekRung
              key={week.id}
              week={week}
              lock={lock}
              isCurrent={week.weekNumber === summary.currentWeekNumber}
            />
          ))}
        </ol>
      </ProgramCard>

      {/* ---------------- Submissions ---------------- */}
      <SubmissionsCard submissions={submissions} />
    </ProgramTab>
  );
}

/* ================================================================== *
 * Week ladder rung
 * ================================================================== */

function WeekRung({
  week,
  lock,
  isCurrent,
}: {
  week: ResearchWeek;
  lock?: ResearchWeekLockState;
  isCurrent: boolean;
}) {
  const locked = !lock || lock.weekLocked;
  const videosDone = lock
    ? week.videoLessons.filter((l) => lock.videos[l.id]?.completed).length
    : 0;
  const videosTotal = week.videoLessons.length;
  const submissionStatus = lock?.assignment.submissionStatus ?? 'none';
  const graded = submissionStatus === 'graded';

  return (
    <li
      className={[
        'cc-rp-rung',
        locked ? 'cc-rp-rung--locked' : '',
        isCurrent ? 'cc-rp-rung--current' : '',
        graded ? 'cc-rp-rung--done' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="cc-rp-rung-marker" aria-hidden="true">
        <span className="cc-rp-rung-num">
          {graded ? <CheckCircle2 size={16} /> : locked ? <Lock size={13} /> : week.weekNumber}
        </span>
      </div>

      <div className="cc-rp-rung-body">
        <div className="cc-rp-rung-head">
          <h4 className="cc-rp-rung-title">
            <span className="cc-rp-rung-wk">Week {week.weekNumber}</span>
            {week.title}
          </h4>
          {isCurrent && <CcPill variant="accent">Current</CcPill>}
          {locked && (
            /* Never print the raw enum — plain English, with an icon so the
               state isn't carried by dimming/colour alone. */
            <span className="cc-rp-rung-reason">
              <Lock size={11} aria-hidden="true" />
              {weekLockText(lock?.weekLockReason)}
            </span>
          )}
        </div>
        {week.tagline && <p className="cc-rp-rung-tagline">{week.tagline}</p>}

        <ul className="cc-rp-steps">
          {/* Videos */}
          <li className="cc-rp-step">
            <PlayCircle size={13} aria-hidden="true" />
            <span className="cc-rp-step-label">Videos</span>
            <span className="cc-rp-step-val">
              {videosTotal === 0 ? (
                'None'
              ) : (
                <>
                  <strong>{videosDone}</strong> of {videosTotal} complete
                </>
              )}
            </span>
          </li>

          {/* Quiz */}
          <li className="cc-rp-step">
            <HelpCircle size={13} aria-hidden="true" />
            <span className="cc-rp-step-label">Quiz</span>
            <span className="cc-rp-step-val">
              {!lock ? (
                '-'
              ) : lock.quiz.passed ? (
                <>
                  Passed · best <strong>{lock.quiz.bestScorePercent}%</strong> ·{' '}
                  {lock.quiz.attempts} {lock.quiz.attempts === 1 ? 'attempt' : 'attempts'}
                </>
              ) : lock.quiz.locked ? (
                stepLockText(lock.quiz.lockReason)
              ) : lock.quiz.attempts > 0 ? (
                <>
                  Not passed · best <strong>{lock.quiz.bestScorePercent}%</strong> ·{' '}
                  {lock.quiz.attempts} {lock.quiz.attempts === 1 ? 'attempt' : 'attempts'}
                </>
              ) : (
                'Not attempted'
              )}
            </span>
          </li>

          {/* Assignment */}
          <li className="cc-rp-step">
            <ClipboardList size={13} aria-hidden="true" />
            <span className="cc-rp-step-label">Assignment</span>
            <span className="cc-rp-step-val">
              {lock?.assignment.locked && submissionStatus === 'none' ? (
                stepLockText(lock.assignment.lockReason)
              ) : (
                <CcPill variant={SUBMISSION_TONE[submissionStatus]}>
                  {SUBMISSION_COPY[submissionStatus]}
                </CcPill>
              )}
            </span>
          </li>
        </ul>
      </div>
    </li>
  );
}

/* ================================================================== *
 * Submissions
 * ================================================================== */

function SubmissionsCard({ submissions }: { submissions: ResearchSubmission[] }) {
  const rows = useMemo(
    () =>
      [...submissions].sort(
        (a, b) =>
          b.weekNumber - a.weekNumber ||
          b.attemptNumber - a.attemptNumber ||
          dayjs(b.submittedAt).valueOf() - dayjs(a.submittedAt).valueOf(),
      ),
    [submissions],
  );

  return (
    <ProgramCard
      flush
      eyebrow="Assignments"
      title="Submissions"
      titleId="cc-rp-sub-h"
      meta={
        rows.length > 0 ? (
          <span>
            {rows.length} {rows.length === 1 ? 'submission' : 'submissions'}
          </span>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <ProgramState
          icon={<ClipboardList size={20} />}
          title="Nothing handed in yet"
          text="No assignments submitted. Videos and quizzes may still be in progress; see the week ladder above."
        />
      ) : (
        <div className="cc-ptab-scroll cc-ptab-scroll--tall">
          <table className="cc-ptab-table cc-rp-table">
            <caption className="cc-ptab-sr">
              Research Prep assignment submissions, newest week first
            </caption>
            <thead>
              <tr>
                <th scope="col">Week</th>
                <th scope="col">Attempt</th>
                <th scope="col">Status</th>
                <th scope="col">Submitted</th>
                <th scope="col">Graded</th>
                <th scope="col">Grader</th>
                <th scope="col" className="cc-ptab-num">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <SubmissionRow key={s.id} submission={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ProgramCard>
  );
}

function SubmissionRow({ submission: s }: { submission: ResearchSubmission }) {
  const [open, setOpen] = useState(false);
  const hasFeedback = !!s.feedbackMd?.trim();

  return (
    <>
      <tr className="cc-rp-row">
        <th scope="row" className="cc-ptab-table-strong">
          <span className="cc-rp-week-stack">
            <span className="cc-rp-row-wk">Week {s.weekNumber}</span>
            <span className="cc-rp-row-wt">{s.weekTitle}</span>
            {s.fileName &&
              (s.fileUrl ? (
                <a
                  className="cc-rp-file"
                  href={s.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.fileName}
                >
                  {s.fileName}
                </a>
              ) : (
                <span className="cc-rp-file cc-rp-file--plain" title={s.fileName}>
                  {s.fileName}
                </span>
              ))}
          </span>
        </th>
        <td className="cc-ptab-num">#{s.attemptNumber}</td>
        <td>
          <CcPill variant={SUBMISSION_TONE[s.status]}>{SUBMISSION_COPY[s.status]}</CcPill>
        </td>
        <td>{formatDate(s.submittedAt)}</td>
        <td>{formatDate(s.gradedAt)}</td>
        <td>{s.gradedByName || '-'}</td>
        <td className="cc-ptab-num cc-rp-score">
          {typeof s.score === 'number' ? `${s.score}%` : '-'}
        </td>
      </tr>
      {hasFeedback && (
        <tr className="cc-rp-fbrow">
          <td colSpan={7}>
            <button
              type="button"
              className="cc-rp-fbtoggle"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <ChevronDown
                size={12}
                aria-hidden="true"
                className={open ? 'cc-rp-chev cc-rp-chev--open' : 'cc-rp-chev'}
              />
              {open ? 'Hide feedback' : 'Show feedback'}
              <span className="cc-ptab-sr"> for week {s.weekNumber}</span>
            </button>
            {open && (
              /* No markdown renderer exists in this app (the mentor console and
                 admin research screens print *Md fields raw too), and we're not
                 adding a dependency — render as pre-wrapped plain text. */
              <div className="cc-rp-fb">{s.feedbackMd}</div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
