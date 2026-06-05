import { useMemo, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
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
import type { Dayjs } from 'dayjs';
import {
  Calendar,
  CheckSquare,
  ClipboardList,
  FileText,
  FlaskConical,
  Flag,
  BookOpen,
  Plus,
} from 'lucide-react';
import {
  useCreateMentorMilestoneMutation,
  useCreateMentorPipelineRowMutation,
  useCreateMentorSessionMutation,
  useCreateMentorTaskMutation,
  useDeleteMentorMilestoneMutation,
  useDeleteMentorPipelineRowMutation,
  useDeleteMentorTaskMutation,
  useGetMentorCurriculumProgressQuery,
  useGetMentorMilestonesQuery,
  useGetMentorPipelineQuery,
  useGetMentorSessionsQuery,
  useGetMentorTasksQuery,
  useUpdateMentorMilestoneMutation,
  useUpdateMentorTaskFeedbackMutation,
  type CurriculumWatchlistItemDto,
  type MilestoneDto,
  type PipelineDto,
  type SessionLogDto,
  type TaskDto,
} from 'src/app/services/fullSupportApi';
import { useGetGraderInboxQuery, type ResearchSubmission } from 'src/app/services/research-prep';
import SubmissionDrawer from '../../research-grading/SubmissionDrawer';
import { useMentorBookings } from '../sessionSources';
import { useMentorConsole } from '../MentorConsoleContext';
import { McPill, type McPillVariant } from './McPill';
import { formatDate, formatDateTime } from '../utils';
import { canUseResearchPrepLive } from 'src/lib/researchPrepAccess';
import './StudentWorkspace.scss';

const { Text } = Typography;

export type WorkspaceStudent = {
  id: string;
  name: string;
  initials: string;
  used: number;
  allocated: number;
  sessionsCount: number;
};

const RG_MC: Record<ResearchSubmission['status'], McPillVariant> = {
  submitted: 'info',
  under_review: 'warning',
  graded: 'success',
  returned_for_revision: 'warning',
};
const RG_LABEL: Record<ResearchSubmission['status'], string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  graded: 'Graded',
  returned_for_revision: 'Revision',
};

type TaskScope = 'open' | 'awaiting-review' | 'done';

function taskStatus(t: TaskDto): TaskScope {
  if (t.hasFeedback) return 'done';
  if (t.submissionText || (t.submissionFileUrls && t.submissionFileUrls.length > 0)) {
    return 'awaiting-review';
  }
  return 'open';
}

function pipelineStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const s = (status || '').toLowerCase();
  if (s === 'accepted' || s === 'admitted') return 'success';
  if (s === 'rejected' || s === 'denied') return 'danger';
  if (s === 'waitlist' || s === 'deferred') return 'warning';
  if (s === 'submitted' || s === 'applied') return 'info';
  return 'neutral';
}

function tabLabel(label: string, count?: number) {
  return (
    <span>
      {label}
      {typeof count === 'number' ? <span className="mc-ws-tab-count">{count}</span> : null}
    </span>
  );
}

export default function StudentWorkspace({ student }: { student: WorkspaceStudent }) {
  const { hasFullSupport, email, managementRole } = useMentorConsole();
  const researchPrepLive = canUseResearchPrepLive(email, managementRole);
  const studentId = student.id;

  // Sessions first (your pick); heavy sections load only when their tab opens.
  const [activeTab, setActiveTab] = useState('sessions');

  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [assignTaskForm] = Form.useForm<{ task: string; deadline: Dayjs; description?: string }>();
  const [feedbackTask, setFeedbackTask] = useState<TaskDto | null>(null);
  const [feedbackForm] = Form.useForm<{ feedback: string }>();
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [milestoneForm] = Form.useForm<{ label: string; date: Dayjs | null }>();
  const [logSessionOpen, setLogSessionOpen] = useState(false);
  const [sessionForm] = Form.useForm<{ when: Dayjs; duration: string; description: string }>();
  const [addPipelineOpen, setAddPipelineOpen] = useState(false);
  const [pipelineForm] = Form.useForm<{ program: string; stage?: string; status?: string; deadline?: Dayjs | null }>();
  const [researchPick, setResearchPick] = useState<ResearchSubmission | null>(null);

  // Always loaded — power the KPI strip + tab badges + default Sessions tab.
  const { bookings, isLoading: loadingBookings } = useMentorBookings(studentId, {
    includeFullSupport: true,
  });
  const { data: tasksRes } = useGetMentorTasksQuery(undefined, { skip: !studentId });
  const { data: pipelineRes } = useGetMentorPipelineQuery(undefined, { skip: !studentId });

  // Lazy — fetched only when the matching tab is active.
  const { data: sessionsRes, isFetching: loadingSessions } = useGetMentorSessionsQuery(
    studentId || null,
    { skip: activeTab !== 'session-log' },
  );
  const { data: milestonesRes, isFetching: loadingMilestones } = useGetMentorMilestonesQuery(
    studentId,
    { skip: activeTab !== 'milestones' },
  );
  const { data: curriculumRes } = useGetMentorCurriculumProgressQuery(studentId, {
    skip: activeTab !== 'curriculum',
  });
  const { data: inbox, isFetching: loadingInbox } = useGetGraderInboxQuery(undefined, {
    skip: activeTab !== 'research' || !hasFullSupport || !researchPrepLive,
  });

  const tasks = useMemo<TaskDto[]>(
    () => (tasksRes?.data ?? []).filter((t) => t.studentUserId === studentId),
    [tasksRes?.data, studentId],
  );
  const pipeline = useMemo<PipelineDto[]>(
    () => (pipelineRes?.data ?? []).filter((p) => p.studentUserId === studentId),
    [pipelineRes?.data, studentId],
  );
  const sessions = sessionsRes?.data ?? [];
  const milestones = milestonesRes?.data ?? [];
  const curriculumItems = (curriculumRes?.data ?? []).filter((c) => c.percent >= 0);

  const studentBookings = useMemo(
    () => bookings.filter((b) => b.studentUserId === studentId),
    [bookings, studentId],
  );
  const upcomingSessions = useMemo(
    () =>
      studentBookings
        .filter((b) => b.status === 'upcoming')
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [studentBookings],
  );
  const researchForStudent = useMemo(
    () => (inbox ?? []).filter((s) => s.studentId === studentId),
    [inbox, studentId],
  );

  const openTasksCount = useMemo(
    () => tasks.filter((t) => taskStatus(t) === 'open' || taskStatus(t) === 'awaiting-review').length,
    [tasks],
  );

  const sessionColumns: ColumnsType<SessionLogDto> = [
    {
      title: 'When',
      dataIndex: 'dateTime',
      key: 'dateTime',
      render: (v: string) => <span style={{ fontSize: 13 }}>{formatDateTime(v)}</span>,
    },
    { title: 'Duration', dataIndex: 'duration', key: 'duration', width: 88 },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'done',
      key: 'done',
      width: 118,
      render: (done: boolean, row) => {
        const isPast = new Date(row.dateTime).getTime() < Date.now();
        if (done) return <McPill variant="success">Completed</McPill>;
        if (isPast) return <McPill variant="danger">Report due</McPill>;
        return <McPill variant="info">Upcoming</McPill>;
      },
    },
  ];

  const taskColumns: ColumnsType<TaskDto> = [
    { title: 'Task', dataIndex: 'task', key: 'task' },
    { title: 'Deadline', dataIndex: 'deadline', key: 'deadline', width: 118, render: (v: string) => formatDate(v) },
    {
      title: 'Status',
      key: 'status',
      width: 132,
      render: (_, row) => {
        const s = taskStatus(row);
        if (s === 'done') return <McPill variant="success">Feedback given</McPill>;
        if (s === 'awaiting-review') return <McPill variant="warning">Awaiting review</McPill>;
        return <McPill variant="info">Assigned</McPill>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 168,
      render: (_, row) => (
        <Space size={4}>
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
            {row.hasFeedback ? 'Edit feedback' : 'Feedback'}
          </Button>
          <Popconfirm
            title="Delete this task?"
            onConfirm={() =>
              deleteTask(row.id)
                .unwrap()
                .then(() => message.success('Task removed'))
                .catch(() => message.error('Could not delete'))
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

  const milestoneColumns: ColumnsType<MilestoneDto> = [
    { title: 'Milestone', dataIndex: 'label', key: 'label' },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 116, render: (v: string | null) => formatDate(v) },
    {
      title: 'Status',
      dataIndex: 'done',
      key: 'done',
      width: 100,
      render: (done: boolean) =>
        done ? <McPill variant="success">Done</McPill> : <McPill variant="neutral">Pending</McPill>,
    },
    {
      title: '',
      key: 'toggle',
      width: 88,
      render: (_, row) => (
        <Switch
          checked={row.done}
          onChange={(v) =>
            updateMilestone({ id: row.id, done: v })
              .unwrap()
              .catch(() => message.error('Update failed'))
          }
        />
      ),
    },
    {
      title: '',
      key: 'del',
      width: 72,
      render: (_, row) => (
        <Popconfirm
          title="Delete milestone?"
          onConfirm={() =>
            deleteMilestone(row.id)
              .unwrap()
              .then(() => message.success('Removed'))
              .catch(() => message.error('Failed'))
          }
        >
          <Button size="small" danger type="text">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const pipelineColumns: ColumnsType<PipelineDto> = [
    { title: 'Program', dataIndex: 'program', key: 'program' },
    { title: 'Stage', dataIndex: 'stage', key: 'stage', width: 120 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => <McPill variant={pipelineStatusVariant(s)}>{s || '—'}</McPill>,
    },
    { title: 'Deadline', dataIndex: 'deadline', key: 'deadline', width: 116, render: (v: string | null) => formatDate(v) },
    {
      title: '',
      key: 'del',
      width: 72,
      render: (_, row) => (
        <Popconfirm
          title="Remove this row?"
          onConfirm={() =>
            deletePipeline(row.id)
              .unwrap()
              .then(() => message.success('Removed'))
              .catch(() => message.error('Failed'))
          }
        >
          <Button size="small" danger type="text">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const [createTask, { isLoading: creatingTask }] = useCreateMentorTaskMutation();
  const [updateFeedback, { isLoading: savingFeedback }] = useUpdateMentorTaskFeedbackMutation();
  const [deleteTask] = useDeleteMentorTaskMutation();
  const [createMilestone, { isLoading: creatingMs }] = useCreateMentorMilestoneMutation();
  const [updateMilestone] = useUpdateMentorMilestoneMutation();
  const [deleteMilestone] = useDeleteMentorMilestoneMutation();
  const [createSession, { isLoading: creatingSession }] = useCreateMentorSessionMutation();
  const [createPipeline, { isLoading: creatingPl }] = useCreateMentorPipelineRowMutation();
  const [deletePipeline] = useDeleteMentorPipelineRowMutation();

  const submitAssignTask = async () => {
    const values = await assignTaskForm.validateFields();
    await createTask({
      studentUserId: studentId,
      task: values.task,
      deadline: values.deadline.toISOString(),
      description: values.description,
    })
      .unwrap()
      .then(() => {
        message.success('Task assigned');
        setAssignTaskOpen(false);
        assignTaskForm.resetFields();
      })
      .catch(() => message.error('Could not assign task'));
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
      .catch(() => message.error('Could not save'));
  };

  const submitMilestone = async () => {
    const values = await milestoneForm.validateFields();
    await createMilestone({
      studentUserId: studentId,
      label: values.label,
      date: values.date ? values.date.toISOString() : null,
    })
      .unwrap()
      .then(() => {
        message.success('Milestone added');
        setAddMilestoneOpen(false);
        milestoneForm.resetFields();
      })
      .catch(() => message.error('Could not add'));
  };

  const submitSession = async () => {
    const values = await sessionForm.validateFields();
    await createSession({
      studentUserId: studentId,
      dateTime: values.when.toISOString(),
      duration: values.duration,
      description: values.description || '',
    })
      .unwrap()
      .then(() => {
        message.success('Session logged');
        setLogSessionOpen(false);
        sessionForm.resetFields();
      })
      .catch(() => message.error('Could not log session'));
  };

  const submitPipeline = async () => {
    const values = await pipelineForm.validateFields();
    await createPipeline({
      studentUserId: studentId,
      program: values.program,
      stage: values.stage,
      status: values.status,
      deadline: values.deadline ? values.deadline.toISOString() : null,
    })
      .unwrap()
      .then(() => {
        message.success('Application row added');
        setAddPipelineOpen(false);
        pipelineForm.resetFields();
      })
      .catch(() => message.error('Could not add'));
  };

  const sectionHead = (
    title: string,
    icon: React.ReactNode,
    action?: { label: string; onClick: () => void },
  ) => (
    <div className="mc-ws-section-head">
      <h2 className="mc-ws-section-title">
        {icon}
        {title}
      </h2>
      {action && (
        <Button type="primary" size="small" icon={<Plus size={14} />} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );

  const items = [
    {
      key: 'sessions',
      label: tabLabel('Sessions', upcomingSessions.length),
      children: (
        <>
          {sectionHead('Upcoming sessions', <Calendar size={18} color="var(--mc-accent)" aria-hidden />)}
          <div className="mc-ws-card">
            {loadingBookings ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Spin />
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div className="mc-ws-empty">No upcoming bookings for this student.</div>
            ) : (
              upcomingSessions.map((b) => (
                <div key={b.id} className="mc-ws-booking">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{formatDateTime(b.dateTime)}</div>
                    <div style={{ fontSize: 12, color: 'var(--mc-text-muted)', marginTop: 4 }}>
                      {b.durationLabel}
                      {b.description ? ` · ${b.description}` : ''}
                    </div>
                  </div>
                  {b.joinUrl ? (
                    <Button size="small" type="link" href={b.joinUrl} target="_blank" rel="noreferrer">
                      Join
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </>
      ),
    },
    {
      key: 'tasks',
      label: tabLabel('Tasks', tasks.length),
      children: (
        <>
          {sectionHead('Tasks', <CheckSquare size={18} color="var(--mc-accent)" aria-hidden />, {
            label: 'Add task',
            onClick: () => setAssignTaskOpen(true),
          })}
          <div className="mc-ws-card">
            {tasks.length === 0 ? (
              <div className="mc-ws-empty">No tasks yet — add the first one above.</div>
            ) : (
              <Table<TaskDto>
                rowKey="id"
                columns={taskColumns}
                dataSource={tasks}
                pagination={false}
                size="small"
                scroll={{ x: true }}
                expandable={{
                  expandedRowRender: (row) => (
                    <div style={{ padding: '4px 8px 12px', maxWidth: 720 }}>
                      {row.submissionText ? (
                        <>
                          <Text strong>Student submission</Text>
                          <div style={{ whiteSpace: 'pre-wrap', marginTop: 6, fontSize: 13 }}>
                            {row.submissionText}
                          </div>
                        </>
                      ) : (
                        <Text type="secondary">No submission yet.</Text>
                      )}
                      {row.feedback ? (
                        <>
                          <div style={{ marginTop: 12 }} />
                          <Text strong style={{ color: 'var(--mc-accent)' }}>
                            Your feedback
                          </Text>
                          <div style={{ whiteSpace: 'pre-wrap', marginTop: 6, fontSize: 13 }}>
                            {row.feedback}
                          </div>
                        </>
                      ) : null}
                    </div>
                  ),
                }}
              />
            )}
          </div>
        </>
      ),
    },
    {
      key: 'session-log',
      label: tabLabel('Session log', sessionsRes ? sessions.length : undefined),
      children: (
        <>
          {sectionHead('Session log', <ClipboardList size={18} color="var(--mc-accent)" aria-hidden />, {
            label: 'Log session',
            onClick: () => setLogSessionOpen(true),
          })}
          <div className="mc-ws-card">
            {loadingSessions ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Spin />
              </div>
            ) : sessions.length === 0 ? (
              <div className="mc-ws-empty">No sessions logged yet.</div>
            ) : (
              <Table<SessionLogDto>
                rowKey="id"
                columns={sessionColumns}
                dataSource={sessions}
                pagination={{ pageSize: 8, size: 'small' }}
                size="small"
                scroll={{ x: true }}
              />
            )}
          </div>
        </>
      ),
    },
    {
      key: 'essays',
      label: tabLabel('Essays', pipeline.length),
      children: (
        <>
          {sectionHead('Essays & applications', <FileText size={18} color="var(--mc-accent)" aria-hidden />, {
            label: 'Add row',
            onClick: () => setAddPipelineOpen(true),
          })}
          <div className="mc-ws-card">
            {pipeline.length === 0 ? (
              <div className="mc-ws-empty">
                Track schools and essay stages — add a pipeline row to get started.
              </div>
            ) : (
              <Table<PipelineDto>
                rowKey="id"
                columns={pipelineColumns}
                dataSource={pipeline}
                pagination={false}
                size="small"
                scroll={{ x: true }}
              />
            )}
          </div>
        </>
      ),
    },
    {
      key: 'milestones',
      label: tabLabel('Milestones', milestonesRes ? milestones.length : undefined),
      children: (
        <>
          {sectionHead('Milestones', <Flag size={18} color="var(--mc-accent)" aria-hidden />, {
            label: 'Add milestone',
            onClick: () => setAddMilestoneOpen(true),
          })}
          <div className="mc-ws-card">
            {loadingMilestones ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Spin />
              </div>
            ) : milestones.length === 0 ? (
              <div className="mc-ws-empty">No milestones — add key dates and deliverables here.</div>
            ) : (
              <Table<MilestoneDto>
                rowKey="id"
                columns={milestoneColumns}
                dataSource={milestones}
                pagination={false}
                size="small"
                scroll={{ x: true }}
              />
            )}
          </div>
        </>
      ),
    },
    ...(hasFullSupport && researchPrepLive
      ? [
          {
            key: 'research',
            label: tabLabel('Research', inbox ? researchForStudent.length : undefined),
            children: (
              <>
                {sectionHead('Research grading', <FlaskConical size={18} color="var(--mc-accent)" aria-hidden />)}
                <div className="mc-ws-card" style={{ padding: 0 }}>
                  {loadingInbox ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                      <Spin />
                    </div>
                  ) : researchForStudent.length === 0 ? (
                    <div className="mc-ws-empty">No research submissions from this student yet.</div>
                  ) : (
                    researchForStudent.map((s) => (
                      <div
                        key={s.id}
                        className="mc-ws-rg-row"
                        role="button"
                        tabIndex={0}
                        onClick={() => setResearchPick(s)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setResearchPick(s);
                          }
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            Week {s.weekNumber} — {s.weekTitle}
                          </div>
                          <div className="mc-ws-rg-meta">
                            Submitted {formatDateTime(s.submittedAt)} · Attempt #{s.attemptNumber}
                            {s.fileName ? ` · ${s.fileName}` : ''}
                          </div>
                        </div>
                        <Space direction="vertical" size={2} style={{ alignItems: 'flex-end' }}>
                          {s.status === 'graded' && s.score != null ? (
                            <Text strong style={{ fontSize: 12 }}>
                              {s.score}/100
                            </Text>
                          ) : null}
                          <McPill variant={RG_MC[s.status]}>{RG_LABEL[s.status]}</McPill>
                        </Space>
                      </div>
                    ))
                  )}
                </div>
              </>
            ),
          },
        ]
      : []),
    {
      key: 'curriculum',
      label: tabLabel('Curriculum', curriculumRes ? curriculumItems.length : undefined),
      children: (
        <>
          {sectionHead('Curriculum progress', <BookOpen size={18} color="var(--mc-accent)" aria-hidden />)}
          <div className="mc-ws-card">
            {curriculumItems.length === 0 ? (
              <div className="mc-ws-empty">No curriculum watchlist items yet.</div>
            ) : (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {curriculumItems.map((item: CurriculumWatchlistItemDto) => (
                  <div key={item.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{item.label}</span>
                      <span style={{ color: 'var(--mc-text-muted)' }}>
                        {item.percent}%{item.target ? ` · target ${item.target}` : ''}
                      </span>
                    </div>
                    <Progress percent={item.percent} showInfo={false} strokeColor="var(--mc-accent)" size="small" />
                  </div>
                ))}
              </Space>
            )}
          </div>
        </>
      ),
    },
  ];

  return (
    <>
      <div className="mc-ws-kpis">
        <div className="mc-ws-kpi mc-ws-kpi--accent">
          <div className="mc-ws-kpi-label">Open tasks</div>
          <div className="mc-ws-kpi-value">{openTasksCount}</div>
        </div>
        <div className="mc-ws-kpi">
          <div className="mc-ws-kpi-label">Upcoming</div>
          <div className="mc-ws-kpi-value">{upcomingSessions.length}</div>
        </div>
        <div className="mc-ws-kpi">
          <div className="mc-ws-kpi-label">Essays / apps</div>
          <div className="mc-ws-kpi-value">{pipeline.length}</div>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} destroyInactiveTabPane />

      <Modal
        title="Assign task"
        open={assignTaskOpen}
        onCancel={() => setAssignTaskOpen(false)}
        onOk={submitAssignTask}
        confirmLoading={creatingTask}
        okText="Assign"
        destroyOnClose
      >
        <Form form={assignTaskForm} layout="vertical">
          <Form.Item name="task" label="Task" rules={[{ required: true, message: 'Describe the task' }]}>
            <Input placeholder="e.g. Draft supplemental essay" />
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
        confirmLoading={savingFeedback}
        okText="Save"
        destroyOnClose
        width={560}
      >
        {feedbackTask && (
          <>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Task
            </Text>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>{feedbackTask.task}</div>
            {feedbackTask.submissionText ? (
              <>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Submission
                </Text>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    marginBottom: 14,
                    padding: 10,
                    borderRadius: 8,
                    background: 'var(--mc-bg-subtle)',
                    fontSize: 13,
                  }}
                >
                  {feedbackTask.submissionText}
                </div>
              </>
            ) : null}
            <Form form={feedbackForm} layout="vertical">
              <Form.Item name="feedback" label="Feedback" rules={[{ required: true, message: 'Write your feedback' }]}>
                <Input.TextArea rows={5} placeholder="What went well, what to improve…" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      <Modal
        title="Add milestone"
        open={addMilestoneOpen}
        onCancel={() => setAddMilestoneOpen(false)}
        onOk={submitMilestone}
        confirmLoading={creatingMs}
        okText="Add"
        destroyOnClose
      >
        <Form form={milestoneForm} layout="vertical">
          <Form.Item name="label" label="Milestone" rules={[{ required: true, message: 'Describe the milestone' }]}>
            <Input placeholder="e.g. Submit RD1 application" />
          </Form.Item>
          <Form.Item name="date" label="Target date (optional)">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Log session"
        open={logSessionOpen}
        onCancel={() => setLogSessionOpen(false)}
        onOk={submitSession}
        confirmLoading={creatingSession}
        okText="Save"
        destroyOnClose
      >
        <Form form={sessionForm} layout="vertical">
          <Form.Item name="when" label="When" rules={[{ required: true, message: 'Pick date & time' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="duration" label="Duration" rules={[{ required: true, message: 'e.g. 1h' }]} initialValue="1h">
            <Input placeholder="1h" />
          </Form.Item>
          <Form.Item name="description" label="Notes">
            <Input.TextArea rows={3} placeholder="What you covered…" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add application / essay row"
        open={addPipelineOpen}
        onCancel={() => setAddPipelineOpen(false)}
        onOk={submitPipeline}
        confirmLoading={creatingPl}
        okText="Add"
        destroyOnClose
      >
        <Form form={pipelineForm} layout="vertical">
          <Form.Item name="program" label="Program or school" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. Oxford PPE" />
          </Form.Item>
          <Form.Item name="stage" label="Stage">
            <Input placeholder="e.g. Supplemental draft" />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              allowClear
              placeholder="Select status"
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'in progress', label: 'In progress' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'waitlist', label: 'Waitlist' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </Form.Item>
          <Form.Item name="deadline" label="Deadline (optional)">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <SubmissionDrawer open={!!researchPick} submission={researchPick} onClose={() => setResearchPick(null)} />
    </>
  );
}
