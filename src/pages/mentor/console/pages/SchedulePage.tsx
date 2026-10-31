import FullSupportLessonActions from '../components/FullSupportLessonActions';
import { lessonLabel, lessonError } from '../fullSupportLessons';
import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Spin,
  Space,
  message,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarPlus,
  CheckCircle2,
  Flag,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleMeetingSvg } from 'src/assets/svg';
import {
  useCreateMentorSessionMutation,
  useGetMentorRosterQuery,
  useRecordMentorLessonMutation,
  type SessionLogDto,
} from 'src/app/services/fullSupportApi';
import { useGetMentorAvailabilityQuery } from 'src/app/services/availability';
import { McPill } from '../components/McPill';
import SessionChatButton from '../components/SessionChatButton';
import SessionReportModal from '../components/SessionReportModal';
import LessonRecordModal, { type LessonRecordInput } from '../components/LessonRecordModal';
import { useMentorConsole } from '../MentorConsoleContext';
import { useMentorBookings, type MentorBooking } from '../sessionSources';
import { bookingDisplay, scheduleScopes } from '../sessionDisplay';
import { formatRelative } from '../utils';
import './SchedulePage.scss';

// Only flag recent sessions — stale 60-day-old entries just create noise.
const PENDING_REPORT_WINDOW_DAYS = 14;

type Scope = 'upcoming' | 'due' | 'past' | 'cancelled';

const SCOPES: Scope[] = ['upcoming', 'due', 'past', 'cancelled'];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function timeRange(b: MentorBooking): string {
  const start = new Date(b.dateTime);
  const end = new Date(start.getTime() + b.durationMinutes * 60_000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function upcomingPill(b: MentorBooking) {
  const start = new Date(b.dateTime);
  const now = new Date();
  const isToday = start.toDateString() === now.toDateString();
  if (isToday) return <McPill variant="accent">Today</McPill>;
  if (start.getTime() - now.getTime() < WEEK_MS) {
    return <McPill variant="warning">This week</McPill>;
  }
  return <McPill variant="info">Upcoming</McPill>;
}

export default function MentorConsoleSchedulePage() {
  const navigate = useNavigate();
  const { id: mentorId, displayName, hasFullSupport, isMentor } = useMentorConsole();
  const [searchParams, setSearchParams] = useSearchParams();
  const fullSupportOnly = searchParams.get('program') === 'full-support';
  // Honor `?scope=past` / `?scope=due` deep-links (old dashboard KPIs, emails).
  const initialScope = SCOPES.includes(searchParams.get('scope') as Scope)
    ? (searchParams.get('scope') as Scope)
    : fullSupportOnly ? 'due' : 'upcoming';
  const scope = initialScope;
  const setScope = (next: Scope) => setSearchParams(params => { params.set('scope', next); return params; });
  const setProgramFilter = (value: 'all' | 'full-support') => setSearchParams(params => {
    // Keep the current status tab and any other deep-link parameters.
    params.set('scope', scope);
    if (value === 'full-support') params.set('program', value);
    else params.delete('program');
    return params;
  });
  const [reportBooking, setReportBooking] = useState<MentorBooking | null>(null);

  const [recordBooking, setRecordBooking] = useState<MentorBooking | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logForm] = Form.useForm<{
    studentUserId: string;
    when: Dayjs;
    duration: string;
    description: string;
    meetingLink?: string;
  }>();

  // Shared (RTK-cached) with the gate/layout, which fire it for every mentor —
  // `hasFullSupport` is derived from this same query, so its loading flag tells
  // us whether Full Support participation is actually known yet.
  const { data: rosterRes, isLoading: rosterLoading } = useGetMentorRosterQuery(undefined, {
    skip: !isMentor,
  });
  const roster = useMemo(() => rosterRes?.data ?? [], [rosterRes?.data]);
  const rosterById = useMemo(() => new Map(roster.map((r) => [r.id, r])), [roster]);

  // Non-FS mentors get a "students can't book you yet" nudge instead of tiles.
  const { data: availabilityRes, isLoading: availabilityLoading } =
    useGetMentorAvailabilityQuery(mentorId, {
      skip: hasFullSupport || !mentorId,
    });
  const hasAvailability = (availabilityRes?.slots?.length ?? 0) > 0;
  // `hasFullSupport` and `hasAvailability` are both false while their queries
  // are still in flight — only surface the nudge once everything has settled.
  const bookabilityKnown = !rosterLoading && !availabilityLoading;

  const { bookings, isLoading, isError } = useMentorBookings(null, {
    includeFullSupport: hasFullSupport,
  });
  const [createSession, { isLoading: creating }] = useCreateMentorSessionMutation();
  const [recordLesson, { isLoading: recordingFs }] = useRecordMentorLessonMutation();

  const decorated = useMemo<MentorBooking[]>(() => {
    const relevant = hasFullSupport ? bookings : bookings.filter((b) => b.source === 'platform');
    return relevant.filter(b => !fullSupportOnly || b.source === 'full-support').map((b) => ({
      ...b,
      studentName:
        b.studentName || (b.studentUserId && rosterById.get(b.studentUserId)?.name) || null,
    }));
  }, [bookings, hasFullSupport, rosterById, fullSupportOnly]);

  const byScope = useMemo(() => scheduleScopes(decorated), [decorated]);

  const pendingReport = useMemo(() => {
    const windowMs = PENDING_REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return (
      byScope.due.find((b) => b.source === 'platform' && now - new Date(b.dateTime).getTime() <= windowMs) ?? null
    );
  }, [byScope.due]);

  const openReportFor = (b: MentorBooking) => {
    if (b.source === 'platform') {
      setReportBooking(b);
    } else {
      setRecordBooking(b);
    }
  };

  const saveLesson = async (input: LessonRecordInput) => {
    if (!recordBooking) return;
    await recordLesson({ id: (recordBooking.raw as SessionLogDto).id, ...input }).unwrap();
  };
  const recordValue = useMemo(() => {
    if (!recordBooking) return null;
    const record = recordBooking.raw as SessionLogDto;
    if (!record) return null;
    return {
      outcome: ['held', 'student_no_show', 'mentor_no_show', 'cancelled'].includes(record.outcome) ? record.outcome as LessonRecordInput['outcome'] : 'held' as const,
      attendance: record.attendance === 'late' ? 'late' as const : 'present' as const,
      actualDurationMinutes: record.actualDurationMinutes ?? recordBooking.durationMinutes,
      sharedNotes: record.sharedNotes,
    };
  }, [recordBooking]);

  const submitLog = async () => {
    const values = await logForm.validateFields();
    await createSession({
      studentUserId: values.studentUserId,
      dateTime: values.when.toISOString(),
      duration: values.duration,
      description: values.description || '',
      meetingLink: values.meetingLink?.trim() || undefined,
    })
      .unwrap()
      .then(() => {
        message.success('Session logged');
        setLogOpen(false);
        logForm.resetFields();
      })
      .catch((error) => message.error(lessonError(error)));
  };

  // One editorial card for every scope — a serif date, the student, a status
  // pill, an optional Google Meet join, then the actions. Rendered in a grid so
  // cards stay card-sized instead of stretching across the page.
  const renderSessionCard = (b: MentorBooking) => {
    const d = new Date(b.dateTime);
    const isUpcoming = b.status === 'upcoming';
    const display = bookingDisplay(b);
    const statusPill = isUpcoming && display.label === 'Upcoming' ? upcomingPill(b) : <McPill variant={display.variant}>{display.label}</McPill>;

    return (
      <div
        key={b.id}
        id={b.source === 'full-support' ? `lesson-${(b.raw as SessionLogDto).id}` : undefined}
        className={`mc-scard${b.status === 'cancelled' ? ' mc-scard--muted' : ''}${
          b.status === 'report-due' ? ' mc-scard--due' : ''
        }${isUpcoming ? ' mc-scard--live' : ''}`}
      >
        <div className="mc-scard-top">
          <div className="mc-scard-date" aria-hidden>
            <span className="mc-scard-day">{d.getDate()}</span>
            <span className="mc-scard-month">
              {d.toLocaleDateString(undefined, { month: 'short' })}
            </span>
          </div>
          <Space size={6} wrap>
            {statusPill}
            {b.source === 'platform' && b.status === 'report-due' && display.label !== 'Report due' && <McPill variant="danger">Report due</McPill>}
          </Space>
        </div>

        <div className="mc-scard-name">{b.studentName || 'Student'}</div>
        <div className="mc-scard-when">
          {d.toLocaleDateString(undefined, { weekday: 'short' })} · {timeRange(b)} · {b.durationLabel}
        </div>
        <div className="mc-scard-meta">
          {b.source === 'full-support' ? 'Full Support' : 'Platform booking'}
          {b.description ? ` · ${b.description}` : ''}
          {b.status === 'cancelled' && b.cancelReason ? ` · ${b.cancelReason}` : ''}
        </div>

        {b.studentNote ? (
          <div className="mc-scard-note">
            <MessageSquare size={12} />
            <span>
              <b>Note:</b> {b.studentNote}
            </span>
          </div>
        ) : null}

        {isUpcoming && b.joinUrl ? (
          <a className="mc-scard-meet" href={b.joinUrl} target="_blank" rel="noreferrer">
            <GoogleMeetingSvg />
            <span className="mc-scard-meet-link">
              Join Google Meet <ArrowUpRight size={13} />
            </span>
            <span className="mc-scard-live-dot" aria-hidden />
          </a>
        ) : null}

        <div className="mc-scard-meta">{b.source === 'full-support' && <>Attendance: {display.attendance}{display.actualMinutes !== null ? ` · ${display.actualMinutes} min actual` : ''}</>}</div>
        <div className="mc-scard-actions">
          {b.source === 'full-support' && <FullSupportLessonActions lesson={b.raw as SessionLogDto} showAttendance={false} />}
          {b.source === 'full-support' && b.status === 'completed' && <Button size="small" onClick={() => setRecordBooking(b)}>Edit lesson record</Button>}
          {b.status === 'report-due' &&
            (b.source === 'platform' ? (
              <Button type="primary" size="small" onClick={() => setReportBooking(b)}>
                Write report
              </Button>
            ) : (
              <Button type="primary" size="small" onClick={() => setRecordBooking(b)}>
                Record lesson
              </Button>
            ))}
          {b.status === 'completed' && b.source === 'platform' && b.report ? (
            <Button size="small" onClick={() => setReportBooking(b)}>
              View report
            </Button>
          ) : null}
          {b.studentUserId ? (
            <SessionChatButton
              mentorId={mentorId}
              studentId={b.studentUserId}
              studentName={b.studentName}
              compact
            />
          ) : null}
          {b.studentUserId ? (
            <Button
              size="small"
              type="text"
              className="mc-sched-row-ghost"
              onClick={() => navigate(`/mentor/students/${b.studentUserId}`)}
            >
              View student
            </Button>
          ) : null}
        </div>
      </div>
    );
  };

  const today = new Date();
  const rows = byScope[scope];

  if (isLoading && decorated.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="mc-sched">
      {pendingReport && (
        <div className="mc-alert-banner">
          <Flag size={22} color="var(--mc-danger)" />
          <div className="mc-alert-banner-body">
            <div className="mc-alert-banner-title">{pendingReport.source === 'full-support' ? 'Lesson record pending' : 'Session report pending'}</div>
            <div className="mc-alert-banner-subtitle">
              Your session{pendingReport.studentName ? ` with ${pendingReport.studentName}` : ''}{' '}
              ended {formatRelative(pendingReport.dateTime)}. {pendingReport.source === 'full-support' ? 'Record the lesson outcome and attendance.' : 'Submit your session report.'}
            </div>
          </div>
          <Button
            type="primary"
            onClick={() => openReportFor(pendingReport)}
            style={{ background: 'var(--mc-danger)', borderColor: 'var(--mc-danger)' }}
          >
            {pendingReport.source === 'full-support' ? 'Record lesson' : 'Write report'}
          </Button>
        </div>
      )}

      <header className="mc-sched-hero">
        <div>
          <div className="mc-page-eyebrow">
            Mentor <span className="mc-page-eyebrow-accent">· Schedule</span>
          </div>
          <h1 className="mc-page-title" style={{ marginBottom: 8 }}>
            {`Welcome back, ${displayName.split(' ')[0] || 'mentor'}`}
          </h1>
          <p className="mc-page-lead" style={{ marginBottom: 0 }}>
            Your sessions — upcoming, past, and anything awaiting attendance or a report.
          </p>
        </div>
        <div className="mc-sched-date" aria-hidden>
          <span className="mc-sched-date-day">{today.getDate()}</span>
          <span className="mc-sched-date-rest">
            {today.toLocaleDateString(undefined, { weekday: 'long' })}
            <br />
            {today.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </header>

      {bookabilityKnown && !hasFullSupport && !hasAvailability && (
        <button
          type="button"
          className="mc-sched-nudge"
          onClick={() => navigate('/mentor/availability')}
        >
          <CalendarPlus size={17} />
          <span>
            <b>Students can&apos;t book you yet.</b> Set your weekly hours to become bookable.
          </span>
          <ArrowRight size={15} />
        </button>
      )}

      {(hasFullSupport || fullSupportOnly) && (
        <div className="mc-sched-program-filter">
          <label htmlFor="mentor-schedule-program">Sessions</label>
          <select
            id="mentor-schedule-program"
            aria-label="Filter sessions by program"
            value={fullSupportOnly ? 'full-support' : 'all'}
            onChange={event => setProgramFilter(event.target.value as 'all' | 'full-support')}
          >
            <option value="all">All sessions</option>
            <option value="full-support">Full Support</option>
          </select>
        </div>
      )}

      <div className="mc-sched-tabbar" role="tablist" aria-label="Session scope">
        {(
          [
            { key: 'upcoming', label: 'Upcoming', count: byScope.upcoming.length },
            { key: 'due', label: 'Report due', count: byScope.due.length },
            { key: 'past', label: 'Past', count: byScope.past.length },
            { key: 'cancelled', label: 'Cancelled / absent', count: byScope.cancelled.length },
          ] as { key: Scope; label: string; count: number }[]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={scope === t.key}
            className={`mc-sched-tab${scope === t.key ? ' mc-sched-tab--active' : ''}${
              t.key === 'due' && t.count > 0 ? ' mc-sched-tab--alert' : ''
            }`}
            onClick={() => setScope(t.key)}
          >
            {t.label}
            <span className="mc-sched-tab-count">{t.count}</span>
          </button>
        ))}
        {hasFullSupport && (
          <div className="mc-sched-tabbar-tools">
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => setLogOpen(true)}
              disabled={roster.length === 0}
            >
              Log Full Support session
            </Button>
          </div>
        )}
      </div>

      {isError && (
        <Alert type="error" showIcon style={{ marginBottom: 12 }} message="Failed to load sessions" />
      )}

      {isError && rows.length === 0 ? null : rows.length === 0 ? (
        <div className="mc-sched-empty">
          {scope === 'upcoming' ? (
            <Empty description="No upcoming sessions on the calendar." />
          ) : scope === 'due' ? (
            <div className="mc-sched-empty-good">
              <CheckCircle2 size={20} color="var(--mc-success)" />
              No lesson records or reports due.
            </div>
          ) : (
            <Empty description={scope === 'past' ? 'No past sessions yet.' : 'No cancelled or absent sessions.'} />
          )}
        </div>
      ) : (
        <div className="mc-sched-grid">{rows.map(renderSessionCard)}</div>
      )}

      <Modal
        title="Log a Full Support session"
        open={logOpen}
        onCancel={() => setLogOpen(false)}
        onOk={submitLog}
        confirmLoading={creating}
        okText="Save"
      >
        <Form form={logForm} layout="vertical" initialValues={{ duration: '1h', when: dayjs() }}>
          <Form.Item
            name="studentUserId"
            label="Student"
            rules={[{ required: true, message: 'Pick a student' }]}
          >
            <Select
              placeholder="Select a student"
              options={roster.map((r) => ({ value: r.id, label: r.name }))}
            />
          </Form.Item>
          <Form.Item
            name="when"
            label="Date & time"
            rules={[{ required: true, message: 'Pick a time' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="duration"
            label="Duration"
            rules={[{ required: true, message: 'Pick a duration' }]}
          >
            <Select
              options={[
                { value: '0.5h', label: '30 min' },
                { value: '0.75h', label: '45 min' },
                { value: '1h', label: '60 min' },
                { value: '1.5h', label: '90 min' },
              ]}
            />
          </Form.Item>
          <Form.Item name="meetingLink" label="Meeting link" rules={[{ pattern: /^https:\/\/\S+$/i, message: 'Use an HTTPS meeting link' }]}><Input placeholder="https://meet.google.com/…" /></Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="What did you cover?" />
          </Form.Item>
        </Form>
      </Modal>

      <LessonRecordModal open={!!recordBooking} title="Record Full Support lesson"
        value={recordValue} plannedMinutes={recordBooking?.durationMinutes ?? 60} allowCancelled
        saving={recordingFs} onClose={() => setRecordBooking(null)} onSave={saveLesson} />
      <SessionReportModal
        booking={reportBooking}
        open={!!reportBooking}
        onClose={() => setReportBooking(null)}
      />
    </div>
  );
}
