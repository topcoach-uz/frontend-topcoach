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
} from 'src/app/services/fullSupportApi';
import { useGetMentorAvailabilityQuery } from 'src/app/services/availability';
import { McPill } from '../components/McPill';
import SessionChatButton from '../components/SessionChatButton';
import { useSessionActions } from '../components/sessions/useSessionActions';
import { useMentorConsole } from '../MentorConsoleContext';
import { useMentorBookings, type MentorBooking } from '../sessionSources';
import { useMentorCourseClasses } from '../courseClassSources';
import { bookingDisplay, scheduleScopes } from '../sessionDisplay';
import { formatRelative } from '../utils';
import './SchedulePage.scss';

// Only flag recent sessions — stale 60-day-old entries just create noise.
const PENDING_REPORT_WINDOW_DAYS = 14;

type Scope = 'upcoming' | 'due' | 'past' | 'cancelled';

const SCOPES: Scope[] = ['upcoming', 'due', 'past', 'cancelled'];

type ProgramFilter = 'all' | 'full-support' | 'platform' | 'course-class';

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
  const programParam = searchParams.get('program');
  const programFilter: ProgramFilter =
    programParam === 'full-support' || programParam === 'platform' || programParam === 'course-class' ? programParam : 'all';
  const fullSupportPage = programFilter === 'full-support';
  const setProgramFilter = (next: ProgramFilter) =>
    setSearchParams((params) => {
      if (next === 'all') params.delete('program');
      else params.set('program', next);
      return params;
    });
  // Honor `?scope=past` / `?scope=due` deep-links (old dashboard KPIs, emails).
  const initialScope = SCOPES.includes(searchParams.get('scope') as Scope)
    ? (searchParams.get('scope') as Scope)
    : fullSupportPage ? 'due' : 'upcoming';
  const scope = initialScope;
  const setScope = (next: Scope) => setSearchParams(params => { params.set('scope', next); return params; });
  const [logOpen, setLogOpen] = useState(false);
  const [logForm] = Form.useForm<{
    studentUserId: string;
    when: Dayjs;
    duration: string;
    description: string;
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
  const courseClasses = useMentorCourseClasses(isMentor);
  const sessionActions = useSessionActions({ onClassesChanged: courseClasses.refetch });
  const [createSession, { isLoading: creating }] = useCreateMentorSessionMutation();
  const allSessions = useMemo<MentorBooking[]>(
    () => [
      ...(hasFullSupport ? bookings : bookings.filter((b) => b.source === 'platform')),
      ...courseClasses.classes,
    ],
    [bookings, courseClasses.classes, hasFullSupport],
  );
  // Only offer sources the mentor actually has sessions from (plus the one in
  // the URL, so a deep link never lands on a hidden option). The filter row
  // only makes sense when there are at least two.
  const programOptions = useMemo(() => {
    const present = new Set<ProgramFilter>(allSessions.map((b) => b.source));
    if (programFilter !== 'all') present.add(programFilter);
    const labels: [ProgramFilter, string][] = [
      ['full-support', 'Full Support'],
      ['platform', 'Platform'],
      ['course-class', 'Classes'],
    ];
    return labels.filter(([key]) => present.has(key)).map(([key, label]) => ({ key, label }));
  }, [allSessions, programFilter]);
  const showProgramFilter = programOptions.length > 1;

  const decorated = useMemo<MentorBooking[]>(
    () =>
      allSessions.filter(b => programFilter === 'all' || b.source === programFilter).map((b) => ({
        ...b,
        studentName:
          b.studentName || (b.studentUserId && rosterById.get(b.studentUserId)?.name) || null,
      })),
    [allSessions, rosterById, programFilter],
  );

  const byScope = useMemo(() => scheduleScopes(decorated), [decorated]);

  const pendingReport = useMemo(() => {
    const windowMs = PENDING_REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return (
      byScope.due.find((b) => now - new Date(b.dateTime).getTime() <= windowMs) ?? null
    );
  }, [byScope.due]);

  const submitLog = async () => {
    const values = await logForm.validateFields();
    await createSession({
      studentUserId: values.studentUserId,
      dateTime: values.when.toISOString(),
      duration: values.duration,
      description: values.description || '',
    })
      .unwrap()
      .then(() => {
        message.success('Session logged');
        setLogOpen(false);
        logForm.resetFields();
      })
      .catch(() => message.error('Failed to log'));
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

        <div className="mc-scard-name">{b.courseClass ? b.courseClass.lessonTitle : b.studentName || 'Student'}</div>
        <div className="mc-scard-when">
          {d.toLocaleDateString(undefined, { weekday: 'short' })} · {timeRange(b)} · {b.durationLabel}
        </div>
        <div className="mc-scard-meta">
          {b.source === 'course-class'
            ? `Course class · ${b.courseClass?.courseName} · ${b.courseClass?.moduleTitle}`
            : b.source === 'full-support' ? 'Full Support' : 'Platform booking'}
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
          {sessionActions.renderActions(b)}
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
            <div className="mc-alert-banner-title">{pendingReport.source === 'course-class' ? 'Class attendance pending' : pendingReport.source === 'full-support' ? 'Lesson record pending' : 'Session report pending'}</div>
            <div className="mc-alert-banner-subtitle">
              Your {pendingReport.source === 'course-class' ? 'class' : 'session'}{pendingReport.studentName ? ` with ${pendingReport.studentName}` : ''}{' '}
              ended {formatRelative(pendingReport.dateTime)}. {pendingReport.source === 'course-class' ? 'Mark the class held and record attendance.' : pendingReport.source === 'full-support' ? 'Record the lesson outcome and attendance.' : 'Submit your session report.'}
            </div>
          </div>
          <Button
            type="primary"
            onClick={() => sessionActions.openFinish(pendingReport)}
            style={{ background: 'var(--mc-danger)', borderColor: 'var(--mc-danger)' }}
          >
            {pendingReport.source === 'course-class' ? 'Record attendance' : pendingReport.source === 'full-support' ? 'Record lesson' : 'Write report'}
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
          <Button
            icon={<CalendarPlus size={16} />}
            onClick={() => navigate('/mentor/availability')}
            style={{ marginTop: 16 }}
          >
            Manage availability
          </Button>
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

      {showProgramFilter && (
        <div className="mc-sched-tabbar" role="group" aria-label="Session program">
          {[{ key: 'all' as ProgramFilter, label: 'All sessions' }, ...programOptions].map((o) => (
            <button
              key={o.key}
              type="button"
              aria-pressed={programFilter === o.key}
              className={`mc-sched-tab${programFilter === o.key ? ' mc-sched-tab--active' : ''}`}
              onClick={() => setProgramFilter(o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className="mc-sched-tabbar" role="tablist" aria-label="Session scope">
        {(
          [
            { key: 'upcoming', label: 'Upcoming', count: byScope.upcoming.length },
            { key: 'due', label: 'Report due', count: byScope.due.length },
            { key: 'past', label: 'Past', count: byScope.past.length },
            { key: 'cancelled', label: 'Cancelled', count: byScope.cancelled.length },
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

      {courseClasses.isError && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="Could not load your course classes"
          action={<Button size="small" onClick={courseClasses.refetch}>Retry</Button>}
        />
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
            <Empty description={scope === 'past' ? 'No past sessions yet.' : 'No cancelled sessions.'} />
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
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="What did you cover?" />
          </Form.Item>
        </Form>
      </Modal>

      {sessionActions.modals}
    </div>
  );
}
