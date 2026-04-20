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
import { Plus } from 'lucide-react';
import type { SessionsSchema } from 'src/app/api/Api';
import {
  useCreateMentorSessionMutation,
  useGetMentorRosterQuery,
  type SessionLogDto,
} from 'src/app/services/fullSupportApi';
import UpcomingCard from 'src/pages/home/_components/bookings/_components/upcamingcards';
import FullSupportBookingCard from '../components/FullSupportBookingCard';
import { useMentorBookings, type MentorBooking } from '../sessionSources';
import { useMentorConsole } from '../MentorConsoleContext';

type Scope = 'upcoming' | 'past' | 'cancelled' | 'all';
type SourceFilter = 'all' | 'platform' | 'full-support';

export default function MentorConsoleSessionsPage() {
  const { hasFullSupport } = useMentorConsole();
  const [scope, setScope] = useState<Scope>('upcoming');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [studentFilter, setStudentFilter] = useState<string | null>(null);

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

  const renderBookingCard = (b: MentorBooking) => {
    if (b.source === 'platform') {
      const raw = b.raw as SessionsSchema;
      return (
        <UpcomingCard
          key={b.id}
          {...raw}
          duration={b.durationMinutes}
          cancelCheck={b.status === 'upcoming'}
          reportCheck={false}
          detailCheck={false}
          rateCheck={false}
          dropdownVisible={b.status === 'upcoming'}
        />
      );
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
      <h1 className="mc-page-title">Sessions</h1>
      <p className="mc-page-lead">
        {hasFullSupport
          ? 'All your sessions — platform bookings and Full Support entries, unified.'
          : 'Upcoming and past sessions booked through your availability.'}
      </p>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} className="mc-kpi-card mc-kpi-card--info">
            <div className="mc-kpi-label">Upcoming</div>
            <div className="mc-kpi-value">{counts.upcoming}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} className="mc-kpi-card mc-kpi-card--success">
            <div className="mc-kpi-label">Past</div>
            <div className="mc-kpi-value">{counts.past}</div>
          </Card>
        </Col>
        {hasFullSupport && (
          <Col xs={12} sm={6}>
            <Card bordered={false} className="mc-kpi-card mc-kpi-card--warning">
              <div className="mc-kpi-label">Report due</div>
              <div className="mc-kpi-value">{counts.reportDue}</div>
            </Card>
          </Col>
        )}
        <Col xs={12} sm={6}>
          <Card bordered={false} className="mc-kpi-card">
            <div className="mc-kpi-label">Cancelled</div>
            <div className="mc-kpi-value">{counts.cancelled}</div>
          </Card>
        </Col>
      </Row>

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
    </div>
  );
}
