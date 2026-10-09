/* ── Counselor Console — Full Support program tab ────────────────────────────
   Read-only view of one student's 1:1 mentoring engagement: mentor, hours,
   sessions, assigned tasks, milestones and application pipeline.

   Card anatomy, states, tables and the progress track come from
   `programChrome` — this file owns the session timeline and the milestone
   checklist, which are Full Support's own forms. */
import { useMemo, type ReactNode } from 'react';
import { Skeleton } from 'antd';
import dayjs from 'dayjs';
import {
  AlertTriangle,
  Check,
  CircleDashed,
  Clock,
  ExternalLink,
  Flag,
  GraduationCap,
  Timer,
  UserRound,
} from 'lucide-react';

import { useGetStudentFullSupportDetailQuery } from 'src/app/services/counselorConsoleApi';
import type {
  FullSupportSession,
  StudentFullSupportDetail,
} from 'src/app/services/counselorConsoleApi';
import {
  useGetStudentJourneyTasksQuery,
  type StudentJourneyTask,
} from 'src/app/services/student-hub/studentJourneyReadonlyApi';

import { CcAvatar } from '../components/CcAvatar';
import { CcPill, type CcPillVariant } from '../components/CcPill';
import { CcStat } from '../components/CcStat';
import {
  ProgramCard,
  ProgramMessage,
  ProgramRetry,
  ProgramSkeletonCard,
  ProgramSkeletonTiles,
  ProgramTab,
} from './programChrome';
import './FullSupportTab.scss';

/* ─────────────────────────────────────────────────────────────────────────────
   Derivations
   ──────────────────────────────────────────────────────────────────────────── */

type TaskStatus = 'Reviewed' | 'Needs review' | 'Pending' | 'Revision requested';

/**
 * Feedback wins, then any submission (text OR files), else pending.
 *
 * The student app (FullSupportStudentPage.handleSubmitTask) always writes a
 * non-empty `submissionText`, falling back to 'Files submitted.' — so checking
 * text alone agrees with the student view for anything submitted through the
 * student UI. We also count `submissionFileUrls` because a file-only row
 * written by any other path would otherwise read "Pending", telling a counselor
 * the student did nothing when they in fact submitted. Under-reporting work is
 * the costlier error here, and this matches `_journey/Tasks.tsx`.
 */
function taskStatus(t: StudentJourneyTask): TaskStatus {
  if (t.status === 'revision_requested') return 'Revision requested';
  if (t.status === 'submitted') return 'Needs review';
  if (t.status === 'approved' || t.hasFeedback) return 'Reviewed';
  if (t.submissionText || t.submissionFileUrls?.length) return 'Needs review';
  return 'Pending';
}

/* Tone mapping is the family's, not this tab's: done → success, waiting on
   someone → warning, nothing yet → neutral, past due → danger. The same
   semantics carry the same tone in every program tab. */
const TASK_PILL: Record<TaskStatus, CcPillVariant> = {
  Reviewed: 'success',
  'Needs review': 'warning',
  'Revision requested': 'warning',
  Pending: 'neutral',
};

/** Overdue = past deadline with nothing submitted yet. */
function isOverdue(t: StudentJourneyTask, status: TaskStatus): boolean {
  if (status !== 'Pending' || !t.deadline) return false;
  return dayjs(t.deadline).endOf('day').isBefore(dayjs());
}

type SessionState = 'done' | 'upcoming' | 'unlogged';

/**
 * A session is only "upcoming" if it is both not done and still in the future.
 * A past session that was never marked done is neither — surfacing it as
 * `unlogged` keeps the counselor from reading a stale record as a plan.
 */
function sessionState(s: FullSupportSession): SessionState {
  if (s.done) return 'done';
  return dayjs(s.dateTime).isAfter(dayjs()) ? 'upcoming' : 'unlogged';
}

function formatDateTime(iso: string): string {
  const d = dayjs(iso);
  return d.isValid() ? d.format('MMM D, YYYY · h:mm A') : iso;
}

function formatDay(value: string | null): string {
  if (!value) return '-';
  const d = dayjs(value);
  return d.isValid() ? d.format('MMM D, YYYY') : value;
}

function Quiet({ children }: { children: ReactNode }) {
  return <p className="cc-ptab-quiet">{children}</p>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Tab
   ──────────────────────────────────────────────────────────────────────────── */

export default function FullSupportTab({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useGetStudentFullSupportDetailQuery(
    { orgId, userId },
    { skip: !orgId || !userId },
  );

  const {
    data: tasksRes,
    isLoading: tasksLoading,
    isError: tasksError,
  } = useGetStudentJourneyTasksQuery(userId, { skip: !userId });

  const tasks = tasksRes?.data ?? [];

  if (isLoading) {
    return (
      <ProgramTab program="Full Support" className="cc-fs" busy>
        <ProgramSkeletonCard rows={1} />
        <ProgramSkeletonTiles count={2} />
        <ProgramSkeletonCard rows={5} />
      </ProgramTab>
    );
  }

  if (isError) {
    return (
      <ProgramTab program="Full Support" className="cc-fs">
        <ProgramMessage
          icon={<AlertTriangle size={20} />}
          tone="danger"
          title="Couldn’t load Full Support"
          text="The student’s Full Support record didn’t load. This is usually temporary."
          action={<ProgramRetry onClick={() => refetch()} />}
        />
      </ProgramTab>
    );
  }

  if (!detail || !detail.enrolled) {
    return (
      <ProgramTab program="Full Support" className="cc-fs">
        <ProgramMessage
          icon={<GraduationCap size={20} />}
          title="Not enrolled in Full Support"
          text="This student has no Full Support engagement yet. Sessions, hours, tasks, milestones and the application pipeline appear here once they’re enrolled and matched with a mentor."
        />
      </ProgramTab>
    );
  }

  return (
    <ProgramTab program="Full Support" className="cc-fs">
      <MentorSection detail={detail} />
      <HoursSection detail={detail} />
      <SessionsSection sessions={detail.sessions} />
      <TasksSection tasks={tasks} loading={tasksLoading} error={tasksError} />
      <MilestonesSection milestones={detail.milestones} />
      <PipelineSection pipeline={detail.pipeline} />
    </ProgramTab>
  );
}

/* ── 1. Mentor ─────────────────────────────────────────────────────────────── */

function MentorSection({ detail }: { detail: StudentFullSupportDetail }) {
  const { mentor } = detail;
  return (
    <ProgramCard eyebrow="Assigned to" title="Mentor">
      {mentor ? (
        <div className="cc-fs-mentor">
          <CcAvatar name={mentor.name} src={mentor.avatarUrl} size={44} />
          <div>
            <div className="cc-fs-mentor__name">{mentor.name}</div>
            <div className="cc-fs-mentor__role">Full Support mentor</div>
          </div>
        </div>
      ) : (
        <div className="cc-fs-mentor cc-fs-mentor--empty">
          <span className="cc-fs-mentor__placeholder" aria-hidden="true">
            <UserRound size={20} />
          </span>
          <div>
            <div className="cc-fs-mentor__name">No mentor assigned</div>
            <div className="cc-fs-mentor__role">
              The student is enrolled but not yet matched. Sessions can’t be
              scheduled until a mentor is assigned.
            </div>
          </div>
        </div>
      )}
    </ProgramCard>
  );
}

/* ── 2. Hours ──────────────────────────────────────────────────────────────── */

/**
 * Both figures are lifetime totals. The schema has no allocation column and the
 * query applies no date filter, so there is no honest way to say "this month"
 * or "allocated" here — `logged` is simply every session log ever created, and
 * `completed` is the subset marked done.
 */
function HoursSection({ detail }: { detail: StudentFullSupportDetail }) {
  const { completed, logged } = detail.hours;
  const pct = logged > 0 ? Math.round((completed / logged) * 100) : 0;

  return (
    <ProgramCard
      eyebrow="All time"
      title="Mentoring hours"
      sub="Lifetime totals, not a monthly figure."
    >
      <div className="cc-stat-grid cc-fs-stats">
        <CcStat
          icon={<Check size={14} />}
          label="Hours completed"
          value={`${completed}h`}
          meta="Sessions marked done, all time"
          tone="good"
        />
        <CcStat
          icon={<Timer size={14} />}
          label="Hours logged"
          value={`${logged}h`}
          meta="Every session logged, done or not, all time"
          tone="info"
        />
      </div>

      {logged > 0 ? (
        <div className="cc-fs-ratio">
          <div className="cc-fs-ratio__head">
            <span className="cc-ptab-eyebrow">Completed vs logged</span>
            <span className="cc-fs-ratio__figure">
              {completed}h of {logged}h · {pct}%
            </span>
          </div>
          <div
            className="cc-ptab-track"
            role="img"
            aria-label={`${completed} of ${logged} logged hours completed, ${pct} percent, all time`}
          >
            <div className="cc-ptab-track-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="cc-ptab-fine">
            Share of all logged session hours that have been marked done. There
            is no hour allowance in the data, so this is a completion rate — not
            progress against a target.
          </p>
        </div>
      ) : (
        <Quiet>No session hours logged yet.</Quiet>
      )}
    </ProgramCard>
  );
}

/* ── 3. Session timeline ───────────────────────────────────────────────────── */

function SessionsSection({ sessions }: { sessions: FullSupportSession[] }) {
  return (
    <ProgramCard
      eyebrow="Newest first"
      title="Session timeline"
      meta={
        sessions.length > 0 ? (
          <span>
            {sessions.length} session{sessions.length === 1 ? '' : 's'}
          </span>
        ) : undefined
      }
    >
      {sessions.length === 0 ? (
        <Quiet>
          No sessions logged yet. Entries appear here once the mentor records a
          session.
        </Quiet>
      ) : (
        <ol className="cc-fs-timeline">
          {sessions.map((s) => {
            const state = sessionState(s);
            const canJoin = state === 'upcoming' && !!s.meetingLink;
            return (
              <li key={s.id} className={`cc-fs-tl cc-fs-tl--${state}`}>
                <span className="cc-fs-tl__dot" aria-hidden="true" />
                <div className="cc-fs-tl__body">
                  <div className="cc-fs-tl__top">
                    <time className="cc-fs-tl__when" dateTime={s.dateTime}>
                      {formatDateTime(s.dateTime)}
                    </time>
                    <span className="cc-fs-tl__dur">
                      <Clock size={12} aria-hidden="true" /> {s.duration}
                    </span>
                    {state === 'done' && <CcPill variant="success">Done</CcPill>}
                    {state === 'upcoming' && (
                      <CcPill variant="info">Upcoming</CcPill>
                    )}
                    {state === 'unlogged' && (
                      <CcPill variant="warning">Not marked done</CcPill>
                    )}
                  </div>
                  {s.description ? (
                    <p className="cc-fs-tl__desc">{s.description}</p>
                  ) : (
                    <p className="cc-fs-tl__desc cc-fs-tl__desc--empty">
                      No description recorded.
                    </p>
                  )}
                  {canJoin && (
                    <a
                      className="cc-ptab-link cc-fs-tl__join"
                      href={s.meetingLink as string}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Join <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </ProgramCard>
  );
}

/* ── 4. Tasks from the mentor ──────────────────────────────────────────────── */

function TasksSection({
  tasks,
  loading,
  error,
}: {
  tasks: StudentJourneyTask[];
  loading: boolean;
  error: boolean;
}) {
  return (
    <ProgramCard
      eyebrow="Assigned work"
      title="Tasks from the mentor"
      meta={
        !loading && !error && tasks.length > 0 ? (
          <span>
            {tasks.length} task{tasks.length === 1 ? '' : 's'}
          </span>
        ) : undefined
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : error ? (
        <Quiet>Tasks didn’t load. Refresh the page to try again.</Quiet>
      ) : tasks.length === 0 ? (
        <Quiet>
          The mentor hasn’t assigned any tasks yet. Assigned work and its review
          status appear here.
        </Quiet>
      ) : (
        <div className="cc-ptab-scroll">
          <table className="cc-ptab-table">
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col">Deadline</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => {
                const status = taskStatus(t);
                const overdue = isOverdue(t, status);
                return (
                  <tr key={t.id}>
                    <td className="cc-ptab-table-strong">{t.task}</td>
                    <td>{formatDay(t.deadline)}</td>
                    <td>
                      {overdue ? (
                        <CcPill variant="danger">Overdue</CcPill>
                      ) : (
                        <CcPill variant={TASK_PILL[status]}>{status}</CcPill>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ProgramCard>
  );
}

/* ── 5. Milestone tracker ──────────────────────────────────────────────────── */

function MilestonesSection({
  milestones,
}: {
  milestones: StudentFullSupportDetail['milestones'];
}) {
  const doneCount = useMemo(
    () => milestones.filter((m) => m.done).length,
    [milestones],
  );

  return (
    <ProgramCard
      eyebrow="Progress"
      title="Milestones"
      meta={
        milestones.length > 0 ? (
          <span>
            {doneCount} of {milestones.length} done
          </span>
        ) : undefined
      }
    >
      {milestones.length === 0 ? (
        <Quiet>
          No milestones set yet. Once the mentor defines them, they appear here
          with what’s done and what’s next.
        </Quiet>
      ) : (
        <ul className="cc-fs-checklist">
          {milestones.map((m) => (
            <li
              key={m.id}
              className={`cc-fs-check ${m.done ? 'cc-fs-check--done' : ''}`}
            >
              <span className="cc-fs-check__mark" aria-hidden="true">
                {m.done ? <Check size={12} /> : <CircleDashed size={14} />}
              </span>
              <span className="cc-fs-check__label">{m.label}</span>
              <span className="cc-fs-check__date">{formatDay(m.date)}</span>
              <span className="cc-ptab-sr">{m.done ? 'Done' : 'Not done'}</span>
            </li>
          ))}
        </ul>
      )}
    </ProgramCard>
  );
}

/* ── 6. Application tracker ────────────────────────────────────────────────── */

function PipelineSection({
  pipeline,
}: {
  pipeline: StudentFullSupportDetail['pipeline'];
}) {
  return (
    <ProgramCard
      eyebrow="Applications"
      title="Application tracker"
      meta={
        pipeline.length > 0 ? (
          <span>
            {pipeline.length} program{pipeline.length === 1 ? '' : 's'}
          </span>
        ) : undefined
      }
    >
      {pipeline.length === 0 ? (
        <Quiet>
          No programs in the pipeline yet. Schools the student is working toward
          are listed here with their stage and deadline.
        </Quiet>
      ) : (
        <div className="cc-ptab-scroll">
          <table className="cc-ptab-table">
            <thead>
              <tr>
                <th scope="col">Program</th>
                <th scope="col">Stage</th>
                <th scope="col">Status</th>
                <th scope="col">Aid</th>
                <th scope="col">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {pipeline.map((p) => (
                <tr key={p.id}>
                  <td className="cc-ptab-table-strong">{p.program}</td>
                  <td>{p.stage || '-'}</td>
                  <td>
                    {p.status ? (
                      <CcPill variant="neutral">{p.status}</CcPill>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {p.aid ? (
                      <span className="cc-fs-aid">
                        <Flag size={12} aria-hidden="true" /> Yes
                      </span>
                    ) : (
                      <span className="cc-ptab-muted">-</span>
                    )}
                  </td>
                  <td>{formatDay(p.deadline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ProgramCard>
  );
}
