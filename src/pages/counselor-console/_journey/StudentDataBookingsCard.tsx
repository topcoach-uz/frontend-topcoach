/**
 * Counselor-console (read-only) view of a student's 1:1 session history.
 *
 * Merges TWO sources so owners/counselors/admins see the full picture:
 *   1. Mentor bookings  (the `sessions` table — where the student is a participant)
 *   2. Full Support 1:1 mentoring session logs (`full_support_session_logs`)
 *
 * Rendered in the editorial console style (not the student-hub BookingsCard),
 * split into Upcoming / Past / Cancelled.
 */
import { useMemo, useState } from 'react';
import { CalendarClock, Video, User2 } from 'lucide-react';
import { SessionTypeEnum } from 'src/app/api/Api';
import {
  useGetStudentJourneyMentorBookingsQuery,
  useGetStudentJourneyFullSupportSessionsQuery,
} from 'src/app/services/student-hub/studentJourneyReadonlyApi';
import { CcAvatar } from '../components/CcAvatar';
import { CcPill, type CcPillVariant } from '../components/CcPill';
import './sessions-readonly.scss';

interface Props {
  studentUserId: string;
}

type SessionStatus = 'upcoming' | 'past' | 'cancelled';

interface UnifiedSession {
  id: string;
  date: Date;
  kind: 'mentor' | 'fullSupport';
  typeLabel: string;
  durationMin: number;
  mentorName: string | null;
  mentorAvatarUrl: string | null;
  description?: string;
  meetingLink?: string | null;
  status: SessionStatus;
}

const TABS: { key: SessionStatus; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

function durationLabel(min: number): string {
  if (min % 60 === 0) return `${min / 60}h`;
  return `${min}m`;
}

/** "1h", "1.5h", "90m" → minutes. */
function parseDuration(raw: string | undefined): number {
  if (!raw) return 60;
  const s = raw.trim().toLowerCase();
  const hourMatch = s.match(/^([\d.]+)\s*h/);
  if (hourMatch) return Math.round(parseFloat(hourMatch[1]!) * 60);
  const minMatch = s.match(/^([\d.]+)\s*m/);
  if (minMatch) return Math.round(parseFloat(minMatch[1]!));
  const n = Number(s);
  return Number.isFinite(n) ? n : 60;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const STATUS_PILL: Record<SessionStatus, { tone: CcPillVariant; label: string }> = {
  upcoming: { tone: 'info', label: 'Upcoming' },
  past: { tone: 'success', label: 'Completed' },
  cancelled: { tone: 'neutral', label: 'Cancelled' },
};

export default function StudentSessionsReadonly({ studentUserId }: Props) {
  const { data: bookingsRes, isLoading: bookingsLoading } =
    useGetStudentJourneyMentorBookingsQuery(studentUserId, {
      skip: !studentUserId,
    });
  const { data: fsRes, isLoading: fsLoading } =
    useGetStudentJourneyFullSupportSessionsQuery(studentUserId, {
      skip: !studentUserId,
    });

  const isLoading = bookingsLoading || fsLoading;

  const sessions = useMemo<UnifiedSession[]>(() => {
    const now = Date.now();
    const out: UnifiedSession[] = [];

    // ── Mentor bookings ──
    for (const s of bookingsRes?.data ?? []) {
      const date = new Date(s.date);
      const durationMin = s.type === SessionTypeEnum.Individual30M ? 30 : 60;
      const cancelled = !!s.cancelStatus?.id;
      const status: SessionStatus = cancelled
        ? 'cancelled'
        : date.getTime() + durationMin * 60_000 > now
          ? 'upcoming'
          : 'past';
      out.push({
        id: `mentor-${s.id}`,
        date,
        kind: 'mentor',
        typeLabel: `Mentor · ${durationLabel(durationMin)}`,
        durationMin,
        mentorName: s.mentor?.profile?.name ?? null,
        mentorAvatarUrl:
          s.mentor?.profile?.media?.find((m: any) => m?.url)?.url ?? null,
        status,
      });
    }

    // ── Full Support 1:1 session logs ──
    for (const l of fsRes?.data ?? []) {
      const date = new Date(l.dateTime);
      const durationMin = parseDuration(l.duration);
      const status: SessionStatus =
        !l.done && date.getTime() + durationMin * 60_000 > now
          ? 'upcoming'
          : 'past';
      out.push({
        id: `fs-${l.id}`,
        date,
        kind: 'fullSupport',
        typeLabel: `Full Support · ${durationLabel(durationMin)}`,
        durationMin,
        mentorName: l.mentorName,
        mentorAvatarUrl: l.mentorAvatarUrl,
        description: l.description,
        meetingLink: l.meetingLink,
        status,
      });
    }

    return out.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [bookingsRes, fsRes]);

  const counts = useMemo(
    () => ({
      upcoming: sessions.filter((s) => s.status === 'upcoming').length,
      past: sessions.filter((s) => s.status === 'past').length,
      cancelled: sessions.filter((s) => s.status === 'cancelled').length,
    }),
    [sessions],
  );

  // Default to the first non-empty tab so counselors land on real data.
  const [tab, setTab] = useState<SessionStatus | null>(null);
  const activeTab: SessionStatus =
    tab ??
    (counts.upcoming > 0
      ? 'upcoming'
      : counts.past > 0
        ? 'past'
        : counts.cancelled > 0
          ? 'cancelled'
          : 'upcoming');

  const visible = sessions.filter((s) => s.status === activeTab);

  if (isLoading) {
    return <div className="cc-sess-loading">Loading sessions…</div>;
  }

  return (
    <div className="cc-sess">
      <div className="cc-sess-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={activeTab === t.key}
            className={`cc-sess-tab ${activeTab === t.key ? 'cc-sess-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className="cc-sess-tab-count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="cc-sess-empty">
          <CalendarClock size={20} />
          <span>No {activeTab} sessions.</span>
        </div>
      ) : (
        <ul className="cc-sess-list">
          {visible.map((s) => {
            const pill = STATUS_PILL[s.status];
            return (
              <li key={s.id} className="cc-sess-row">
                <div className="cc-sess-when">
                  <span className="cc-sess-date">{fmtDate(s.date)}</span>
                  <span className="cc-sess-time">{fmtTime(s.date)}</span>
                </div>
                <div className="cc-sess-mid">
                  <div className="cc-sess-mentor">
                    {s.mentorName ? (
                      <CcAvatar
                        name={s.mentorName}
                        src={s.mentorAvatarUrl}
                        size={28}
                      />
                    ) : (
                      <span className="cc-sess-mentor-ico">
                        <User2 size={14} />
                      </span>
                    )}
                    <div className="cc-sess-mentor-meta">
                      <span className="cc-sess-mentor-name">
                        {s.mentorName ?? 'Mentor'}
                      </span>
                      <span className="cc-sess-type">{s.typeLabel}</span>
                    </div>
                  </div>
                  {s.description ? (
                    <p className="cc-sess-desc">{s.description}</p>
                  ) : null}
                </div>
                <div className="cc-sess-right">
                  <CcPill variant={pill.tone}>{pill.label}</CcPill>
                  {s.meetingLink && s.status === 'upcoming' ? (
                    <a
                      className="cc-sess-link"
                      href={s.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Video size={13} /> Join
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
