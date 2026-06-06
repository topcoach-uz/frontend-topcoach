import { useMemo, type ReactNode } from 'react';
import { Button, Col, Row, Space, Spin, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Flag,
  Star,
  Users,
  ArrowRight,
} from 'lucide-react';
import {
  useGetMentorPipelineQuery,
  useGetMentorRosterQuery,
  useGetMentorTasksQuery,
} from 'src/app/services/fullSupportApi';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetMentorAvailabilityQuery } from 'src/app/services/availability';
import { useGetCurrentSubscriptionQuery } from 'src/app/services/subscription';
import { useGetUserPreferencesQuery } from 'src/app/services/student-hub/dashboardApi';
import MentorNextSessionCard from '../components/MentorNextSessionCard';
import { McStat } from '../components/McStat';
import { useMentorConsole } from '../MentorConsoleContext';
import { formatRelative } from '../utils';
import { useMentorBookings } from '../sessionSources';
import AdmissionsProgramProgressCard from 'src/pages/student-hub/components/AdmissionsProgramProgressCard';
import './DashboardPage.scss';

const { Paragraph } = Typography;

// Only flag recent sessions — stale 60-day-old entries just create noise.
const PENDING_REPORT_WINDOW_DAYS = 14;

function Panel({
  icon,
  title,
  link,
  children,
}: {
  icon: ReactNode;
  title: string;
  link?: { label: string; onClick: () => void };
  children: ReactNode;
}) {
  return (
    <section className="mc-panel2">
      <div className="mc-sec-head">
        <div className="mc-sec-title">
          <span className="mc-sec-ico">{icon}</span>
          {title}
        </div>
        {link && (
          <button type="button" className="mc-sec-link" onClick={link.onClick}>
            {link.label} <ArrowRight size={14} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export default function MentorConsoleDashboardPage() {
  const navigate = useNavigate();
  const { id: mentorId, displayName, hasFullSupport } = useMentorConsole();

  // Profile + availability power the non-FS dashboard blocks (visibility,
  // rating, and the "set your hours" nudge). getMe is cached app-wide.
  const { data: me } = useGetMeQuery();
  const { data: availabilityRes } = useGetMentorAvailabilityQuery(mentorId, {
    skip: hasFullSupport || !mentorId,
  });
  const hasAvailability = (availabilityRes?.slots?.length ?? 0) > 0;
  const availabilityDays = availabilityRes?.slots?.length ?? 0;
  const rating = Number(me?.profile?.overallRating ?? 0);

  // "Your Learning Progress" (mentor-as-learner) only belongs to mentors who
  // genuinely have Community access — same rule as JourneyExperienceContext.
  // This deliberately ignores the SuperAdmin/Owner research-prep bypass, so a
  // staff account that revoked its Community access no longer sees the card.
  const { data: subscription } = useGetCurrentSubscriptionQuery();
  const { data: rawPrefs } = useGetUserPreferencesQuery();
  const prefs = ((rawPrefs as any)?.data ?? rawPrefs ?? null) as any;
  const mentorHasCommunity =
    prefs?.applicationSettings?.communityExperienceMode === 'community' ||
    subscription?.status === 'active' ||
    subscription?.status === 'trialing';

  const { data: rosterRes, isLoading: loadingRoster } = useGetMentorRosterQuery(undefined, {
    skip: !hasFullSupport,
  });
  const { data: tasksRes, isLoading: loadingTasks } = useGetMentorTasksQuery(undefined, {
    skip: !hasFullSupport,
  });
  const { data: pipelineRes } = useGetMentorPipelineQuery(undefined, {
    skip: !hasFullSupport,
  });
  const { bookings, isLoading: loadingSessions } = useMentorBookings(null, {
    includeFullSupport: hasFullSupport,
  });

  const roster = rosterRes?.data ?? [];
  const tasks = tasksRes?.data ?? [];
  const pipeline = pipelineRes?.data ?? [];

  const now = Date.now();

  // When not a FS mentor, ignore full-support entries entirely.
  const relevantBookings = useMemo(
    () => (hasFullSupport ? bookings : bookings.filter((b) => b.source === 'platform')),
    [bookings, hasFullSupport],
  );

  const kpis = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthMs = monthStart.getTime();

    const thisMonth = relevantBookings.filter((b) => new Date(b.dateTime).getTime() >= monthMs);
    const completedThisMonth = thisMonth.filter((b) => b.status === 'completed').length;
    const reportDue = relevantBookings.filter((b) => b.status === 'report-due').length;
    const upcoming = relevantBookings.filter((b) => b.status === 'upcoming').length;
    const openTasks = tasks.filter((t) => !t.hasFeedback).length;

    return {
      activeStudents: roster.length,
      upcoming,
      sessionsThisMonth: thisMonth.length,
      completedThisMonth,
      reportDue,
      openTasks,
      openApps: pipeline.filter((p) => (p.status || '').toLowerCase() !== 'accepted').length,
    };
  }, [relevantBookings, roster.length, tasks, pipeline]);

  const upcomingBookings = useMemo(
    () =>
      relevantBookings
        .filter((b) => b.status === 'upcoming')
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
        .slice(0, 3),
    [relevantBookings],
  );

  const pendingReport = useMemo(() => {
    const windowMs = PENDING_REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const recent = relevantBookings
      .filter((b) => b.status === 'report-due' && now - new Date(b.dateTime).getTime() <= windowMs)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    return recent[0] ?? null;
  }, [relevantBookings, now]);

  const loading = loadingRoster && loadingSessions && loadingTasks;

  if (loading && relevantBookings.length === 0 && roster.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  const today = new Date();
  const quickActions = [
    { label: 'Update availability', to: '/mentor/availability' },
    { label: 'View sessions', to: '/mentor/sessions' },
    ...(hasFullSupport
      ? [
          { label: 'Review work', to: '/mentor/to-review' },
          { label: 'Open a student', to: '/mentor/students' },
        ]
      : []),
    { label: 'Edit mentor profile', to: '/mentor/profile' },
  ];

  return (
    <div className="mc-dash">
      <header className="mc-dash-hero">
        <div>
          <div className="mc-page-eyebrow">
            Mentor <span className="mc-page-eyebrow-accent">· Overview</span>
          </div>
          <h1 className="mc-page-title" style={{ marginBottom: 8 }}>
            Welcome back, {displayName.split(' ')[0] || 'mentor'}
          </h1>
          <p className="mc-page-lead" style={{ marginBottom: 0 }}>
            {hasFullSupport
              ? 'Your active students, upcoming sessions, and anything that needs a report.'
              : 'Your upcoming sessions, availability, and how students see you.'}
          </p>
        </div>
        <div className="mc-dash-date" aria-hidden>
          <span className="mc-dash-date-day">{today.getDate()}</span>
          <span className="mc-dash-date-rest">
            {today.toLocaleDateString(undefined, { weekday: 'long' })}
            <br />
            {today.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </header>

      {pendingReport && (
        <div className="mc-alert-banner">
          <Flag size={22} color="var(--mc-danger)" />
          <div className="mc-alert-banner-body">
            <div className="mc-alert-banner-title">Session report pending</div>
            <div className="mc-alert-banner-subtitle">
              Your session ended {formatRelative(pendingReport.dateTime)}. Mark it complete so it
              doesn&apos;t get flagged.
            </div>
          </div>
          <Button
            type="primary"
            onClick={() => navigate('/mentor/sessions?scope=past')}
            style={{ background: 'var(--mc-danger)', borderColor: 'var(--mc-danger)' }}
          >
            Write report
          </Button>
        </div>
      )}

      {hasFullSupport ? (
        <div className="mc-stat-grid">
          <McStat
            icon={<Users size={18} />}
            label="Active students"
            value={kpis.activeStudents}
            meta="On Full Support"
            tone="info"
            onClick={() => navigate('/mentor/students')}
          />
          <McStat
            icon={<CalendarClock size={18} />}
            label="Sessions this month"
            value={kpis.sessionsThisMonth}
            meta={`${kpis.completedThisMonth} completed`}
            tone="neutral"
            onClick={() => navigate('/mentor/sessions')}
          />
          <McStat
            icon={<Flag size={18} />}
            label="Reports due"
            value={kpis.reportDue}
            meta={kpis.reportDue > 0 ? 'Past sessions to close out' : 'All caught up'}
            tone={kpis.reportDue > 0 ? 'alert' : 'good'}
            onClick={() => navigate('/mentor/sessions?scope=past')}
          />
          <McStat
            icon={<CheckSquare size={18} />}
            label="Open tasks"
            value={kpis.openTasks}
            meta={kpis.openTasks > 0 ? 'Awaiting your feedback' : 'All caught up'}
            tone={kpis.openTasks > 0 ? 'warn' : 'good'}
            onClick={() => navigate('/mentor/to-review')}
          />
        </div>
      ) : (
        // Non-FS mentor: a single full-width row of four equal tiles —
        // Upcoming · Reports · Availability · Profile — so nothing floats in
        // dead space. Availability + Profile are status tiles (same chrome,
        // text headline + always-visible action) rather than separate cards.
        <div className="mc-stat-grid">
          <McStat
            icon={<CalendarClock size={18} />}
            label="Upcoming sessions"
            value={kpis.upcoming}
            meta="Booked by students"
            tone="info"
            onClick={() => navigate('/mentor/sessions')}
          />
          <McStat
            icon={<Flag size={18} />}
            label="Reports due"
            value={kpis.reportDue}
            meta={kpis.reportDue > 0 ? 'Past sessions to close out' : 'All caught up'}
            tone={kpis.reportDue > 0 ? 'alert' : 'good'}
            onClick={() => navigate('/mentor/sessions?scope=past')}
          />

          <div
            className={`mc-stat mc-stat--clickable${hasAvailability ? '' : ' mc-stat--alert'}`}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/mentor/availability')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/mentor/availability');
              }
            }}
          >
            <div className="mc-stat-top">
              <div className="mc-stat-label">Availability</div>
              <span className="mc-stat-ico">
                <CalendarPlus size={15} />
              </span>
            </div>
            <div className="mc-stat-headline">{hasAvailability ? 'Bookable' : 'Not set'}</div>
            <div className="mc-stat-meta">
              {hasAvailability
                ? `${availabilityDays} day${availabilityDays === 1 ? '' : 's'} a week`
                : 'Students can’t book you yet'}
            </div>
            <span className="mc-stat-link">
              {hasAvailability ? 'Edit hours' : 'Set availability'} <ArrowRight size={12} />
            </span>
          </div>

          <div
            className="mc-stat mc-stat--clickable"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/mentor/profile')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/mentor/profile');
              }
            }}
          >
            <div className="mc-stat-top">
              <div className="mc-stat-label">Your profile</div>
              <span className="mc-stat-ico">
                <Star size={15} />
              </span>
            </div>
            <div className="mc-stat-headline">
              {rating > 0 ? `★ ${rating.toFixed(1)}` : 'New'}
            </div>
            <div className="mc-stat-meta">
              {rating > 0 ? 'Avg student rating' : 'No ratings yet'}
            </div>
            <span className="mc-stat-link">
              Edit profile <ArrowRight size={12} />
            </span>
          </div>
        </div>
      )}

      <div className={`mc-dash-main ${hasFullSupport ? '' : 'mc-dash-main--even'}`}>
        <div className="mc-dash-col">
          <Panel
            icon={<CalendarClock size={17} />}
            title="Next up"
            link={{ label: 'All sessions', onClick: () => navigate('/mentor/sessions') }}
          >
            {upcomingBookings.length === 0 ? (
              <div className="mc-dash-empty">No upcoming sessions on the calendar.</div>
            ) : (
              <Row gutter={[14, 14]} className="mc-booking-grid">
                {upcomingBookings.map((b) => (
                  <Col key={b.id} xs={24} xl={12}>
                    <MentorNextSessionCard booking={b} />
                  </Col>
                ))}
              </Row>
            )}
          </Panel>

          {mentorHasCommunity && (
            <AdmissionsProgramProgressCard forContext="mentor" wrapWithMentorPanel />
          )}
        </div>

        <div className="mc-dash-rail">
          {hasFullSupport && (
            <Panel
              icon={<Users size={17} />}
              title="Your students"
              link={{ label: 'All', onClick: () => navigate('/mentor/students') }}
            >
              {roster.length === 0 ? (
                <div className="mc-dash-empty">No Full Support students assigned yet.</div>
              ) : (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {roster.slice(0, 5).map((r) => (
                    <div
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      className="mc-action-row"
                      style={{ gap: 10 }}
                      onClick={() => navigate(`/mentor/students/${r.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/mentor/students/${r.id}`);
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div className="mc-avatar" style={{ background: 'var(--mc-accent)' }}>
                          {r.initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--mc-text)' }}>{r.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--mc-text-muted)' }}>
                            {r.used}h used · {r.sessionsCount} sessions
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={15} />
                    </div>
                  ))}
                </Space>
              )}
            </Panel>
          )}

          <Panel icon={<ClipboardList size={17} />} title="Quick actions">
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {quickActions.map((a) => (
                <button
                  key={a.to}
                  type="button"
                  className="mc-action-row"
                  onClick={() => navigate(a.to)}
                >
                  <span>{a.label}</span>
                  <ArrowRight size={15} />
                </button>
              ))}
            </Space>
            {hasFullSupport && (
              <Paragraph type="secondary" style={{ marginTop: 14, marginBottom: 0, fontSize: 12 }}>
                <CheckCircle2 size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
                {kpis.openApps} open application{kpis.openApps === 1 ? '' : 's'} across your students.
              </Paragraph>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
