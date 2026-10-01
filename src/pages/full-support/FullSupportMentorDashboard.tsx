import React, { useState } from 'react';
import { Card, Table, Button, Tag, Progress, Modal, Form, Input, InputNumber, Select, DatePicker, Switch, Space, message, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { User, Plus, CheckCircle2, FileText, Globe, Pencil, Eye, Trash2, Download, Calendar, MessageCircle, CalendarClock, BarChart2, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useColors from 'src/hooks/useColors';
import { useTypedSelector } from 'src/app/store';
import ChatModal from 'src/components/chat/ChatModal';
import { useFindOrCreateConversationMutation } from 'src/app/services/chat/chatApi';
import { hostName } from 'src/app/services/api/const';
import dayjs from 'src/lib/dayjs';
import type { Dayjs } from 'dayjs';
import {
  useGetMentorRosterQuery,
  useGetMentorSessionsQuery,
  useCreateMentorSessionMutation,
  useRecordMentorLessonMutation,
  useRescheduleMentorLessonMutation,
  useDeleteMentorSessionMutation,
  useGetMentorTasksQuery,
  useCreateMentorTaskMutation,
  useUpdateMentorTaskFeedbackMutation,
  useLinkMentorTaskToLessonMutation,
  useDeleteMentorTaskMutation,
  useGetMentorMilestonesQuery,
  useCreateMentorMilestoneMutation,
  useUpdateMentorMilestoneMutation,
  useDeleteMentorMilestoneMutation,
  useGetMentorPipelineQuery,
  useCreateMentorPipelineRowMutation,
  useUpdateMentorPipelineRowMutation,
  useDeleteMentorPipelineRowMutation,
  useLazyGetWeeklyReportQuery,
  useGetMentorCurriculumProgressQuery,
  useSetMentorCurriculumItemMutation,
  type MentorRosterStudent,
  type SessionLogDto,
  type TaskDto,
  type MilestoneDto,
  type PipelineDto,
  useUploadMentorFeedbackFileMutation,
} from 'src/app/services/fullSupportApi';
import { generateWeeklyReportPdf } from 'src/utils/fullSupportWeeklyReportPdf';
import './full-support.scss';


function getTaskStatus(r: TaskDto): string {
  if (r.status === 'approved') return 'Reviewed';
  if (r.status === 'revision_requested') return 'Revision requested';
  if (r.status === 'submitted') return 'Needs review';
  return 'Pending';
}

function formatDeadline(isoDate: string): string {
  if (!isoDate) return '';
  return dayjs(isoDate).format('MMM D, YYYY');
}

const PIPELINE_STAGES = ['Not Started', 'Research', 'Essay Draft', 'Essay Review', 'Final Review', 'Submitted'] as const;
const PIPELINE_STATUSES = ['Not Started', 'In Progress', 'Submitted', 'Accepted', 'Rejected'] as const;

const statusColors: Record<string, string> = {
  Pending: 'default',
  'Needs review': 'orange',
  Reviewed: 'green',
  'In-Process': 'orange',
  'Not Started': 'default',
  'In Progress': 'orange',
  Submitted: 'blue',
  Accepted: 'green',
  Rejected: 'red',
};

export default function FullSupportMentorDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const colors = useColors();
  const primary = colors?.colorPrimary ?? '#8b0000';

  const { data: rosterData, isLoading: rosterLoading } = useGetMentorRosterQuery();
  const roster: MentorRosterStudent[] = rosterData?.data ?? [];
  const [sessionLogStudent, setSessionLogStudent] = useState<MentorRosterStudent | null>(null);
  const { data: sessionsData } = useGetMentorSessionsQuery(sessionLogStudent?.id ?? null, { skip: !sessionLogStudent?.id });
  const { data: allSessionsData } = useGetMentorSessionsQuery(null);
  const sessionLogs: SessionLogDto[] = sessionsData?.data ?? [];
  const allSessions: SessionLogDto[] = allSessionsData?.data ?? [];
  const [createSession, { isLoading: createSessionLoading }] = useCreateMentorSessionMutation();
  const [recordLesson, { isLoading: recordingLesson }] = useRecordMentorLessonMutation();
  const [rescheduleLesson, { isLoading: reschedulingLesson }] = useRescheduleMentorLessonMutation();
  const [deleteSession] = useDeleteMentorSessionMutation();
  const [lessonToRecord, setLessonToRecord] = useState<SessionLogDto | null>(null);
  const [lessonToReschedule, setLessonToReschedule] = useState<SessionLogDto | null>(null);
  const [recordForm] = Form.useForm();
  const [rescheduleForm] = Form.useForm();

  const { data: tasksData } = useGetMentorTasksQuery();
  const tasks: TaskDto[] = tasksData?.data ?? [];
  const [createTask] = useCreateMentorTaskMutation();
  const [updateTaskFeedback] = useUpdateMentorTaskFeedbackMutation();
  const [linkTaskToLesson] = useLinkMentorTaskToLessonMutation();
  const [deleteTask] = useDeleteMentorTaskMutation();

  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [feedbackModalTask, setFeedbackModalTask] = useState<TaskDto | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackFileList, setFeedbackFileList] = useState<UploadFile[]>([]);
  const [viewSubmissionTask, setViewSubmissionTask] = useState<TaskDto | null>(null);
  const [form] = Form.useForm();
  const taskStudentId = Form.useWatch('student', form);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [fullSupportChatOpen, setFullSupportChatOpen] = useState(false);
  const currentUser = useTypedSelector((state) => state.auth.profile);
  const [findOrCreateConversation] = useFindOrCreateConversationMutation();
  const [selectedMilestoneStudentId, setSelectedMilestoneStudentId] = useState<string>(roster[0]?.id ?? '');
  const { data: milestonesData } = useGetMentorMilestonesQuery(selectedMilestoneStudentId || '', { skip: !selectedMilestoneStudentId });
  const currentMilestones: MilestoneDto[] = milestonesData?.data ?? [];
  const [createMilestone] = useCreateMentorMilestoneMutation();
  const [updateMilestone] = useUpdateMentorMilestoneMutation();
  const [deleteMilestone] = useDeleteMentorMilestoneMutation();
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [milestoneForm] = Form.useForm();
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [sessionForm] = Form.useForm();
  const { data: pipelineData } = useGetMentorPipelineQuery();
  const pipelineRows: PipelineDto[] = pipelineData?.data ?? [];
  const [createPipelineRow] = useCreateMentorPipelineRowMutation();
  const [updatePipelineRow] = useUpdateMentorPipelineRowMutation();
  const [deletePipelineRow] = useDeleteMentorPipelineRowMutation();
  const [addPipelineOpen, setAddPipelineOpen] = useState(false);
  const [pipelineForm] = Form.useForm();
  const [weeklyReportModalOpen, setWeeklyReportModalOpen] = useState(false);
  const [fetchWeeklyReport, { isLoading: weeklyReportLoading }] = useLazyGetWeeklyReportQuery();
  const [downloadingStudentId, setDownloadingStudentId] = useState<string | null>(null);
  const [selectedProgressStudent, setSelectedProgressStudent] = useState<MentorRosterStudent | null>(null);
  const { data: progressSessionsData } = useGetMentorSessionsQuery(selectedProgressStudent?.id ?? null, { skip: !selectedProgressStudent?.id });
  const progressSessions: SessionLogDto[] = progressSessionsData?.data ?? [];
  const { data: progressCurriculumData } = useGetMentorCurriculumProgressQuery(selectedProgressStudent?.id ?? '', { skip: !selectedProgressStudent?.id });
  const progressCurriculumWatchlist = progressCurriculumData?.data ?? [];
  const { data: progressMilestonesData } = useGetMentorMilestonesQuery(selectedProgressStudent?.id ?? '', { skip: !selectedProgressStudent?.id });
  const progressMilestones: MilestoneDto[] = progressMilestonesData?.data ?? [];
  const progressStudentRosterEntry = selectedProgressStudent ? roster.find((r) => r.id === selectedProgressStudent.id) : null;
  const progressUsedHours = progressStudentRosterEntry?.used ?? 0;
  const progressAllocatedHours = progressStudentRosterEntry?.allocated ?? 0;
  const progressStudentTasks = selectedProgressStudent ? tasks.filter((t) => t.studentUserId === selectedProgressStudent.id) : [];
  const progressStudentPipeline = selectedProgressStudent ? pipelineRows.filter((p) => p.studentUserId === selectedProgressStudent.id) : [];
  const [progressReportDownloading, setProgressReportDownloading] = useState(false);
  const [editSatTargetOpen, setEditSatTargetOpen] = useState(false);
  const [satTargetValue, setSatTargetValue] = useState<string>('Target: 1450+');
  const [setCurriculumItem, { isLoading: settingCurriculumItem }] = useSetMentorCurriculumItemMutation();

  React.useEffect(() => {
    if (roster.length > 0 && !roster.some((s) => s.id === selectedMilestoneStudentId)) {
      setSelectedMilestoneStudentId(roster[0]?.id ?? '');
    }
  }, [roster, selectedMilestoneStudentId]);

  const handleRecordLesson = async (values: { outcome: 'held' | 'cancelled' | 'student_no_show' | 'mentor_no_show'; attendance?: 'present' | 'late'; actualDurationMinutes?: number; sharedNotes?: string; existingTaskId?: string; homeworkTitle?: string; homeworkDeadline?: Dayjs; homeworkDescription?: string }) => {
    if (!lessonToRecord) return;
    try {
      await recordLesson({ id: lessonToRecord.id, outcome: values.outcome, attendance: values.attendance, actualDurationMinutes: values.actualDurationMinutes, sharedNotes: values.sharedNotes }).unwrap();
      if (values.existingTaskId) {
        try { await linkTaskToLesson({ id: values.existingTaskId, lessonId: lessonToRecord.id }).unwrap(); }
        catch { message.warning('Lesson saved, but the existing task could not be linked.'); }
      }
      if (values.homeworkTitle?.trim()) {
        if (!values.homeworkDeadline) {
          message.warning('Lesson recorded. Add a homework deadline before assigning the task.');
          return;
        }
        try {
          await createTask({ studentUserId: lessonToRecord.studentUserId!, lessonId: lessonToRecord.id, task: values.homeworkTitle.trim(), deadline: values.homeworkDeadline.format('YYYY-MM-DD'), description: values.homeworkDescription }).unwrap();
        } catch {
          setLessonToRecord(null);
          recordForm.resetFields();
          message.warning('Lesson saved, but homework was not assigned. Use Assign Task and select this lesson to retry.');
          return;
        }
      }
      message.success('Lesson record saved.');
      setLessonToRecord(null);
      recordForm.resetFields();
    } catch { message.error('Could not record this lesson.'); }
  };

  const handleRescheduleLesson = async (values: { dateTime: Dayjs; duration: string }) => {
    if (!lessonToReschedule) return;
    try {
      await rescheduleLesson({ id: lessonToReschedule.id, dateTime: values.dateTime.toISOString(), duration: values.duration }).unwrap();
      message.success('Lesson rescheduled.');
      setLessonToReschedule(null);
      rescheduleForm.resetFields();
    } catch { message.error('Could not reschedule this lesson.'); }
  };

  const confirmRemoveSession = (studentId: string, sessionId: string, sessionDescription?: string) => {
    Modal.confirm({
      title: 'Remove this session?',
      content: sessionDescription ? `"${sessionDescription}" will be removed. This cannot be undone.` : 'This session will be removed. This cannot be undone.',
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteSession(sessionId),
    });
  };

  const handleAddSession = (studentId: string) => {
    sessionForm.validateFields().then((values) => {
      const dateTime = values.dateTime ? dayjs(values.dateTime).toISOString() : new Date().toISOString();
      const duration = values.duration ?? '1h';
      const description = values.description ?? 'Session';
      createSession({ studentUserId: studentId, dateTime, duration, description, meetingLink: values.meetingLink });
      sessionForm.resetFields();
      setAddSessionOpen(false);
    }).catch(() => {});
  };

  const handleAddMilestone = () => {
    if (!selectedMilestoneStudentId) return;
    milestoneForm.validateFields().then((values) => {
      const date = values.date ? dayjs(values.date).format('YYYY-MM-DD') : null;
      createMilestone({ studentUserId: selectedMilestoneStudentId, label: values.label ?? 'New milestone', date });
      milestoneForm.resetFields();
      setAddMilestoneOpen(false);
    }).catch(() => {});
  };

  const handleMilestoneDoneToggle = (_studentId: string, milestoneId: string, done: boolean) => {
    updateMilestone({ id: milestoneId, done });
  };

  const confirmRemoveMilestone = (_studentId: string, milestone: MilestoneDto) => {
    Modal.confirm({
      title: 'Remove this milestone?',
      content: `"${milestone.label}" will be removed. This cannot be undone.`,
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteMilestone(milestone.id),
    });
  };

  const onPipelineFieldChange = (id: string, updates: Partial<Pick<PipelineDto, 'program' | 'stage' | 'status' | 'aid' | 'deadline'>>) => {
    if (updates.deadline !== undefined && updates.deadline !== null && typeof updates.deadline === 'string') {
      updatePipelineRow({ id, ...updates, deadline: updates.deadline });
    } else {
      updatePipelineRow({ id, ...updates });
    }
  };

  const confirmRemovePipelineRow = (row: PipelineDto) => {
    Modal.confirm({
      title: 'Remove this application?',
      content: `${row.student ?? 'Student'} (${row.program}) will be removed from the pipeline. You can add it again later.`,
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deletePipelineRow(row.id),
    });
  };

  const handleAddPipelineRow = (values: { student: string; program: string; stage?: string; status?: string; aid?: boolean; deadline?: unknown }) => {
    const studentUserId = values.student;
    const deadline = values.deadline ? dayjs(values.deadline as dayjs.Dayjs).format('YYYY-MM-DD') : null;
    createPipelineRow({
      studentUserId,
      program: values.program,
      stage: values.stage,
      status: values.status,
      aid: values.aid,
      deadline,
    });
    setAddPipelineOpen(false);
    pipelineForm.resetFields();
  };

  const openFeedbackModal = (r: TaskDto) => {
    setFeedbackModalTask(r);
    setFeedbackText(r.feedback ?? '');
  };

  const [uploadFeedbackFile] = useUploadMentorFeedbackFileMutation();

  const saveFeedback = async () => {
    if (!feedbackModalTask) return;
    const taskId = feedbackModalTask.id;
    const feedbackFileUrls: { fileName: string; url: string }[] = [];
    const files = feedbackFileList.map((f) => f.originFileObj).filter(Boolean) as File[];
    try {
      for (const file of files) {
        const res = await uploadFeedbackFile({ taskId, file }).unwrap();
        if (res?.data?.fileName && res?.data?.url) {
          feedbackFileUrls.push({ fileName: res.data.fileName, url: res.data.url });
        }
      }
    } catch {
      message.error('Failed to upload one or more feedback files.');
      return;
    }
    await updateTaskFeedback({ id: taskId, feedback: feedbackText, feedbackFileUrls }).unwrap();
    setFeedbackModalTask(null);
    setFeedbackText('');
    setFeedbackFileList([]);
  };

  const confirmRemoveTask = (r: TaskDto) => {
    Modal.confirm({
      title: 'Remove this task?',
      content: `"${r.task}" (${r.student ?? 'student'}) will be removed. This cannot be undone.`,
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteTask(r.id),
    });
  };

  const handleAssignTask = async (values: { title: string; student: string; deadline: unknown; description?: string; lessonId?: string }) => {
    const studentUserId = values.student;
    const deadline = values.deadline ? dayjs(values.deadline as dayjs.Dayjs).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    try {
      await createTask({ studentUserId, task: values.title, deadline, description: values.description, lessonId: values.lessonId }).unwrap();
      setAssignTaskOpen(false);
      form.resetFields();
      message.success('Task assigned.');
    } catch { message.error('Could not assign this task.'); }
  };

  const taskColumns = [
    { title: 'TASK', dataIndex: 'task', key: 'task', width: 200 },
    { title: 'STUDENT', dataIndex: 'student', key: 'student', width: 160 },
    { title: 'DEADLINE', dataIndex: 'deadline', key: 'deadline', width: 120, render: (d: string) => formatDeadline(d) },
    {
      title: 'STATUS',
      key: 'status',
      width: 140,
      render: (_: unknown, r: TaskDto) => {
        const status = getTaskStatus(r);
        return <Tag color={statusColors[status] ?? 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 320,
      render: (_: unknown, r: TaskDto) => (
        <Space size="middle" wrap align="center">
          {(r.submittedAt || r.submissionText || (r.submissionFileUrls?.length ?? 0) > 0) ? (
            <>
              <Button type="link" size="small" icon={<Eye size={16} />} onClick={() => setViewSubmissionTask(r)}>
                View submission
              </Button>
              {r.status === 'submitted' && <Button type="link" size="small" icon={<Pencil size={16} />} onClick={() => openFeedbackModal(r)}>
                Review
              </Button>}
            </>
          ) : (
            <span style={{ color: '#999', fontSize: 13 }}>Not submitted</span>
          )}
          <Button type="text" size="small" danger icon={<Trash2 size={16} />} onClick={() => confirmRemoveTask(r)} title="Remove task" />
        </Space>
      ),
    },
  ];

  return (
    <div className="full-support-page full-support-mentor">
      <Card className="full-support-header full-support-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ color: primary }}>Mentor Management</h1>
            <p style={{ marginBottom: 0 }}>Admissions and portfolio supervision: monitor student progress, log sessions, and track milestones.</p>
          </div>
        </div>
      </Card>

      <Card
        title={<><User size={16} style={{ marginRight: 8, color: primary }} />Student Roster</>}
        extra={<span style={{ color: '#666', fontSize: 13 }}>{roster.length} active students</span>}
        style={{ marginTop: 24 }}
        className="full-support-card"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {rosterLoading ? (
            <p style={{ color: '#666', gridColumn: '1 / -1' }}>Loading roster…</p>
          ) : roster.map((s) => {
            const used = s.used ?? 0;
            const allocated = s.allocated ?? 0;
            const count = s.sessionsCount ?? 0;
            const pct = allocated > 0 ? Math.round((used / allocated) * 100) : 0;
            return (
            <Card key={s.id} size="small" className="roster-card">
              <div style={{ marginBottom: 12 }}>
                <Button type="link" style={{ padding: 0, height: 'auto', fontWeight: 600, fontSize: 'inherit' }} onClick={() => setSelectedProgressStudent(s)}>
                  {s.name}
                </Button>
              </div>
              <Progress
                percent={pct}
                size="small"
                showInfo={false}
                strokeColor={primary}
              />
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {allocated > 0 ? `${used}h used / ${allocated}h allocated · ${Math.round((allocated - used) * 10) / 10}h left` : '0h used · No sessions scheduled'}
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{count} session{count !== 1 ? 's' : ''} created by mentor</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <Button
                  type="primary"
                  size="small"
                  icon={<Calendar size={16} />}
                  style={{ flex: 1, minWidth: 0, borderRadius: 8, backgroundColor: primary, borderColor: primary, fontSize: 12 }}
                  onClick={() => setSessionLogStudent(s)}
                >
                  Sessions
                </Button>
                <Button
                  type="primary"
                  size="small"
                  icon={<MessageCircle size={16} />}
                  style={{ flex: 1, minWidth: 0, borderRadius: 8, backgroundColor: primary, borderColor: primary, fontSize: 12 }}
                  onClick={async () => {
                    if (!currentUser?.id) return;
                    try {
                      const res = await findOrCreateConversation({ mentorId: currentUser.id, studentId: s.id }).unwrap();
                      const convId = res?.conversation?.id;
                      if (convId) {
                        setSelectedConversationId(convId);
                        setSelectedThreadId(null);
                        setFullSupportChatOpen(true);
                        setChatModalOpen(true);
                      }
                    } catch {
                      message.error('Could not open chat.');
                    }
                  }}
                >
                  Chat
                </Button>
              </div>
            </Card>
          );
          })}
        </div>
      </Card>

      {roster.length === 0 && !rosterLoading && (
        <p style={{ marginTop: 24, color: '#666' }}>No students assigned to you yet. Ask an admin to assign students from the Full Support Admin Dashboard.</p>
      )}

      <Modal
        title={`Full Support progress: ${selectedProgressStudent?.name ?? ''}`}
        open={!!selectedProgressStudent}
        onCancel={() => setSelectedProgressStudent(null)}
        footer={<Button type="primary" onClick={() => setSelectedProgressStudent(null)} style={{ backgroundColor: primary, borderColor: primary }}>Close</Button>}
        width={720}
        styles={{ body: { maxHeight: '75vh', overflow: 'auto' } }}
      >
        {selectedProgressStudent && (
          <div style={{ padding: '8px 0' }}>
            <p style={{ color: '#666', marginBottom: 16 }}>Track your mentorship sessions, applications, and deadlines.</p>
            <Card size="small" title={<><CalendarClock size={16} style={{ marginRight: 8, color: primary }} />Session timeline</>} style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>This month</span>
                  <span>{progressAllocatedHours > 0 ? `${progressUsedHours}h used / ${progressAllocatedHours}h allocated` : `${progressUsedHours}h used · No sessions scheduled`}</span>
                </div>
                <Progress percent={progressAllocatedHours > 0 ? Math.round((progressUsedHours / progressAllocatedHours) * 100) : 0} size="small" strokeColor={primary} showInfo={false} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {progressSessions.length === 0 ? (
                  <li style={{ color: '#666', fontSize: 13, padding: '8px 0' }}>No sessions logged yet.</li>
                ) : (
                  progressSessions.map((sess) => (
                    <li key={sess.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{dayjs(sess.dateTime).format('MMM D, YYYY h:mm A')}</div>
                        <div style={{ color: '#666', fontSize: 13, marginTop: 2 }}>{sess.description}</div>
                      </div>
                      <Tag color="blue">{sess.duration}</Tag>
                    </li>
                  ))
                )}
              </ul>
            </Card>
            <Card
              size="small"
              title={<><BarChart2 size={16} style={{ marginRight: 8, color: primary }} />Curriculum Watchlist</>}
              style={{ marginBottom: 16 }}
              extra={
                progressCurriculumWatchlist.some((i) => i.key === 'sat_prep') && selectedProgressStudent ? (
                  <Button type="link" size="small" onClick={() => {
                    const satItem = progressCurriculumWatchlist.find((i) => i.key === 'sat_prep');
                    setSatTargetValue(satItem?.target ?? 'Target: 1450+');
                    setEditSatTargetOpen(true);
                  }}>
                    Edit SAT target
                  </Button>
                ) : null
              }
            >
              {progressCurriculumWatchlist.length === 0 ? (
                <p style={{ color: '#666', fontSize: 13 }}>No curriculum items yet.</p>
              ) : (
                progressCurriculumWatchlist.map((item) => (
                  <div key={item.key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{item.label}</span>
                      <span>{item.percent}%</span>
                    </div>
                    <Progress percent={item.percent} size="small" strokeColor={primary} showInfo={false} />
                    {item.target && <div style={{ fontSize: 11, color: '#666' }}>{item.target}</div>}
                  </div>
                ))
              )}
            </Card>
            <Card size="small" title={<><FileText size={16} style={{ marginRight: 8, color: primary }} />Tasks from mentor</>} style={{ marginBottom: 16 }}>
              <Table
                dataSource={progressStudentTasks}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'TASK', dataIndex: 'task', key: 'task', width: 180 },
                  { title: 'DEADLINE', dataIndex: 'deadline', key: 'deadline', width: 110, render: (d: string) => d ? dayjs(d).format('MMM D, YYYY') : '-' },
                  { title: 'STATUS', key: 'status', width: 110, render: (_: unknown, r: TaskDto) => <Tag color={statusColors[getTaskStatus(r)] ?? 'default'}>{getTaskStatus(r)}</Tag> },
                ]}
              />
            </Card>
            <Card size="small" title={<><CheckCircle2 size={16} style={{ marginRight: 8, color: primary }} />Milestone Tracker</>} style={{ marginBottom: 16 }}>
              <p style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>Milestones for this student.</p>
              {progressMilestones.length === 0 ? (
                <p style={{ color: '#666', fontSize: 13 }}>No milestones yet.</p>
              ) : (
                progressMilestones.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <div><strong>{m.label}</strong></div>
                      {m.date && <span style={{ fontSize: 12, color: '#666' }}>{dayjs(m.date).format('MMM D, YYYY')}</span>}
                    </div>
                    {m.done ? <Tag color="green">Done</Tag> : <Tag>Pending</Tag>}
                  </div>
                ))
              )}
            </Card>
            <Card size="small" title={<><Globe size={16} style={{ marginRight: 8, color: primary }} />Application tracker</>} style={{ marginBottom: 8 }}>
              <Table
                dataSource={progressStudentPipeline}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'PROGRAM', dataIndex: 'program', key: 'program', width: 200 },
                  { title: 'STAGE', dataIndex: 'stage', key: 'stage', width: 120 },
                  { title: 'STATUS', dataIndex: 'status', key: 'status', width: 100, render: (st: string) => <Tag color={statusColors[st] ?? 'default'}>{st}</Tag> },
                  { title: 'FINANCIAL AID', dataIndex: 'aid', key: 'aid', width: 100, render: (v: boolean) => v ? <Tag color="green">Considering</Tag> : '-' },
                ]}
              />
            </Card>
            <Button
              type="link"
              size="small"
              loading={progressReportDownloading}
              onClick={async () => {
                if (!selectedProgressStudent) return;
                setProgressReportDownloading(true);
                try {
                  const res = await fetchWeeklyReport(selectedProgressStudent.id).unwrap();
                  if (res?.data) generateWeeklyReportPdf(res.data);
                  else message.error('Could not load report.');
                } catch {
                  message.error('Could not load report.');
                } finally {
                  setProgressReportDownloading(false);
                }
              }}
              style={{ marginTop: 12, padding: 0 }}
            >
              Download {selectedProgressStudent.name}&apos;s weekly report
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        open={editSatTargetOpen}
        title="Edit SAT target"
        onCancel={() => setEditSatTargetOpen(false)}
        onOk={async () => {
          if (!selectedProgressStudent) return;
          const satItem = progressCurriculumWatchlist.find((i) => i.key === 'sat_prep');
          const percent = satItem?.percent ?? 0;
          try {
            await setCurriculumItem({
              studentUserId: selectedProgressStudent.id,
              key: 'sat_prep',
              percent,
              target: satTargetValue.trim() || null,
            }).unwrap();
            message.success('SAT target updated.');
            setEditSatTargetOpen(false);
          } catch {
            message.error('Could not update SAT target.');
          }
        }}
        confirmLoading={settingCurriculumItem}
      >
        <p style={{ marginBottom: 8 }}>Set an encouraging SAT score target for this mentee (shown on their dashboard).</p>
        <Input
          value={satTargetValue}
          onChange={(e) => setSatTargetValue(e.target.value)}
          placeholder="Target: 1450+"
        />
      </Modal>

      <Card
        title={<><CheckCircle2 size={16} style={{ marginRight: 8, color: primary }} />Milestone Tracker</>}
        extra={
          <Space wrap>
            <Select
              value={selectedMilestoneStudentId}
              onChange={setSelectedMilestoneStudentId}
              options={roster.map((s) => ({ label: s.name, value: s.id }))}
              style={{ minWidth: 160 }}
            />
            <Button type="primary" size="small" icon={<Plus size={16} />} onClick={() => setAddMilestoneOpen(true)} style={{ backgroundColor: primary, borderColor: primary, borderRadius: 20, fontSize: 14, minHeight: 28 }}>
              Add milestone
            </Button>
          </Space>
        }
        style={{ marginTop: 24 }}
        className="full-support-card"
      >
        {currentMilestones.length === 0 ? (
          <p style={{ color: '#666' }}>No milestones yet. Add one for this student.</p>
        ) : (
          currentMilestones.map((m) => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <div><strong>{m.label}</strong></div>
                {m.date && <span style={{ fontSize: 12, color: '#666' }}>{dayjs(m.date).format('MMM D, YYYY')}</span>}
              </div>
              <Space align="center">
                {m.done ? <Tag color="green">Done</Tag> : <Tag>Pending</Tag>}
                <Switch
                  size="small"
                  checked={m.done}
                  onChange={(checked) => handleMilestoneDoneToggle(selectedMilestoneStudentId, m.id, checked)}
                />
                <Button type="text" size="small" danger icon={<Trash2 size={16} />} onClick={() => confirmRemoveMilestone(selectedMilestoneStudentId, m)} title="Remove milestone" />
              </Space>
            </div>
          ))
        )}
      </Card>

      <Card
        title={<><FileText size={16} style={{ marginRight: 8, color: primary }} />Task Assignment</>}
        extra={<Button type="primary" size="small" icon={<Plus size={16} />} onClick={() => setAssignTaskOpen(true)} style={{ backgroundColor: primary, borderColor: primary, borderRadius: 20, fontSize: 14, minHeight: 28 }}>Assign Task</Button>}
        style={{ marginTop: 24 }}
        className="full-support-card"
      >
        <Table dataSource={tasks} columns={taskColumns} rowKey="id" pagination={false} size="middle" className="task-assignment-table" />
      </Card>

      <Card
        title={<><Globe size={16} style={{ marginRight: 8, color: primary }} />Application Pipeline</>}
        extra={
          <Button type="primary" size="small" icon={<Plus size={16} />} onClick={() => setAddPipelineOpen(true)} style={{ backgroundColor: primary, borderColor: primary, borderRadius: 20, minHeight: 28 }}>
            Add application
          </Button>
        }
        style={{ marginTop: 24 }}
        className="full-support-card"
      >
        <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>Track each student&apos;s programs and scholarships. Edits save automatically.</p>
        <p style={{ color: '#999', fontSize: 12, marginBottom: 12 }}><strong>Stage</strong> = step in the process (Research → Essay Draft → Essay Review → Final Review → Submitted). <strong>Status</strong> = overall state (In Progress, Submitted, Accepted, Rejected).</p>
        <Table
          dataSource={pipelineRows}
          rowKey="id"
          pagination={false}
          size="middle"
          columns={[
            { title: 'STUDENT', dataIndex: 'student', key: 'student', width: 140 },
            {
              title: 'PROGRAM',
              dataIndex: 'program',
              key: 'program',
              width: 200,
              render: (val: string, row: PipelineDto) => (
                <Input
                  key={`${row.id}-${row.program}`}
                  defaultValue={val}
                  onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== row.program) onPipelineFieldChange(row.id, { program: v }); }}
                  placeholder="Program name"
                  size="small"
                  style={{ width: '100%' }}
                />
              ),
            },
            {
              title: 'STAGE',
              dataIndex: 'stage',
              key: 'stage',
              width: 140,
              render: (val: string, row: PipelineDto) => (
                <Select
                  value={val}
                  onChange={(v) => onPipelineFieldChange(row.id, { stage: v })}
                  options={PIPELINE_STAGES.map((s) => ({ label: s, value: s }))}
                  size="small"
                  style={{ width: '100%' }}
                />
              ),
            },
            {
              title: 'STATUS',
              dataIndex: 'status',
              key: 'status',
              width: 130,
              render: (val: string, row: PipelineDto) => (
                <Select
                  value={val}
                  onChange={(v) => onPipelineFieldChange(row.id, { status: v })}
                  options={PIPELINE_STATUSES.map((s) => ({ label: s, value: s }))}
                  size="small"
                  style={{ width: '100%' }}
                />
              ),
            },
            { title: 'DEADLINE', dataIndex: 'deadline', key: 'deadline', width: 110, render: (v: string | null) => v ? dayjs(v).format('MMM D, YYYY') : '-' },
            {
              title: 'FIN. AID',
              dataIndex: 'aid',
              key: 'aid',
              width: 90,
              render: (v: boolean, row: PipelineDto) => (
                <Select
                  value={v ? 'Yes' : 'No'}
                  onChange={(x) => onPipelineFieldChange(row.id, { aid: x === 'Yes' })}
                  options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]}
                  size="small"
                  style={{ width: 64 }}
                />
              ),
            },
            {
              title: '',
              key: 'actions',
              width: 70,
              render: (_: unknown, row: PipelineDto) => (
                <Button type="link" size="small" danger onClick={() => confirmRemovePipelineRow(row)}>
                  Remove
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Add application"
        open={addPipelineOpen}
        onCancel={() => { setAddPipelineOpen(false); pipelineForm.resetFields(); }}
        footer={null}
        width={400}
      >
        <Form form={pipelineForm} layout="vertical" onFinish={handleAddPipelineRow}>
          <Form.Item name="student" label="Student" rules={[{ required: true }]}>
            <Select placeholder="Select student" options={roster.map((s) => ({ label: s.name, value: s.id }))} />
          </Form.Item>
          <Form.Item name="program" label="Program / Scholarship" rules={[{ required: true }]}>
            <Input placeholder="e.g. Yale Young Global Scholars" />
          </Form.Item>
          <Form.Item name="stage" label="Stage" initialValue="Not Started">
            <Select options={PIPELINE_STAGES.map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="Not Started">
            <Select options={PIPELINE_STATUSES.map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="aid" label="Considering financial aid?" initialValue={false}>
            <Select options={[{ label: 'Yes', value: true }, { label: 'No', value: false }]} />
          </Form.Item>
          <Form.Item name="deadline" label="Deadline (optional)">
            <DatePicker style={{ width: '100%' }} format="MMM D, YYYY" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: primary, borderColor: primary }}>Add</Button>
            <Button style={{ marginLeft: 8 }} onClick={() => { setAddPipelineOpen(false); pipelineForm.resetFields(); }}>Cancel</Button>
          </Form.Item>
        </Form>
      </Modal>

      <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <Button type="default" icon={<FileText size={16} />} onClick={() => setWeeklyReportModalOpen(true)}>
          Students&apos; weekly report
        </Button>
        <Button type="primary" onClick={() => navigate('/')} style={{ backgroundColor: primary, borderColor: primary }}>Back to Home</Button>
      </div>

      <Modal
        title="Students' weekly report"
        open={weeklyReportModalOpen}
        onCancel={() => setWeeklyReportModalOpen(false)}
        footer={null}
        width={420}
      >
        <p style={{ color: '#666', marginBottom: 16 }}>Download a PDF weekly report for a student.</p>
        {roster.length === 0 ? (
          <p style={{ color: '#666' }}>No students assigned.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {roster.map((s) => (
              <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>{s.name}</span>
                <Button
                  type="primary"
                  size="small"
                  icon={<Download size={16} />}
                  loading={downloadingStudentId === s.id}
                  disabled={!!downloadingStudentId}
                  onClick={async () => {
                    setDownloadingStudentId(s.id);
                    try {
                      const res = await fetchWeeklyReport(s.id).unwrap();
                      if (res?.data) generateWeeklyReportPdf(res.data);
                      else message.error('Could not load report.');
                    } catch {
                      message.error('Could not load report.');
                    } finally {
                      setDownloadingStudentId(null);
                    }
                  }}
                  style={{ backgroundColor: primary, borderColor: primary }}
                >
                  Download PDF
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {chatModalOpen && (
        <ChatModal
          conversationId={selectedConversationId}
          threadId={selectedThreadId || undefined}
          open={chatModalOpen}
          onClose={() => { setChatModalOpen(false); setSelectedConversationId(null); setSelectedThreadId(null); setFullSupportChatOpen(false); }}
          openToGeneralConversation={fullSupportChatOpen}
          onConversationChange={setSelectedConversationId}
          onThreadChange={setSelectedThreadId}
        />
      )}

      {/* Session Log modal (per student) */}
      <Modal
        title={sessionLogStudent ? `${sessionLogStudent.initials} ${sessionLogStudent.name}: session log` : 'Session Log'}
        open={!!sessionLogStudent}
        onCancel={() => { setSessionLogStudent(null); setAddSessionOpen(false); sessionForm.resetFields(); }}
        footer={null}
        width={560}
      >
        {sessionLogStudent && (
          <div className="session-log-list">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" size="small" icon={<Plus size={16} />} onClick={() => setAddSessionOpen(true)} style={{ backgroundColor: primary, borderColor: primary, borderRadius: 20 }}>
                Add session
              </Button>
            </div>
            {addSessionOpen && (
              <div style={{ marginBottom: 16, border: '1px solid #f0f0f0', borderRadius: 8, padding: 16 }}>
                <Form form={sessionForm} layout="vertical" onFinish={() => handleAddSession(sessionLogStudent.id)}>
                  <Form.Item name="dateTime" label="Date & time" rules={[{ required: true }]}>
                    <DatePicker showTime format="MMM D, YYYY h:mm A" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="duration" label="Duration" initialValue="1h">
                    <Select options={[{ value: '0.5h', label: '0.5h' }, { value: '1h', label: '1h' }, { value: '1.5h', label: '1.5h' }, { value: '2h', label: '2h' }]} />
                  </Form.Item>
                  <Form.Item name="description" label="Description" rules={[{ required: true }]}>
                    <Input.TextArea placeholder="e.g. College list discussion" rows={2} />
                  </Form.Item>
                  <Form.Item name="meetingLink" label="Meeting link (optional)" rules={[{ type: 'url', message: 'Enter a valid URL' }]}>
                    <Input placeholder="https://meet.google.com/..." />
                  </Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" size="small" loading={createSessionLoading} style={{ backgroundColor: primary, borderColor: primary, borderRadius: 9999 }}>Save</Button>
                    <Button size="small" onClick={() => { setAddSessionOpen(false); sessionForm.resetFields(); }}>Cancel</Button>
                  </Space>
                </Form>
              </div>
            )}
            {sessionLogs.length === 0 && !addSessionOpen ? (
              <p style={{ color: '#666' }}>No sessions logged yet. Click &quot;Add session&quot; to log one.</p>
            ) : (
              sessionLogs.map((session) => (
                <div key={session.id} className="session-log-entry" style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{dayjs(session.dateTime).format('MMM D, YYYY h:mm A')}</div>
                      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Tag color={session.outcome === 'held' ? 'green' : session.outcome === 'scheduled' ? 'blue' : 'orange'}>
                          {session.outcome === 'scheduled' && dayjs(session.dateTime).isBefore(dayjs()) ? 'Awaiting record' : session.outcome.replaceAll('_', ' ')}
                        </Tag>
                        <span style={{ fontSize: 13, color: '#666' }}>{session.duration}</span>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 14 }}>{session.description}</div>
                      {session.outcome === 'held' && <div style={{ marginTop: 6, fontSize: 13 }}>Attendance: {session.attendance} · {session.actualDurationMinutes ?? Math.round(parseFloat(session.duration) * 60)} minutes</div>}
                      {session.sharedNotes && <p style={{ margin: '6px 0', fontSize: 13 }}>{session.sharedNotes}</p>}
                      {session.meetingLink && session.outcome === 'scheduled' && <a href={session.meetingLink} target="_blank" rel="noreferrer">Join lesson</a>}
                      {session.homework?.length > 0 && <div style={{ marginTop: 8, fontSize: 13 }}>
                        <strong>Homework</strong>
                        {session.homework.map((item) => <div key={item.id}>
                          {item.title} · {item.status.replaceAll('_', ' ')} · Due {dayjs(item.deadline).format('MMM D')}
                          {item.status === 'submitted' && <Button size="small" type="link" onClick={() => { const task = tasks.find((entry) => entry.id === item.id); if (task) openFeedbackModal(task); }}>Review</Button>}
                        </div>)}
                      </div>}
                    </div>
                    <Space align="center" wrap>
                      <Button size="small" onClick={() => { setLessonToRecord(session); recordForm.setFieldsValue({ outcome: session.outcome === 'scheduled' ? 'held' : session.outcome, attendance: session.attendance === 'late' ? 'late' : 'present', actualDurationMinutes: session.actualDurationMinutes ?? Math.round(parseFloat(session.duration) * 60), sharedNotes: session.sharedNotes }); }}>
                        {session.outcome === 'scheduled' ? 'Record lesson' : 'Edit record'}
                      </Button>
                      {session.outcome === 'scheduled' && <Button size="small" onClick={() => { setLessonToReschedule(session); rescheduleForm.setFieldsValue({ dateTime: dayjs(session.dateTime), duration: session.duration }); }}>Reschedule</Button>}
                      {session.outcome === 'scheduled' && <Button type="text" size="small" danger icon={<Trash2 size={16} />} onClick={() => confirmRemoveSession(sessionLogStudent.id, session.id, session.description)} title="Remove session" />}
                    </Space>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>

      <Modal title="Record lesson" open={!!lessonToRecord} onCancel={() => { setLessonToRecord(null); recordForm.resetFields(); }} footer={null} destroyOnClose>
        <Form form={recordForm} layout="vertical" onFinish={handleRecordLesson}>
          <Form.Item name="outcome" label="Lesson outcome" rules={[{ required: true }]}>
            <Select options={[{ value: 'held', label: 'Held' }, { value: 'student_no_show', label: 'Student no-show' }, { value: 'mentor_no_show', label: 'Mentor no-show' }, { value: 'cancelled', label: 'Cancelled' }]} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(previous, current) => previous.outcome !== current.outcome}>
            {({ getFieldValue }) => getFieldValue('outcome') === 'held' ? <>
              <Form.Item name="attendance" label="Student attendance" rules={[{ required: true }]}>
                <Select options={[{ value: 'present', label: 'Present' }, { value: 'late', label: 'Late' }]} />
              </Form.Item>
              <Form.Item name="actualDurationMinutes" label="Actual teaching minutes" rules={[{ required: true }, { type: 'number', min: 1, max: 480 }]}>
                <InputNumber min={1} max={480} style={{ width: '100%' }} />
              </Form.Item>
            </> : null}
          </Form.Item>
          <Form.Item name="sharedNotes" label="Notes shared with student">
            <Input.TextArea rows={3} maxLength={5000} placeholder="What was covered and what happens next?" />
          </Form.Item>
          <Form.Item name="existingTaskId" label="Link existing homework (optional)">
            <Select allowClear placeholder="Select a task" options={tasks.filter((task) => task.studentUserId === lessonToRecord?.studentUserId && (!task.lessonId || task.lessonId === lessonToRecord?.id)).map((task) => ({ value: task.id, label: `${task.task} · ${task.status.replaceAll('_', ' ')}` }))} />
          </Form.Item>
          <Form.Item name="homeworkTitle" label="Next homework (optional)"><Input placeholder="e.g. Revise university shortlist" /></Form.Item>
          <Form.Item noStyle shouldUpdate={(previous, current) => previous.homeworkTitle !== current.homeworkTitle}>
            {({ getFieldValue }) => getFieldValue('homeworkTitle')?.trim() ? <>
              <Form.Item name="homeworkDeadline" label="Homework deadline" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
              <Form.Item name="homeworkDescription" label="Instructions"><Input.TextArea rows={2} /></Form.Item>
            </> : null}
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={recordingLesson}>Save lesson record</Button>
        </Form>
      </Modal>

      <Modal title="Reschedule lesson" open={!!lessonToReschedule} onCancel={() => setLessonToReschedule(null)} footer={null} destroyOnClose>
        <Form form={rescheduleForm} layout="vertical" onFinish={handleRescheduleLesson}>
          <Form.Item name="dateTime" label="New date and time" rules={[{ required: true }]}><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="duration" label="Planned duration" rules={[{ required: true }]}><Select options={['0.5h', '1h', '1.5h', '2h'].map((value) => ({ value, label: value }))} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={reschedulingLesson}>Save new time</Button>
        </Form>
      </Modal>

      {/* Add Milestone modal */}
      <Modal
        title="Add milestone"
        open={addMilestoneOpen}
        onCancel={() => { setAddMilestoneOpen(false); milestoneForm.resetFields(); }}
        footer={null}
        width={400}
      >
        <Form form={milestoneForm} layout="vertical" onFinish={handleAddMilestone}>
          <Form.Item name="label" label="Milestone name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Month 1 Roadmap" />
          </Form.Item>
          <Form.Item name="date" label="Target date (optional)">
            <DatePicker style={{ width: '100%' }} format="MMM D, YYYY" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: primary, borderColor: primary }}>Add</Button>
            <Button style={{ marginLeft: 8 }} onClick={() => { setAddMilestoneOpen(false); milestoneForm.resetFields(); }}>Cancel</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Assign New Task"
        open={assignTaskOpen}
        onCancel={() => setAssignTaskOpen(false)}
        footer={null}
      >
        <p style={{ color: '#666', marginBottom: 16 }}>Create a task and assign it to a student.</p>
        <Form form={form} layout="vertical" onFinish={handleAssignTask}>
          <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Personal Statement Draft" />
          </Form.Item>
          <Form.Item name="student" label="Student" rules={[{ required: true }]}>
            <Select placeholder="Select student" onChange={() => form.setFieldValue('lessonId', undefined)} options={roster.map((s) => ({ label: s.name, value: s.id }))} />
          </Form.Item>
          <Form.Item name="lessonId" label="Related lesson (optional)">
            <Select allowClear disabled={!taskStudentId} placeholder="Choose a lesson" options={allSessions.filter((session) => session.studentUserId === taskStudentId).map((session) => ({ value: session.id, label: `${dayjs(session.dateTime).format('MMM D, YYYY')} · ${session.description}` }))} />
          </Form.Item>
          <Form.Item name="deadline" label="Deadline" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Description (optional)">
            <Input.TextArea placeholder="Instructions or notes for the student..." rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: primary, borderColor: primary }}>Assign</Button>
            <Button style={{ marginLeft: 8 }} onClick={() => { setAssignTaskOpen(false); form.resetFields(); }}>Cancel</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Task Feedback modal: Reviewed = read-only; Needs review/Pending = editable + Send */}
      <Modal
        title="Task Feedback"
        open={!!feedbackModalTask}
        onCancel={() => { setFeedbackModalTask(null); setFeedbackText(''); }}
        onOk={feedbackModalTask?.hasFeedback ? undefined : saveFeedback}
        okText={feedbackModalTask?.hasFeedback ? undefined : 'Send feedback to student'}
        cancelText={feedbackModalTask?.hasFeedback ? 'Close' : 'Cancel'}
        okButtonProps={feedbackModalTask?.hasFeedback ? undefined : { style: { backgroundColor: primary, borderColor: primary } }}
        footer={
          feedbackModalTask?.hasFeedback
            ? <Button type="primary" onClick={() => { setFeedbackModalTask(null); setFeedbackText(''); }} style={{ backgroundColor: primary, borderColor: primary }}>Close</Button>
            : undefined
        }
      >
        {feedbackModalTask && (
          <>
            {feedbackModalTask.hasFeedback ? (
              <>
                <p style={{ color: '#666', marginBottom: 12 }}>Feedback sent to the student:</p>
                <Input.TextArea value={feedbackModalTask.feedback ?? ''} rows={5} readOnly style={{ marginBottom: 16, background: '#fafafa' }} />
              </>
            ) : (
              <>
                <p style={{ color: '#666', marginBottom: 12 }}>Add review notes or assessment feedback for the student.</p>
                <Input.TextArea
                  placeholder="Write your feedback here..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={5}
                  style={{ marginBottom: 16 }}
                />
              </>
            )}
          </>
        )}
      </Modal>

      {/* View submission modal */}
      <Modal
        title={viewSubmissionTask ? `${viewSubmissionTask.task}: submission` : 'Submission'}
        open={!!viewSubmissionTask}
        onCancel={() => setViewSubmissionTask(null)}
        footer={<Button type="primary" onClick={() => setViewSubmissionTask(null)} style={{ backgroundColor: primary, borderColor: primary }}>Close</Button>}
      >
        {viewSubmissionTask?.submissionFileUrls && viewSubmissionTask.submissionFileUrls.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Submitted files</div>
            {viewSubmissionTask.submissionFileUrls.map((f, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <a
                  href={f.url.startsWith('http') ? f.url : `${hostName}${f.url}`}
                  download={f.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: primary }}
                >
                  {f.fileName}
                </a>
                <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>Download</span>
              </div>
            ))}
          </div>
        )}
        {viewSubmissionTask?.submissionText && (
          <p style={{ whiteSpace: 'pre-wrap' }}>{viewSubmissionTask.submissionText}</p>
        )}
        {viewSubmissionTask && !viewSubmissionTask.submissionText && (!viewSubmissionTask.submissionFileUrls || viewSubmissionTask.submissionFileUrls.length === 0) && (
          <p style={{ color: '#666' }}>No submission content yet.</p>
        )}
      </Modal>
    </div>
  );
}
