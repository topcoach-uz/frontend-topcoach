/* ── Counselor Console — Admissions program tab ──────────────────────────────
   Read-only view of one student's run through the Admissions course. Card
   anatomy, states and the progress track come from `programChrome`; this file
   owns only what is specific to Admissions. */
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  AlertTriangle,
  BookOpenCheck,
  Clock,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import { useGetStudentProgramsQuery } from '../../../app/services/counselorConsoleApi';
import { CcStat } from '../components/CcStat';
import { CcPill } from '../components/CcPill';
import {
  ProgramCard,
  ProgramMessage,
  ProgramRetry,
  ProgramSkeletonCard,
  ProgramSkeletonTiles,
  ProgramTab,
} from './programChrome';
import './AdmissionsTab.scss';

dayjs.extend(relativeTime);

/** Seconds → "4h 20m" / "18m" / "—". Watch time is stored in seconds. */
function humaniseWatchTime(seconds: number): string {
  if (!seconds || seconds < 60) return seconds > 0 ? '<1m' : '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (!hours) return `${minutes}m`;
  // 59.6min rounds to 60 — carry it rather than printing "3h 60m".
  if (minutes === 60) return `${hours + 1}h`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export default function AdmissionsTab({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  const { data, isLoading, isError, refetch } = useGetStudentProgramsQuery(
    { orgId, userId },
    { skip: !orgId || !userId },
  );

  if (isLoading) {
    return (
      <ProgramTab program="Admissions" className="cc-adm" busy>
        <ProgramSkeletonTiles count={4} />
        <ProgramSkeletonCard rows={3} />
      </ProgramTab>
    );
  }

  if (isError) {
    return (
      <ProgramTab program="Admissions" className="cc-adm">
        <ProgramMessage
          icon={<AlertTriangle size={20} />}
          tone="danger"
          title="Couldn’t load Admissions"
          text="The student’s Admissions progress didn’t load. This is usually temporary."
          action={<ProgramRetry onClick={() => refetch()} />}
        />
      </ProgramTab>
    );
  }

  const admissions = data?.admissions;

  if (!admissions) {
    return (
      <ProgramTab program="Admissions" className="cc-adm">
        <ProgramMessage
          icon={<GraduationCap size={20} />}
          title="Not enrolled in Admissions"
          text="This student hasn’t joined the Admissions course, so there’s no lesson progress to show yet."
        />
      </ProgramTab>
    );
  }

  const { progress, lessons, totalTimeWatched, lastWatchedAt } = admissions;
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const started = lessons.completed > 0 || totalTimeWatched > 0;

  return (
    <ProgramTab program="Admissions" className="cc-adm">
      {/* Headline figures. The stat tiles are the only place the numbers are
          stated large — the bar below reads them, it doesn't repeat them. */}
      <div className="cc-stat-grid">
        <CcStat
          icon={<TrendingUp size={14} />}
          label="Progress"
          value={`${pct}%`}
          meta="Of the Admissions course"
          tone={pct >= 50 ? 'good' : 'neutral'}
        />
        <CcStat
          icon={<BookOpenCheck size={14} />}
          label="Lessons"
          value={`${lessons.completed}/${lessons.total}`}
          meta="Completed"
          tone="info"
        />
        <CcStat
          icon={<Clock size={14} />}
          label="Time watched"
          value={humaniseWatchTime(totalTimeWatched)}
          meta="Total lesson time"
          tone="neutral"
        />
        <CcStat
          icon={<GraduationCap size={14} />}
          label="Last activity"
          value={lastWatchedAt ? dayjs(lastWatchedAt).fromNow() : '-'}
          meta={
            lastWatchedAt
              ? dayjs(lastWatchedAt).format('D MMM YYYY')
              : 'No activity yet'
          }
          tone={lastWatchedAt ? 'neutral' : 'warn'}
        />
      </div>

      <ProgramCard
        eyebrow="Curriculum"
        title="Course progress"
        sub="Share of the Admissions lessons this student has completed."
        meta={
          <CcPill variant={started ? 'accent' : 'neutral'}>
            {started ? 'Active' : 'Not started'}
          </CcPill>
        }
      >
        <div className="cc-adm-bar-meta">
          <span>
            {lessons.completed} of {lessons.total} lessons complete
          </span>
          <span className="cc-ptab-muted">{pct}%</span>
        </div>
        <div
          className="cc-ptab-track"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Admissions course progress"
        >
          <span className="cc-ptab-track-fill" style={{ width: `${pct}%` }} />
        </div>
      </ProgramCard>
    </ProgramTab>
  );
}
