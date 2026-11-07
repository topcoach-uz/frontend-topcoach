import SharedApplications from './SharedApplications';
import { SessionRecording } from 'src/components/session-recording/SessionRecording';
import { useGetMentorEssayReviewsQuery } from "src/app/services/student-hub/essayReviewApi";
import { calendarDateValue } from '../calendarDate';
import ApplicationRequirements from "src/pages/student-hub/applicant/ApplicationRequirements";
import { useGetMentorStudentApplicationsQuery, useUpdateMentorApplicationRequirementsMutation } from 'src/app/services/student-hub/applicationTrackingApi';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
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
  Calendar,
  CalendarCheck,
  CheckCircle2,
  CheckSquare,
  Circle,
  FileText,
  Flag,
  MessageSquare,
  Plus,
  RotateCcw,
  X,
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
  useGetMentorTasksQuery,
  useUpdateMentorMilestoneMutation,
  useUpdateMentorTaskFeedbackMutation,
  type CurriculumWatchlistItemDto,
  type MilestoneDto,
  type PipelineDto,
  type TaskDto,
} from 'src/app/services/fullSupportApi';
import { useGetGraderInboxQuery, type ResearchSubmission } from 'src/app/services/research-prep';
import { useFindOrCreateConversationMutation } from 'src/app/services/chat/chatApi';
import MessageList from 'src/components/chat/MessageList';
import ChatInput from 'src/components/chat/ChatInput';
import SubmissionDrawer from '../../research-grading/SubmissionDrawer';
import { useMentorBookings } from '../sessionSources';
import { bookingDisplay, groupStudentSessions } from '../sessionDisplay';
import { useSessionActions } from './sessions/useSessionActions';
import { EssayReviewList } from './reviews/EssayReviewList';
import { DocumentReviewList } from './reviews/DocumentReviewList';
import { useReviewCounts } from './reviews/reviewCounts';
import { useMentorConsole } from '../MentorConsoleContext';
import { McPill, type McPillVariant } from './McPill';
import { McStat } from './McStat';
import { formatDate, formatDateTime } from '../utils';
import { canUseResearchPrepLive } from 'src/lib/researchPrepAccess';
import { hostName } from 'src/app/services/api/const';
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
type MoreView = 'milestones' | 'research' | 'curriculum';

function taskStatus(t: TaskDto): TaskScope {
  if (t.status === 'approved') return 'done';
  if (t.status === 'submitted') return 'awaiting-review';
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
      {typeof count === 'number' && count > 0 ? (
        <span className="mc-ws-tab-count">{count}</span>
      ) : null}
    </span>
  );
}

/**
 * Inline message thread for the "Message" tab — resolves (or creates) the
 * mentor↔student PEER conversation lazily on first mount, then reuses the
 * existing MessageList + ChatInput primitives for the live thread. No
 * thread picker (mirrors the former FullSupportMentorDashboard's
 * `openToGeneralConversation` usage — general conversation, no threadId).
 */
function StudentMessageTab({ mentorId, studentId }: { mentorId: string; studentId: string }) {
  const [findOrCreateConversation] = useFindOrCreateConversationMutation();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState(false);
  const resolvedForStudentRef = useRef<string | null>(null);

  const resolveConversation = useCallback(() => {
    if (!mentorId || !studentId) return;
    resolvedForStudentRef.current = studentId;
    setResolving(true);
    setResolveError(false);
    findOrCreateConversation({ mentorId, studentId })
      .unwrap()
      .then((res) => {
        setConversationId(res?.conversation?.id ?? null);
        if (!res?.conversation?.id) setResolveError(true);
      })
      .catch(() => setResolveError(true))
      .finally(() => setResolving(false));
  }, [mentorId, studentId, findOrCreateConversation]);

  useEffect(() => {
    // Fires once per studentId — guards against StrictMode's double-invoke
    // and re-renders; a genuine student change resets the guard.
    if (resolvedForStudentRef.current !== studentId) {
      setConversationId(null);
      resolveConversation();
    }
  }, [studentId, resolveConversation]);

  if (resolveError) {
    return (
      <div className="mc-ws-message-tab mc-ws-message-tab--center">
        <Text type="secondary">Couldn&apos;t open the conversation.</Text>
        <Button size="small" icon={<RotateCcw size={14} />} onClick={resolveConversation}>
          Retry
        </Button>
      </div>
    );
  }

  if (resolving || !conversationId) {
    return (
      <div className="mc-ws-message-tab mc-ws-message-tab--center">
        <Spin />
      </div>
    );
  }

  return (
    <div className="mc-ws-message-tab">
      <div className="mc-ws-message-thread">
        <MessageList conversationId={conversationId} />
      </div>
      <ChatInput conversationId={conversationId} />
    </div>
  );
}

export default function StudentWorkspace({
  student,
  isFullSupport = true,
}: {
  student: WorkspaceStudent;
  /** False for a 1:1 platform mentee — hides Full-Support-only sections. */
  isFullSupport?: boolean;
}) {
  const { id: mentorId, hasFullSupport, email, managementRole } = useMentorConsole();
  const researchPrepLive = canUseResearchPrepLive(email, managementRole);
  const studentId = student.id;

  // Tasks first — the mockup's everyday view. Heavy sections load lazily.
  const [activeTab, setActiveTab] = useState('tasks');
  const [moreView, setMoreView] = useState<MoreView>('milestones');

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskDescription, setQuickTaskDescription] = useState('');
  const [quickTaskDeadline, setQuickTaskDeadline] = useState<Dayjs | null>(null);
  const [feedbackTask, setFeedbackTask] = useState<TaskDto | null>(null);
  const [feedbackForm] = Form.useForm<{ feedback: string; decision: 'approved' | 'revision_requested' }>();
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [milestoneForm] = Form.useForm<{ label: string; date: Dayjs | null }>();
  const [logSessionOpen, setLogSessionOpen] = useState(false);
  const [sessionForm] = Form.useForm<{ when: Dayjs; duration: string; description: string }>();
  const [addPipelineOpen, setAddPipelineOpen] = useState(false);
  const [pipelineForm] = Form.useForm<{ program: string; stage?: string; status?: string; deadline?: Dayjs | null }>();
  const [researchPick, setResearchPick] = useState<ResearchSubmission | null>(null);

  // Always loaded — power the stat cards + tab badges.
  const { bookings, isLoading: loadingBookings } = useMentorBookings(studentId, {
    includeFullSupport: true,
  });
  const { data: tasksRes, isLoading: loadingTasks } = useGetMentorTasksQuery(undefined, {
    skip: !studentId, pollingInterval: 10000, refetchOnMountOrArgChange: true,
  });
  const { data: pipelineRes } = useGetMentorPipelineQuery(undefined, { skip: !studentId });

  const essayReviews = useGetMentorEssayReviewsQuery(undefined, {
    skip: !studentId, pollingInterval: 10000, refetchOnMountOrArgChange: true,
  });
  const sharedEssayCount = new Set((essayReviews.data ?? [])
    .filter(review => review.studentUserId === studentId && review.status !== 'withdrawn')
    .map(review => review.essayId)).size;

  const { essayCount: pendingEssayCount, documentCount: pendingDocCount } = useReviewCounts(false, studentId);
  const [updateApplicationRequirements] = useUpdateMentorApplicationRequirementsMutation();
  const studentApplications = useGetMentorStudentApplicationsQuery(studentId ?? '', { skip: !studentId, pollingInterval: 10000 });

  // Lazy — fetched only when the matching tab (or "More" section) is active.
  const { data: milestonesRes, isFetching: loadingMilestones } = useGetMentorMilestonesQuery(
    studentId,
    { skip: activeTab !== 'more' || moreView !== 'milestones' },
  );
  const { data: curriculumRes } = useGetMentorCurriculumProgressQuery(studentId, {
    skip: activeTab !== 'more' || moreView !== 'curriculum',
  });
  const { data: inbox, isFetching: loadingInbox } = useGetGraderInboxQuery(undefined, {
    skip:
      activeTab !== 'more' || moreView !== 'research' || !hasFullSupport || !researchPrepLive,
  });

  const tasks = useMemo<TaskDto[]>(
    () => (tasksRes?.data ?? []).filter((t) => t.studentUserId === studentId),
    [tasksRes?.data, studentId],
  );
  const pipeline = useMemo<PipelineDto[]>(
    () => (pipelineRes?.data ?? []).filter((p) => p.studentUserId === studentId),
    [pipelineRes?.data, studentId],
  );
  const milestones = milestonesRes?.data ?? [];
  const curriculumItems = (curriculumRes?.data ?? []).filter((c) => c.percent >= 0);

  // The Full Support query is already scoped to this student server-side.
  const studentBookings = useMemo(
    () => bookings.filter((b) => b.source === 'full-support' || b.studentUserId === studentId),
    [bookings, studentId],
  );
  const grouped = useMemo(() => groupStudentSessions(studentBookings), [studentBookings]);
  const upcomingSessions = grouped.upcoming;
  const pastSessions = useMemo(
    () => studentBookings.filter((b) => b.status !== 'upcoming'),
    [studentBookings],
  );
  const canAssignTask = isFullSupport !== false || studentBookings.some(
    (booking) => booking.source === 'platform' && (booking.status === 'completed' || booking.status === 'report-due'),
  );
  const researchForStudent = useMemo(
    () => (inbox ?? []).filter((s) => s.studentId === studentId),
    [inbox, studentId],
  );

  const openTasksCount = useMemo(
    () => tasks.filter((t) => taskStatus(t) !== 'done').length,
    [tasks],
  );
  const awaitingReviewCount = useMemo(
    () => tasks.filter((t) => taskStatus(t) === 'awaiting-review').length,
    [tasks],
  );
  const reportsFiled = useMemo(
    () => studentBookings.filter((b) => b.source === 'platform' ? !!b.report : bookingDisplay(b).label === 'Held').length,
    [studentBookings],
  );
  const reportsDue = useMemo(
    () => grouped.needsAction.length,
    [grouped.needsAction],
  );

  const [createTask, { isLoading: creatingTask }] = useCreateMentorTaskMutation();
  const [updateFeedback, { isLoading: savingFeedback }] = useUpdateMentorTaskFeedbackMutation();
  const [deleteTask] = useDeleteMentorTaskMutation();
  const [createMilestone, { isLoading: creatingMs }] = useCreateMentorMilestoneMutation();
  const [updateMilestone] = useUpdateMentorMilestoneMutation();
  const [deleteMilestone] = useDeleteMentorMilestoneMutation();
  const sessionActions = useSessionActions();
  const [createSession, { isLoading: creatingSession }] = useCreateMentorSessionMutation();
  const [createPipeline, { isLoading: creatingPl }] = useCreateMentorPipelineRowMutation();
  const [deletePipeline] = useDeleteMentorPipelineRowMutation();

  const submitQuickTask = async () => {
    if (!canAssignTask) { message.warning('You can assign tasks after your first completed 1:1 meeting.'); return; }
    const title = quickTaskTitle.trim();
    if (!title) {
      message.warning('Give the task a title');
      return;
    }
    if (!quickTaskDeadline) {
      message.warning('Pick a due date');
      return;
    }
    await createTask({
      studentUserId: studentId,
      task: title,
      description: quickTaskDescription.trim() || undefined,
      deadline: calendarDateValue(quickTaskDeadline)!,
    })
      .unwrap()
      .then(() => {
        message.success('Task assigned');
        setQuickTaskTitle('');
        setQuickTaskDescription('');
        setQuickTaskDeadline(null);
      })
      .catch(() => message.error('Could not assign task'));
  };

  const submitFeedback = async () => {
    if (!feedbackTask) return;
    const values = await feedbackForm.validateFields();
    await updateFeedback({
      id: feedbackTask.id,
      feedback: values.feedback,
      decision: values.decision,
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
      date: calendarDateValue(values.date),
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
      deadline: calendarDateValue(values.deadline),
    })
      .unwrap()
      .then(() => {
        message.success('Application row added');
        setAddPipelineOpen(false);
        pipelineForm.resetFields();
      })
      .catch(() => message.error('Could not add'));
  };

  const openFeedbackModal = (t: TaskDto) => {
    setFeedbackTask(t);
    feedbackForm.setFieldsValue({ feedback: '', decision: 'approved' });
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

  const renderTaskRow = (t: TaskDto) => {
    const s = taskStatus(t);
    const done = s === 'done';
    const overdue =
      !done && t.deadline && new Date(t.deadline).getTime() < Date.now();
    const expanded = expandedTaskId === t.id;
    const hasDetail = !!(t.description || t.submissionText || t.feedback);

    return (
      <div key={t.id} className={`mc-ws-task${done ? ' mc-ws-task--done' : ''}`}>
        <div className="mc-ws-task-row">
          <span
            className={`mc-ws-task-check${done ? ' mc-ws-task-check--done' : ''}`}
            title={done ? 'Feedback given' : s === 'awaiting-review' ? 'Awaiting your review' : 'Assigned'}
          >
            {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
          </span>

          <button
            type="button"
            className="mc-ws-task-main"
            onClick={() => hasDetail && setExpandedTaskId(expanded ? null : t.id)}
            style={{ cursor: hasDetail ? 'pointer' : 'default' }}
          >
            <span className="mc-ws-task-title">{t.task}</span>
            {s === 'awaiting-review' && <McPill variant="warning">Awaiting review</McPill>}
            {t.status === 'revision_requested' && <McPill variant="warning">Revision requested</McPill>}
          </button>

          <span className={`mc-ws-task-due${overdue ? ' mc-ws-task-due--overdue' : ''}`}>
            {t.deadline ? `Due ${formatDate(t.deadline)}` : ''}
          </span>

          {s === 'awaiting-review' ? (
            <Button type="primary" size="small" onClick={() => openFeedbackModal(t)}>
              Review
            </Button>
          ) : null}

          <Popconfirm
            title="Delete this task?"
            onConfirm={() =>
              deleteTask(t.id)
                .unwrap()
                .then(() => message.success('Task removed'))
                .catch(() => message.error('Could not delete'))
            }
          >
            <button type="button" className="mc-ws-task-x" aria-label="Delete task">
              <X size={15} />
            </button>
          </Popconfirm>
        </div>

        {expanded && hasDetail && (
          <div className="mc-ws-task-detail">
            {t.description && <div className="mc-ws-task-detail-text">Instructions: {t.description}</div>}
            {t.submissionText ? (
              <>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Student submission
                </Text>
                <div className="mc-ws-task-detail-text">{t.submissionText}</div>
              </>
            ) : null}
            {t.feedback ? (
              <>
                <Text strong style={{ color: 'var(--mc-accent)', fontSize: 12 }}>
                  Your feedback
                </Text>
                <div className="mc-ws-task-detail-text">{t.feedback}</div>
              </>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  const renderBookingRow = (b: (typeof bookings)[number]) => {
    const display = bookingDisplay(b);
    const isFs = b.source === 'full-support';
    const report = b.source === 'platform' ? b.report : null;
    return (
      <div key={b.id} className="mc-ws-booking">
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{formatDateTime(b.dateTime)}</div>
          <div style={{ fontSize: 12, color: 'var(--mc-text-muted)', marginTop: 4 }}>
            {b.durationLabel}
            {isFs ? ' · Full Support' : ' · 1:1 session'}
            {b.description ? ` · ${b.description}` : ''}
            {b.status === 'cancelled' && b.cancelReason ? ` · ${b.cancelReason}` : ''}
          </div>
          {isFs && b.status !== 'upcoming' && (
            <div style={{ fontSize: 12, marginTop: 6 }}>
              Attendance: {display.attendance}
              {display.actualMinutes !== null ? ` · ${display.actualMinutes} min actual` : ''}
              {display.notes && <div style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{display.notes}</div>}
            </div>
          )}
          {report && (
            <div style={{ fontSize: 12, marginTop: 6, whiteSpace: 'pre-wrap' }}>
              <b>Report:</b> {report.topicsCovered}
            </div>
          )}
          {b.studentNote ? (
            <div className="mc-ws-booking-note">
              <MessageSquare size={12} />
              <span>
                <b>Student&apos;s note:</b> {b.studentNote}
              </span>
            </div>
          ) : null}
        </div>
        <Space size={8} align="center" wrap>
          <McPill variant={display.variant}>{display.label}</McPill>
          {b.status === 'upcoming' && b.joinUrl ? (
            <Button size="small" type="link" href={b.joinUrl} target="_blank" rel="noreferrer">
              Join
            </Button>
          ) : null}
          <SessionRecording source={b.source} sessionId={b.raw.id} />
          {sessionActions.renderActions(b)}
        </Space>
      </div>
    );
  };

  const renderSessionGroup = (title: string, rows: typeof bookings, empty?: string) => {
    if (rows.length === 0 && !empty) return null;
    return (
      <>
        {sectionHead(title, <Calendar size={18} color="var(--mc-accent)" aria-hidden />)}
        <div className="mc-ws-card">
          {rows.length === 0 ? <div className="mc-ws-empty">{empty}</div> : rows.map(renderBookingRow)}
        </div>
      </>
    );
  };

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

  const moreOptions = [
    { label: 'Milestones', value: 'milestones' },
    ...(hasFullSupport && researchPrepLive ? [{ label: 'Research', value: 'research' }] : []),
    { label: 'Curriculum', value: 'curriculum' },
  ];

  const items = [
    {
      key: 'tasks',
      label: tabLabel('Tasks', openTasksCount),
      children: (
        <>
          {sectionHead('Tasks', <CheckSquare size={18} color="var(--mc-accent)" aria-hidden />)}
          <div className="mc-ws-card">
            {loadingTasks ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Spin />
              </div>
            ) : tasks.length === 0 ? (
              <div className="mc-ws-empty">No tasks yet — assign the first one below.</div>
            ) : (
              <div className="mc-ws-tasklist">{tasks.map(renderTaskRow)}</div>
            )}
            {!canAssignTask && !loadingBookings && <div className="mc-ws-empty">Task assignment becomes available after your first completed 1:1 meeting with this student.</div>}
            {canAssignTask && <div className="mc-ws-task-add">
              <Input
                placeholder="New task title…"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                onPressEnter={submitQuickTask}
              />
              <Input
                placeholder="Instructions for the student (optional)"
                value={quickTaskDescription}
                onChange={(e) => setQuickTaskDescription(e.target.value)}
              />
              <DatePicker
                placeholder="Due date"
                value={quickTaskDeadline}
                onChange={(v) => setQuickTaskDeadline(v)}
              />
              <Button
                type="primary"
                icon={<Plus size={14} />}
                loading={creatingTask}
                onClick={submitQuickTask}
              >
                Add task
              </Button>
            </div>}
          </div>
        </>
      ),
    },
    {
      key: 'sessions',
      // Badge = sessions waiting on the mentor only, so a number always means "act here".
      label: tabLabel('Sessions', reportsDue),
      children: (
        <>
          {isFullSupport && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <Button type="primary" icon={<Plus size={14} />} onClick={() => setLogSessionOpen(true)}>
                Log session
              </Button>
            </div>
          )}
          {loadingBookings ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <Spin />
            </div>
          ) : (
            <>
              {renderSessionGroup('Needs action', grouped.needsAction)}
              {renderSessionGroup('Upcoming', grouped.upcoming, 'No upcoming sessions with this student.')}
              {renderSessionGroup('Past', grouped.past, 'No past sessions with this student yet.')}
            </>
          )}
        </>
      ),
    },
    {
      key: 'message',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <MessageSquare size={14} />
          Message
        </span>
      ),
      children: <StudentMessageTab mentorId={mentorId} studentId={studentId} />,
    },
    {
      key: 'reviews',
      label: tabLabel('Reviews', pendingEssayCount + pendingDocCount),
      children: (
        <>
          {sectionHead('Essays', <FileText size={18} color="var(--mc-accent)" aria-hidden />)}
          <EssayReviewList studentUserId={studentId} embedded />
          {sectionHead('Documents', <FileText size={18} color="var(--mc-accent)" aria-hidden />)}
          <DocumentReviewList studentUserId={studentId} embedded />
        </>
      ),
    },
    {key:'essays',label:'Applications',children:<SharedApplications studentId={studentId}/>},
    {
      key: 'more',
      label: tabLabel('More'),
      children: (
        <>
          <div className="mc-ws-more-switch">
            <Segmented
              value={moreView}
              onChange={(v) => setMoreView(v as MoreView)}
              options={moreOptions}
            />
          </div>

          {moreView === 'milestones' && (
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
          )}

          {moreView === 'research' && hasFullSupport && researchPrepLive && (
            <>
              {sectionHead('Research grading', <CheckSquare size={18} color="var(--mc-accent)" aria-hidden />)}
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
          )}

          {moreView === 'curriculum' && (
            <>
              {sectionHead('Curriculum progress', <CheckSquare size={18} color="var(--mc-accent)" aria-hidden />)}
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
          )}
        </>
      ),
    },
  ];

  // 1:1 mentees only get the tabs backed by data that exists for them —
  // Full-Support-only surfaces (essays, milestones/research/
  // curriculum) are hidden.
  const visibleItems = isFullSupport
    ? items
    : items.filter((it) => ['tasks', 'sessions', 'message', 'reviews'].includes(it.key));

  return (
    <>
      <div className="mc-stat-grid mc-ws-stats">
        <McStat
          icon={<Calendar size={18} />}
          label="Total sessions"
          value={student.sessionsCount}
          meta={
            isFullSupport
              ? `${student.used}h of ${student.allocated}h used`
              : upcomingSessions.length > 0
                ? `${upcomingSessions.length} upcoming`
                : 'All past'
          }
          tone="info"
        />
        <McStat
          icon={<CalendarCheck size={18} />}
          label="Reports filed"
          value={reportsFiled}
          meta={reportsDue > 0 ? `${reportsDue} report${reportsDue === 1 ? '' : 's'} due` : 'All filed'}
          tone={reportsDue > 0 ? 'alert' : 'good'}
          cta={reportsDue > 0 ? 'Open sessions' : undefined}
          onClick={reportsDue > 0 ? () => setActiveTab('sessions') : undefined}
        />
        <McStat
          icon={<CheckSquare size={18} />}
          label="Open tasks"
          value={openTasksCount}
          meta={
            awaitingReviewCount > 0
              ? `${awaitingReviewCount} awaiting review`
              : openTasksCount > 0
                ? 'Assigned'
                : 'All caught up'
          }
          tone={awaitingReviewCount > 0 ? 'warn' : 'neutral'}
        />
        {isFullSupport ? (
          <McStat
            icon={<FileText size={18} />}
            label="Shared essays"
            value={essayReviews.isError ? "—" : sharedEssayCount}
            meta={essayReviews.isError ? "Count unavailable" : "Shared with you for review"}
            tone="neutral"
            cta="Open reviews"
            onClick={() => setActiveTab('reviews')}
          />
        ) : (
          <McStat
            icon={<CalendarCheck size={18} />}
            label="Past sessions"
            value={pastSessions.length}
            meta="1:1 sessions held"
            tone="neutral"
          />
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={visibleItems}
        destroyInactiveTabPane
      />

      <Modal
        title="Review student work"
        open={!!feedbackTask}
        onCancel={() => setFeedbackTask(null)}
        onOk={submitFeedback}
        confirmLoading={savingFeedback}
        okText="Send review"
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
            {feedbackTask.submissionFileUrls?.map((file) => (
              <a key={file.url} href={`${hostName}${file.url}`} target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: 8 }}>
                {file.fileName}
              </a>
            ))}
            <Form form={feedbackForm} layout="vertical">
              <Form.Item name="decision" label="Decision" rules={[{ required: true }]}>
                <Select options={[{ value: 'approved', label: 'Approve task' }, { value: 'revision_requested', label: 'Request revision' }]} />
              </Form.Item>
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
        <Form form={sessionForm} layout="vertical" initialValues={{ when: dayjs(), duration: '1h' }}>
          <Form.Item name="when" label="When" rules={[{ required: true, message: 'Pick date & time' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="duration" label="Duration" rules={[{ required: true, message: 'e.g. 1h' }]}>
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

      {sessionActions.modals}
      <SubmissionDrawer open={!!researchPick} submission={researchPick} onClose={() => setResearchPick(null)} />
    </>
  );
}
