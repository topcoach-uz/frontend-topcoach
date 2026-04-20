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
  Table,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { Plus } from 'lucide-react';
import {
  useCreateMentorTaskMutation,
  useDeleteMentorTaskMutation,
  useGetMentorRosterQuery,
  useGetMentorTasksQuery,
  useUpdateMentorTaskFeedbackMutation,
  type TaskDto,
} from 'src/app/services/fullSupportApi';
import { McPill } from '../components/McPill';
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

export default function MentorConsoleTasksPage() {
  const [scope, setScope] = useState<Scope>('all');
  const [studentFilter, setStudentFilter] = useState<string | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm] = Form.useForm<{
    studentUserId: string;
    task: string;
    deadline: Dayjs;
    description?: string;
  }>();

  const [feedbackTask, setFeedbackTask] = useState<TaskDto | null>(null);
  const [feedbackForm] = Form.useForm<{ feedback: string }>();

  const { data: rosterRes } = useGetMentorRosterQuery();
  const roster = rosterRes?.data ?? [];

  const { data, isLoading, isError } = useGetMentorTasksQuery();
  const tasks = data?.data ?? [];

  const [createTask, { isLoading: creating }] = useCreateMentorTaskMutation();
  const [updateFeedback, { isLoading: submittingFeedback }] =
    useUpdateMentorTaskFeedbackMutation();
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
    {
      title: 'Student',
      dataIndex: 'studentUserId',
      key: 'student',
      width: 180,
      render: (id: string) => nameFor(id),
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 130,
      render: (v: string) => formatDate(v),
    },
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
    <div>
      <h1 className="mc-page-title">Tasks</h1>
      <p className="mc-page-lead">
        Assign tasks to your students, review submissions, and give feedback.
      </p>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="mc-kpi-card mc-kpi-card--info">
            <div className="mc-kpi-label">Assigned</div>
            <div className="mc-kpi-value">{counts.open}</div>
            <div className="mc-kpi-meta">Not yet submitted</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="mc-kpi-card mc-kpi-card--warning">
            <div className="mc-kpi-label">Awaiting review</div>
            <div className="mc-kpi-value">{counts.review}</div>
            <div className="mc-kpi-meta">Student submitted — your turn</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="mc-kpi-card mc-kpi-card--success">
            <div className="mc-kpi-label">Feedback given</div>
            <div className="mc-kpi-value">{counts.done}</div>
            <div className="mc-kpi-meta">Closed out</div>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="mc-panel">
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 12 }}>
          <Col flex="auto">
            <Space wrap>
              <Segmented
                value={scope}
                onChange={(v) => setScope(v as Scope)}
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Assigned', value: 'open' },
                  { label: 'Awaiting review', value: 'awaiting-review' },
                  { label: 'Done', value: 'done' },
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
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 12 }}
            message="Failed to load tasks"
          />
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <Alert type="info" showIcon message="No tasks match the current filters" />
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
                      <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
                        {row.submissionText}
                      </div>
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
            name="task"
            label="Task"
            rules={[{ required: true, message: 'Describe the task' }]}
          >
            <Input placeholder="e.g. Draft Common App activities" />
          </Form.Item>
          <Form.Item
            name="deadline"
            label="Deadline"
            rules={[{ required: true, message: 'Pick a deadline' }]}
          >
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
              <Form.Item
                name="feedback"
                label="Feedback"
                rules={[{ required: true, message: 'Write your feedback' }]}
              >
                <Input.TextArea rows={5} placeholder="What went well, what to improve..." />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
}
