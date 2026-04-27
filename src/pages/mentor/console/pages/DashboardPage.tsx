import { useMemo } from 'react';
import { Alert, Button, Card, Col, Empty, Row, Space, Spin, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Flag,
  Users,
  ArrowRight,
} from 'lucide-react';
import type { SessionsSchema } from 'src/app/api/Api';
import {
  useGetMentorPipelineQuery,
  useGetMentorRosterQuery,
  useGetMentorTasksQuery,
  type SessionLogDto,
} from 'src/app/services/fullSupportApi';
import UpcomingCard from 'src/pages/home/_components/bookings/_components/upcamingcards';
import FullSupportBookingCard from '../components/FullSupportBookingCard';
import { useMentorConsole } from '../MentorConsoleContext';
import { formatRelative } from '../utils';
import { useMentorBookings, type MentorBooking } from '../sessionSources';

const { Paragraph } = Typography;

// Only flag recent sessions — stale 60-day-old entries just create noise.
const PENDING_REPORT_WINDOW_DAYS = 14;

export default function MentorConsoleDashboardPage() {
  const navigate = useNavigate();
  const { displayName, hasFullSupport } = useMentorConsole();

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

    const thisMonth = relevantBookings.filter(
      (b) => new Date(b.dateTime).getTime() >= monthMs,
    );
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
        .sort(
          (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
        )
        .slice(0, 3),
    [relevantBookings],
  );

  const pendingReport = useMemo(() => {
    if (!hasFullSupport) return null;
    const windowMs = PENDING_REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const recent = relevantBookings
      .filter(
        (b) =>
          b.status === 'report-due' && now - new Date(b.dateTime).getTime() <= windowMs,
      )
      .sort(
        (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
      );
    return recent[0] ?? null;
  }, [relevantBookings, now, hasFullSupport]);

  const loading = loadingRoster && loadingSessions && loadingTasks;

  if (loading && relevantBookings.length === 0 && roster.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  const renderUpcomingCard = (b: MentorBooking) => {
    if (b.source === 'platform') {
      const raw = b.raw as SessionsSchema;
      return (
        <UpcomingCard
          key={b.id}
          {...raw}
          duration={b.durationMinutes}
          cancelCheck
          reportCheck={false}
          detailCheck={false}
          rateCheck={false}
          dropdownVisible
        />
      );
    }
    return (
      <FullSupportBookingCard
        key={b.id}
        session={b.raw as SessionLogDto}
        studentName={b.studentName}
        status={b.status}
      />
    );
  };

  return (
    <div>
      <h1 className="mc-page-title">
        Welcome back, {displayName.split(' ')[0] || 'mentor'}
      </h1>
      <p className="mc-page-lead">
        {hasFullSupport
          ? 'Your dashboard shows active students, upcoming sessions, and anything that needs a report.'
          : 'Upcoming sessions and the shortcuts you use most.'}
      </p>

      {pendingReport && (
        <div className="mc-alert-banner">
          <Flag size={22} color="var(--mc-danger)" />
          <div className="mc-alert-banner-body">
            <div className="mc-alert-banner-title">Session report pending</div>
            <div className="mc-alert-banner-subtitle">
              Your session ended {formatRelative(pendingReport.dateTime)}. Mark it complete so it doesn&apos;t
              get flagged.
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

      <Row gutter={[16, 16]} className="mc-kpi-row">
        {hasFullSupport ? (
          <>
            <Col xs={24} sm={12} xl={6}>
              <Card bordered={false} className="mc-kpi-card">
                <div className="mc-kpi-label">Active students</div>
                <div className="mc-kpi-value">{kpis.activeStudents}</div>
                <div className="mc-kpi-meta">Full Support students</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card bordered={false} className="mc-kpi-card mc-kpi-card--info">
                <div className="mc-kpi-label">Sessions this month</div>
                <div className="mc-kpi-value">{kpis.sessionsThisMonth}</div>
                <div className="mc-kpi-meta">{kpis.completedThisMonth} completed</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card bordered={false} className="mc-kpi-card mc-kpi-card--warning">
                <div className="mc-kpi-label">Reports due</div>
                <div className="mc-kpi-value">{kpis.reportDue}</div>
                <div className="mc-kpi-meta">Past sessions to close out</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card bordered={false} className="mc-kpi-card mc-kpi-card--success">
                <div className="mc-kpi-label">Open tasks</div>
                <div className="mc-kpi-value">{kpis.openTasks}</div>
                <div className="mc-kpi-meta">Assigned, awaiting feedback</div>
              </Card>
            </Col>
          </>
        ) : (
          <>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="mc-kpi-card mc-kpi-card--info">
                <div className="mc-kpi-label">Upcoming bookings</div>
                <div className="mc-kpi-value">{kpis.upcoming}</div>
                <div className="mc-kpi-meta">Students who booked you</div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="mc-kpi-card mc-kpi-card--success">
                <div className="mc-kpi-label">This month</div>
                <div className="mc-kpi-value">{kpis.sessionsThisMonth}</div>
                <div className="mc-kpi-meta">{kpis.completedThisMonth} completed</div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="mc-kpi-card">
                <div className="mc-kpi-label">Completed total</div>
                <div className="mc-kpi-value">{kpis.sessionsThisMonth - kpis.upcoming}</div>
                <div className="mc-kpi-meta">In view</div>
              </Card>
            </Col>
          </>
        )}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={hasFullSupport ? 14 : 24}>
          <Card
            bordered={false}
            className="mc-panel"
            title={
              <Space>
                <CalendarClock size={18} color="var(--mc-accent)" />
                <span>Next up</span>
              </Space>
            }
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => navigate('/mentor/sessions')}
                style={{ color: 'var(--mc-accent)' }}
              >
                All sessions <ArrowRight size={14} />
              </Button>
            }
          >
            {upcomingBookings.length === 0 ? (
              <Empty description="No upcoming sessions" />
            ) : (
              <Row gutter={[14, 14]} className="mc-booking-grid">
                {upcomingBookings.map((b) => (
                  <Col key={b.id} xs={24} md={hasFullSupport ? 24 : 12} xl={hasFullSupport ? 12 : 8}>
                    {renderUpcomingCard(b)}
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>

        {hasFullSupport && (
          <Col xs={24} lg={10}>
            <Card
              bordered={false}
              className="mc-panel"
              title={
                <Space>
                  <Users size={18} color="var(--mc-accent)" />
                  <span>Your students</span>
                </Space>
              }
              extra={
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate('/mentor/students')}
                  style={{ color: 'var(--mc-accent)' }}
                >
                  All students <ArrowRight size={14} />
                </Button>
              }
            >
              {roster.length === 0 ? (
                <Alert
                  type="info"
                  showIcon
                  message="No Full Support students assigned"
                />
              ) : (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {roster.slice(0, 6).map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'var(--mc-bg-subtle)',
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div
                          className="mc-avatar"
                          style={{ background: 'var(--mc-accent)' }}
                        >
                          {r.initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--mc-text)' }}>{r.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--mc-text-muted)' }}>
                            {r.used}h used · {r.sessionsCount} sessions
                          </div>
                        </div>
                      </div>
                      <Button
                        size="small"
                        type="text"
                        onClick={() =>
                          navigate(`/mentor/students?student=${encodeURIComponent(r.id)}`)
                        }
                        style={{ color: 'var(--mc-accent)' }}
                      >
                        Open
                      </Button>
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          </Col>
        )}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            bordered={false}
            className="mc-panel"
            title={
              <Space>
                <ClipboardList size={18} color="var(--mc-accent)" />
                <span>Quick actions</span>
              </Space>
            }
          >
            <Space wrap size={10}>
              <Button type="primary" onClick={() => navigate('/mentor/availability')}>
                Update availability
              </Button>
              <Button onClick={() => navigate('/mentor/sessions')}>View sessions</Button>
              {hasFullSupport && (
                <>
                  <Button onClick={() => navigate('/mentor/tasks')}>Assign a task</Button>
                  <Button onClick={() => navigate('/mentor/milestones')}>Add a milestone</Button>
                </>
              )}
              <Button onClick={() => navigate('/mentor/profile')}>Edit mentor profile</Button>
            </Space>
            {hasFullSupport && (
              <Paragraph type="secondary" style={{ marginTop: 14, marginBottom: 0, fontSize: 12 }}>
                <CheckCircle2 size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
                {kpis.openApps} open application{kpis.openApps === 1 ? '' : 's'} across your students.
              </Paragraph>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
