import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  message,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarCheck, CalendarClock, CalendarX, FileText, Flag, Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { McStat } from '../components/McStat';
import { McPill } from '../components/McPill';
import SessionReportModal from '../components/SessionReportModal';
import MentorNextSessionCard from '../components/MentorNextSessionCard';
import {
  useCreateMentorSessionMutation,
  useGetMentorRosterQuery,
  type SessionLogDto,
} from 'src/app/services/fullSupportApi';
import FullSupportBookingCard from '../components/FullSupportBookingCard';
import { useMentorBookings, type MentorBooking } from '../sessionSources';
import { useMentorConsole } from '../MentorConsoleContext';
import { formatDateTime } from '../utils';

type Scope = 'upcoming' | 'past' | 'cancelled' | 'all';
type SourceFilter = 'all' | 'platform' | 'full-support';

const SCOPES: Scope[] = ['upcoming', 'past', 'cancelled', 'all'];

export default function MentorConsoleSessionsPage() {
  const { hasFullSupport } = useMentorConsole();
  const [searchParams] = useSearchParams();
  // Honor a `?scope=past` deep-link (e.g. from the dashboard "Reports due" KPI).
  const initialScope = SCOPES.includes(searchParams.get('scope') as Scope)
    ? (searchParams.get('scope') as Scope)
    : 'upcoming';
  const [scope, setScope] = useState<Scope>(initialScope);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [studentFilter, setStudentFilter] = useState<string | null>(null);
  const [reportBooking, setReportBooking] = useState<MentorBooking | null>(null);

  const [logOpen, setLogOpen] = useState(false);
  const [form] = Form.useForm<{
    studentUserId: string;
    when: Dayjs;
    duration: string;
    description: string;
  }>();

  const { data: rosterRes } = useGetMentorRosterQuery(undefined, { skip: !hasFullSupport });
  const roster = rosterRes?.data ?? [];

  const { bookings, isLoading, isError } = useMentorBookings(
    hasFullSupport ? studentFilter : null,
    { includeFullSupport: hasFullSupport },
  );

  const [createSession, { isLoading: creating }] = useCreateMentorSessionMutation();

  const rosterNameFor = (id: string | null | undefined) =>
    (id && roster.find((r) => r.id === id)?.name) || null;

  const decorated = useMemo<MentorBooking[]>(
    () =>
      bookings.map((b) => ({
        ...b,
        studentName: b.studentName || rosterNameFor(b.studentUserId) || null,
      })),
    [bookings, roster],
  );

  const effectiveSource = hasFullSupport ? sourceFilter : 'platform';

  const filtered = useMemo(() => {
    return decorated.filter((b) => {
      if (effectiveSource !== 'all' && b.source !== effectiveSource) return false;
      if (scope === 'upcoming' && b.status !== 'upcoming') return false;
      if (scope === 'past' && !(b.status === 'completed' || b.status === 'report-due'))
        return false;
      if (scope === 'cancelled' && b.status !== 'cancelled') return false;
      return true;
    });
  }, [decorated, scope, effectiveSource]);

  const counts = useMemo(() => {
    const relevant = hasFullSupport
      ? decorated
      : decorated.filter((b) => b.source === 'platform');
    return {
      upcoming: relevant.filter((b) => b.status === 'upcoming').length,
      past: relevant.filter((b) => b.status === 'completed' || b.status === 'report-due').length,
      cancelled: relevant.filter((b) => b.status === 'cancelled').length,
      reportDue: relevant.filter((b) => b.status === 'report-due').length,
    };
  }, [decorated, hasFullSupport]);

  const submitLog = async () => {
    const values = await form.validateFields();
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
        form.resetFields();
      })
      .catch(() => message.error('Failed to log'));
  };

  const renderReportCard = (b: MentorBooking) => {
    const due = b.status === 'report-due';
    return (
      <div key={b.id} className={`mc-report-card${due ? ' mc-report-card--due' : ''}`}>
        <div className="mc-report-card-top">
          <div style={{ minWidth: 0 }}>
            <div className="mc-report-card-when">{formatDateTime(b.dateTime)}</div>
            <div className="mc-report-card-meta">
              {b.studentName || 'Student'}
              {b.durationLabel ? ` · ${b.durationLabel}` : ''}
            </div>
          </div>
          <McPill variant={due ? 'danger' : 'success'}>{due ? 'Report due' : 'Reported'}</McPill>
        </div>
        <Button
          type={due ? 'primary' : 'default'}
          block
          icon={due ? <FileText size={15} /> : undefined}
          onClick={() => setReportBooking(b)}
          style={due ? undefined : { borderColor: 'var(--mc-border-strong)' }}
        >
          {due ? 'Write report' : 'View / edit report'}
        </Button>
      </div>
    );
  };

  const renderBookingCard = (b: MentorBooking) => {
    if (b.source === 'platform') {
      // Sessions that need a report (or already have one) use the report card.
      if (b.status === 'report-due' || (b.status === 'completed' && b.report)) {
        return renderReportCard(b);
      }
      // Everything else — upcoming, completed (legacy), cancelled — uses the
      // single editorial session card, which adapts its content per status.
      return <MentorNextSessionCard key={b.id} booking={b} />;
    }
    const fsRaw = b.raw as SessionLogDto;
    return (
      <FullSupportBookingCard
        key={b.id}
        session={fsRaw}
        studentName={b.studentName}
        status={b.status}
      />
    );
  };

  return (
    <div>
      <div className="mc-page-head mc-page-head--ruled">
        <div className="mc-page-eyebrow">
          Mentor <span className="mc-page-eyebrow-accent">· Mentorship</span>
        </div>
        <h1 className="mc-page-title">Sessions</h1>
        <p className="mc-page-lead">
          {hasFullSupport
            ? 'All your sessions — platform bookings and Full Support entries, unified.'
            : 'Upcoming and past sessions booked through your availability.'}
        </p>
      </div>

      <div className="mc-stat-grid">
        <McStat
          icon={<CalendarClock size={16} />}
          label="Upcoming"
          value={counts.upcoming}
          tone="info"
          cta="Show"
          onClick={() => setScope('upcoming')}
        />
        <McStat
          icon={<CalendarCheck size={16} />}
          label="Past"
          value={counts.past}
          tone="good"
          cta="Show"
          onClick={() => setScope('past')}
        />
        {hasFullSupport && (
          <McStat
            icon={<Flag size={16} />}
            label="Report due"
            value={counts.reportDue}
            tone={counts.reportDue > 0 ? 'alert' : 'good'}
            cta="Show"
            onClick={() => setScope('past')}
          />
        )}
        <McStat
          icon={<CalendarX size={16} />}
          label="Cancelled"
          value={counts.cancelled}
          tone="neutral"
          cta="Show"
          onClick={() => setScope('cancelled')}
        />
      </div>

      <Card bordered={false} className="mc-panel">
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Space wrap>
              <Segmented
                value={scope}
                onChange={(v) => setScope(v as Scope)}
                options={[
                  { label: 'Upcoming', value: 'upcoming' },
                  { label: 'Past', value: 'past' },
                  { label: 'Cancelled', value: 'cancelled' },
                  { label: 'All', value: 'all' },
                ]}
              />
              {hasFullSupport && (
                <>
                  <Select
                    value={sourceFilter}
                    onChange={(v) => setSourceFilter(v)}
                    style={{ minWidth: 160 }}
                    options={[
                      { label: 'All sources', value: 'all' },
                      { label: 'Platform bookings', value: 'platform' },
                      { label: 'Full Support', value: 'full-support' },
                    ]}
                  />
                  <Select
                    placeholder="All students"
                    allowClear
                    style={{ minWidth: 220 }}
                    value={studentFilter ?? undefined}
                    onChange={(v) => setStudentFilter(v ?? null)}
                    options={roster.map((r) => ({ value: r.id, label: r.name }))}
                  />
                </>
              )}
            </Space>
          </Col>
          {hasFullSupport && (
            <Col>
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => setLogOpen(true)}
                disabled={roster.length === 0}
              >
                Log Full Support session
              </Button>
            </Col>
          )}
        </Row>

        {isError && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 12 }}
            message="Failed to load sessions"
          />
        )}

        {isLoading && filtered.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <Empty
            description={
              scope === 'upcoming'
                ? 'No upcoming sessions'
                : scope === 'past'
                  ? 'No past sessions'
                  : scope === 'cancelled'
                    ? 'No cancelled sessions'
                    : 'No sessions match the current filters'
            }
          />
        ) : (
          <Row gutter={[16, 16]} className="mc-booking-grid">
            {filtered.map((b) => (
              <Col key={b.id} xs={24} md={12} xl={8}>
                {renderBookingCard(b)}
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title="Log a Full Support session"
        open={logOpen}
        onCancel={() => setLogOpen(false)}
        onOk={submitLog}
        confirmLoading={creating}
        okText="Save"
      >
        <Form form={form} layout="vertical" initialValues={{ duration: '60m', when: dayjs() }}>
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
                { value: '30m', label: '30 min' },
                { value: '45m', label: '45 min' },
                { value: '60m', label: '60 min' },
                { value: '90m', label: '90 min' },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="What did you cover?" />
          </Form.Item>
        </Form>
      </Modal>

      <SessionReportModal
        booking={reportBooking}
        open={!!reportBooking}
        onClose={() => setReportBooking(null)}
      />
    </div>
  );
}
