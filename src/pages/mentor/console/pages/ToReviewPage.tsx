import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import {
  AlertTriangle,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Clock,
  ClipboardList,
  Plus,
} from 'lucide-react';
import { McStat } from '../components/McStat';
import { useNavigate } from 'react-router-dom';
import {
  useCreateMentorTaskMutation,
  useDeleteMentorTaskMutation,
  useGetAllMentorMilestonesQuery,
  useGetMentorRosterQuery,
  useGetMentorTasksQuery,
  useUpdateMentorMilestoneMutation,
  useUpdateMentorTaskFeedbackMutation,
  type MentorMilestoneRow,
  type TaskDto,
} from 'src/app/services/fullSupportApi';
import { canUseResearchPrepLive } from 'src/lib/researchPrepAccess';
import ResearchGradingPage from '../../research-grading';
import { McPill } from '../components/McPill';
import { useMentorConsole } from '../MentorConsoleContext';
import { formatDate } from '../utils';

const { Text } = Typography;

type Scope = 'all' | 'open' | 'awaiting-review' | 'done';

function statusOf(t: TaskDto): Scope {
  if (t.hasFeedback) return 'done';
  if (t.submissionText || (t.submissionFileUrls && t.submissionFileUrls.length > 0)) {
    return 'awaiting-review';
  }
  return 'open';
}

function TasksQueue() {
  // Default to the "your turn" queue — this hub is about what needs reviewing.
  const [scope, setScope] = useState<Scope>('awaiting-review');
  const [studentFilter, setStudentFilter] = useState<string | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm] = Form.useForm<{ studentUserId: string; task: string; deadline: Dayjs; description?: string }>();
  const [feedbackTask, setFeedbackTask] = useState<TaskDto | null>(null);
  const [feedbackForm] = Form.useForm<{ feedback: string }>();

  const { data: rosterRes } = useGetMentorRosterQuery();
  const roster = rosterRes?.data ?? [];
  const { data, isLoading, isError } = useGetMentorTasksQuery();
  const tasks = data?.data ?? [];

  const [createTask, { isLoading: creating }] = useCreateMentorTaskMutation();
  const [updateFeedback, { isLoading: submittingFeedback }] = useUpdateMentorTaskFeedbackMutation();
  const [deleteTask] = useDeleteMentorTaskMutation();

  const filtered = useMemo(() => {
    let list = tasks;
    if (studentFilter) list = list.filter((t) => t.studentUserId === studentFilter);
    if (scope !== 'all') list = list.filter((t) => statusOf(t) === scope);
    return list;
  }, [tasks, studentFilter, scope]);

  const counts = useMemo(
    () => ({
      open: tasks.filter((t) => statusOf(t) === 'open').length,
      review: tasks.filter((t) => statusOf(t) === 'awaiting-review').length,
      done: tasks.filter((t) => statusOf(t) === 'done').length,
    }),
    [tasks],
  );

  const nameFor = (id: string) => roster.find((r) => r.id === id)?.name ?? '—';

  const columns: ColumnsType<TaskDto> = [
    { title: 'Task', dataIndex: 'task', key: 'task' },
    { title: 'Student', dataIndex: 'studentUserId', key: 'student', width: 180, render: (id: string) => nameFor(id) },
    { title: 'Deadline', dataIndex: 'deadline', key: 'deadline', width: 130, render: (v: string) => formatDate(v) },
    {
      title: 'Status',
      key: 'status',
      width: 160,
      render: (_, row) => {
        const s = statusOf(row);
        if (s === 'done') return <McPill variant="success">Feedback given</McPill>;
        if (s === 'awaiting-review') return <McPill variant="warning">Awaiting review</McPill>;
        return <McPill variant="info">Assigned</McPill>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 200,
      render: (_, row) => (
        <Space size={6}>
          <Button
            size="small"
            type="primary"
            ghost
            style={{ borderColor: 'var(--mc-accent)', color: 'var(--mc-accent)' }}
            onClick={() => {
              setFeedbackTask(row);
              feedbackForm.setFieldsValue({ feedback: row.feedback || '' });
            }}
          >
            {row.hasFeedback ? 'Edit feedback' : 'Give feedback'}
          </Button>
          <Popconfirm
            title="Delete this task?"
            onConfirm={() =>
              deleteTask(row.id)
                .unwrap()
                .then(() => message.success('Deleted'))
                .catch(() => message.error('Failed'))
            }
          >
            <Button size="small" danger type="text">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const submitAssign = async () => {
    const values = await assignForm.validateFields();
    await createTask({
      studentUserId: values.studentUserId,
      task: values.task,
      deadline: values.deadline.toISOString(),
      description: values.description,
    })
      .unwrap()
      .then(() => {
        message.success('Task assigned');
        setAssignOpen(false);
        assignForm.resetFields();
      })
      .catch(() => message.error('Failed to assign'));
  };

  const submitFeedback = async () => {
    if (!feedbackTask) return;
    const values = await feedbackForm.validateFields();
    await updateFeedback({
      id: feedbackTask.id,
      feedback: values.feedback,
      feedbackFileUrls: feedbackTask.feedbackFileUrls,
    })
      .unwrap()
      .then(() => {
        message.success('Feedback saved');
        setFeedbackTask(null);
      })
      .catch(() => message.error('Failed to save'));
  };

  return (
    <>
      <div className="mc-stat-grid">
        <McStat
          icon={<Clock size={16} />}
          label="Awaiting review"
          value={counts.review}
          meta="Student submitted — your turn"
          tone={counts.review > 0 ? 'warn' : 'good'}
          cta="Show"
          onClick={() => setScope('awaiting-review')}
        />
        <McStat
          icon={<ClipboardList size={16} />}
          label="Assigned"
          value={counts.open}
          meta="Not yet submitted"
          tone="info"
          cta="Show"
          onClick={() => setScope('open')}
        />
        <McStat
          icon={<CheckCircle2 size={16} />}
          label="Feedback given"
          value={counts.done}
          meta="Closed out"
          tone="good"
          cta="Show"
          onClick={() => setScope('done')}
        />
      </div>

      <Card bordered={false} className="mc-panel">
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 12 }}>
          <Col flex="auto">
            <Space wrap>
              <Segmented
                value={scope}
                onChange={(v) => setScope(v as Scope)}
                options={[
                  { label: 'Awaiting review', value: 'awaiting-review' },
                  { label: 'Assigned', value: 'open' },
                  { label: 'Done', value: 'done' },
                  { label: 'All', value: 'all' },
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
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setAssignOpen(true)}
              disabled={roster.length === 0}
            >
              Assign task
            </Button>
          </Col>
        </Row>

        {isError && (
          <Alert type="error" showIcon style={{ marginBottom: 12 }} message="Failed to load tasks" />
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <Alert type="info" showIcon message="Nothing here — you're all caught up." />
        ) : (
          <Table<TaskDto>
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 20 }}
            size="middle"
            expandable={{
              expandedRowRender: (row) => (
                <div style={{ padding: '4px 8px' }}>
                  {row.submissionText ? (
                    <>
                      <Text strong style={{ color: 'var(--mc-text)' }}>
                        Student submission
                      </Text>
                      <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{row.submissionText}</div>
                    </>
                  ) : (
                    <Text type="secondary">No submission yet.</Text>
                  )}
                  {row.feedback && (
                    <>
                      <div style={{ marginTop: 12 }} />
                      <Text strong style={{ color: 'var(--mc-accent)' }}>
                        Your feedback
                      </Text>
                      <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{row.feedback}</div>
                    </>
                  )}
                </div>
              ),
            }}
          />
        )}
      </Card>

      <Modal
        title="Assign a task"
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={submitAssign}
        confirmLoading={creating}
        okText="Assign"
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item name="studentUserId" label="Student" rules={[{ required: true, message: 'Pick a student' }]}>
            <Select placeholder="Select a student" options={roster.map((r) => ({ value: r.id, label: r.name }))} />
          </Form.Item>
          <Form.Item name="task" label="Task" rules={[{ required: true, message: 'Describe the task' }]}>
            <Input placeholder="e.g. Draft Common App activities" />
          </Form.Item>
          <Form.Item name="deadline" label="Deadline" rules={[{ required: true, message: 'Pick a deadline' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Instructions (optional)">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={feedbackTask?.hasFeedback ? 'Edit feedback' : 'Give feedback'}
        open={!!feedbackTask}
        onCancel={() => setFeedbackTask(null)}
        onOk={submitFeedback}
        confirmLoading={submittingFeedback}
        okText="Save feedback"
      >
        {feedbackTask && (
          <>
            <Text style={{ color: 'var(--mc-text-muted)', fontSize: 12 }}>Task</Text>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>{feedbackTask.task}</div>
            {feedbackTask.submissionText && (
              <>
                <Text style={{ color: 'var(--mc-text-muted)', fontSize: 12 }}>Submission</Text>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    marginBottom: 16,
                    padding: 10,
                    borderRadius: 8,
                    background: 'var(--mc-bg-subtle)',
                    fontSize: 13,
                  }}
                >
                  {feedbackTask.submissionText}
                </div>
              </>
            )}
            <Form form={feedbackForm} layout="vertical">
              <Form.Item name="feedback" label="Feedback" rules={[{ required: true, message: 'Write your feedback' }]}>
                <Input.TextArea rows={5} placeholder="What went well, what to improve..." />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </>
  );
}

type Bucket = 'all' | 'overdue' | 'week' | 'upcoming';

function deadlineBucket(dateStr: string | null): 'overdue' | 'week' | 'upcoming' | 'none' {
  if (!dateStr) return 'none';
  const d = dayjs(dateStr);
  const today = dayjs().startOf('day');
  if (d.isBefore(today, 'day')) return 'overdue';
  if (d.isBefore(today.add(8, 'day'), 'day')) return 'week'; // today … +7 days
  return 'upcoming';
}

function DeadlinesQueue() {
  const navigate = useNavigate();
  const [bucket, setBucket] = useState<Bucket>('all');
  const { data, isLoading, isError } = useGetAllMentorMilestonesQuery();
  const [updateMilestone] = useUpdateMentorMilestoneMutation();

  // Only pending milestones are "deadlines"; completed ones drop off the radar.
  const pending = useMemo(() => (data?.data ?? []).filter((r) => !r.done), [data]);

  const counts = useMemo(
    () => ({
      overdue: pending.filter((r) => deadlineBucket(r.date) === 'overdue').length,
      week: pending.filter((r) => deadlineBucket(r.date) === 'week').length,
      upcoming: pending.filter((r) => {
        const b = deadlineBucket(r.date);
        return b === 'upcoming' || b === 'none';
      }).length,
    }),
    [pending],
  );

  const filtered = useMemo(() => {
    if (bucket === 'all') return pending;
    return pending.filter((r) => {
      const b = deadlineBucket(r.date);
      if (bucket === 'upcoming') return b === 'upcoming' || b === 'none';
      return b === bucket;
    });
  }, [pending, bucket]);

  const bucketPill = (date: string | null) => {
    const b = deadlineBucket(date);
    if (b === 'overdue') return <McPill variant="danger">Overdue</McPill>;
    if (b === 'week') return <McPill variant="warning">This week</McPill>;
    if (b === 'none') return <McPill variant="neutral">No date</McPill>;
    return <McPill variant="info">Upcoming</McPill>;
  };

  const columns: ColumnsType<MentorMilestoneRow> = [
    {
      title: 'Student',
      dataIndex: 'studentName',
      key: 'student',
      width: 180,
      render: (name: string, row) => (
        <Button
          type="link"
          style={{ padding: 0, height: 'auto', color: 'var(--mc-accent)' }}
          onClick={() => navigate(`/mentor/students/${row.studentUserId}`)}
        >
          {name}
        </Button>
      ),
    },
    { title: 'Milestone', dataIndex: 'label', key: 'label' },
    { title: 'Due', dataIndex: 'date', key: 'date', width: 130, render: (v: string | null) => formatDate(v) },
    { title: '', key: 'bucket', width: 120, render: (_, row) => bucketPill(row.date) },
    {
      title: 'Done',
      key: 'done',
      width: 80,
      render: (_, row) => (
        <Switch
          size="small"
          checked={row.done}
          onChange={(v) =>
            updateMilestone({ id: row.id, done: v })
              .unwrap()
              .catch(() => message.error('Update failed'))
          }
        />
      ),
    },
  ];

  return (
    <>
      <div className="mc-stat-grid">
        <McStat
          icon={<AlertTriangle size={16} />}
          label="Overdue"
          value={counts.overdue}
          meta="Past their target date"
          tone={counts.overdue > 0 ? 'alert' : 'good'}
          cta="Show"
          onClick={() => setBucket('overdue')}
        />
        <McStat
          icon={<CalendarClock size={16} />}
          label="This week"
          value={counts.week}
          meta="Due in the next 7 days"
          tone={counts.week > 0 ? 'warn' : 'good'}
          cta="Show"
          onClick={() => setBucket('week')}
        />
        <McStat
          icon={<CalendarRange size={16} />}
          label="Upcoming"
          value={counts.upcoming}
          meta="Later or undated"
          tone="info"
          cta="Show"
          onClick={() => setBucket('upcoming')}
        />
      </div>

      <Card bordered={false} className="mc-panel">
        <Row style={{ marginBottom: 12 }}>
          <Col flex="auto">
            <Segmented
              value={bucket}
              onChange={(v) => setBucket(v as Bucket)}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Overdue', value: 'overdue' },
                { label: 'This week', value: 'week' },
                { label: 'Upcoming', value: 'upcoming' },
              ]}
            />
          </Col>
        </Row>

        {isError && (
          <Alert type="error" showIcon style={{ marginBottom: 12 }} message="Failed to load deadlines" />
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <Alert
            type="info"
            showIcon
            message={
              bucket === 'all'
                ? 'No open milestone deadlines across your students.'
                : 'Nothing in this window.'
            }
          />
        ) : (
          <Table<MentorMilestoneRow>
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 20 }}
            size="middle"
          />
        )}
      </Card>
    </>
  );
}

export default function MentorConsoleToReviewPage() {
  const { email, managementRole } = useMentorConsole();
  const researchLive = canUseResearchPrepLive(email, managementRole);

  const items = [
    { key: 'tasks', label: 'Tasks', children: <TasksQueue /> },
    { key: 'deadlines', label: 'Deadlines', children: <DeadlinesQueue /> },
    ...(researchLive
      ? [{ key: 'research', label: 'Research grading', children: <ResearchGradingPage embedded /> }]
      : []),
  ];

  return (
    <div>
      <div className="mc-page-head mc-page-head--ruled">
        <div className="mc-page-eyebrow">
          Mentor <span className="mc-page-eyebrow-accent">· Mentorship</span>
        </div>
        <h1 className="mc-page-title">To review</h1>
        <p className="mc-page-lead">
          Everything across your students that needs your attention — task submissions to review
          and research assignments to grade, in one queue.
        </p>
      </div>

      <Tabs defaultActiveKey="tasks" items={items} />
    </div>
  );
}
