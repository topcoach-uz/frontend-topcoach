import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Table, Tag, Progress, Modal, Input, Upload, Spin, message } from 'antd';
import { CheckCircle2, CalendarClock, FileText, Globe, Eye, Upload as UploadIcon, BarChart2, Rocket } from 'lucide-react';
import type { UploadFile } from 'antd';
import { useTranslation } from 'react-i18next';
import useColors from 'src/hooks/useColors';
import { useTypedSelector } from 'src/app/store';
import ChatModal from 'src/components/chat/ChatModal';
import { useFindOrCreateConversationMutation } from 'src/app/services/chat/chatApi';
import { hostName } from 'src/app/services/api/const';
import { useGetEnrollmentMeQuery, useGetMenteeTasksQuery, useSubmitMenteeTaskMutation, useUploadTaskSubmissionFileMutation, useGetMenteeMilestonesQuery, useGetMenteePipelineQuery, useGetMenteeSessionsQuery, useLazyGetWeeklyReportQuery, useGetMenteeSatProgressQuery, type TaskDto } from 'src/app/services/fullSupportApi';
import dayjs from 'src/lib/dayjs';
import { generateWeeklyReportPdf } from 'src/utils/fullSupportWeeklyReportPdf';
import '../../full-support/full-support.scss';

function getTaskStatus(r: TaskDto): string {
  if (r.hasFeedback) return 'Reviewed';
  if (r.submissionText) return 'Needs review';
  return 'Pending';
}

function formatDeadline(isoDate: string): string {
  if (!isoDate) return '';
  return dayjs(isoDate).format('MMM D, YYYY');
}

const statusColors: Record<string, string> = {
  Pending: 'default',
  'Needs review': 'orange',
  Reviewed: 'green',
  'In-Process': 'orange',
  Submitted: 'blue',
};

export default function FullSupportStudentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const colors = useColors();
  const primary = colors?.colorPrimary ?? '#8b0000';
  const { data: enrollmentData, isLoading: enrollmentLoading } = useGetEnrollmentMeQuery();
  const isEnrolled = enrollmentData?.data?.enrolled ?? false;

  const { data: tasksData } = useGetMenteeTasksQuery(undefined, { skip: !isEnrolled });
  const tasks: TaskDto[] = tasksData?.data ?? [];
  const [submitMenteeTask] = useSubmitMenteeTaskMutation();
  const [uploadTaskFile] = useUploadTaskSubmissionFileMutation();
  const [feedbackModalTask, setFeedbackModalTask] = useState<TaskDto | null>(null);
  const [submitModalTask, setSubmitModalTask] = useState<TaskDto | null>(null);
  const [submitComment, setSubmitComment] = useState('');
  const [submitFileList, setSubmitFileList] = useState<UploadFile[]>([]);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [fullSupportChatOpen, setFullSupportChatOpen] = useState(false);
  const currentUser = useTypedSelector((state) => state.auth.profile);
  const [findOrCreateConversation] = useFindOrCreateConversationMutation();
  const { data: milestonesData } = useGetMenteeMilestonesQuery(undefined, { skip: !isEnrolled });
  const menteeMilestones = milestonesData?.data ?? [];
  const { data: pipelineData } = useGetMenteePipelineQuery(undefined, { skip: !isEnrolled });
  const menteePipeline = pipelineData?.data ?? [];
  const { data: sessionsData } = useGetMenteeSessionsQuery(undefined, { skip: !isEnrolled });
  const menteeSessions = sessionsData?.data?.sessions ?? [];
  const usedHours = sessionsData?.data?.usedHours ?? 0;
  const allocatedHours = sessionsData?.data?.allocatedHours ?? 0;
  const [fetchWeeklyReport, { isLoading: weeklyReportLoading }] = useLazyGetWeeklyReportQuery();
  const { data: satProgressData } = useGetMenteeSatProgressQuery(undefined, {
    skip: !isEnrolled,
    pollingInterval: 60000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const satProgress = satProgressData?.data ?? null;

  const taskColumns = [
    { title: 'TASK', dataIndex: 'task', key: 'task', width: 200 },
    { title: 'DEADLINE', dataIndex: 'deadline', key: 'deadline', width: 120, render: (d: string) => formatDeadline(d) },
    {
      title: 'STATUS',
      key: 'status',
      width: 120,
      render: (_: unknown, r: TaskDto) => {
        const status = getTaskStatus(r);
        return <Tag color={statusColors[status] ?? 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 160,
      render: (_: unknown, r: TaskDto) => {
        if (r.hasFeedback) {
          return (
            <Button type="link" size="small" icon={<Eye size={16} />} onClick={() => setFeedbackModalTask(r)}>
              View feedback
            </Button>
          );
        }
        if (r.submissionText) return <span style={{ color: '#666', fontSize: 13 }}>Awaiting mentor feedback</span>;
        return (
          <Button type="link" size="small" icon={<UploadIcon size={16} />} onClick={() => { setSubmitModalTask(r); setSubmitComment(''); setSubmitFileList([]); }}>
            Upload submission
          </Button>
        );
      },
    },
  ];

  const handleSubmitTask = async () => {
    if (!submitModalTask) return;
    const taskId = submitModalTask.id;
    const submissionFileUrls: { fileName: string; url: string }[] = [];
    const files = submitFileList.map((f) => f.originFileObj).filter(Boolean) as File[];
    try {
      for (const file of files) {
        const res = await uploadTaskFile({ taskId, file }).unwrap();
        if (res?.data?.fileName && res?.data?.url) {
          submissionFileUrls.push({ fileName: res.data.fileName, url: res.data.url });
        }
      }
    } catch (e) {
      message.error('Failed to upload one or more files.');
      return;
    }
    const fileNames = submitFileList.map((f) => f.name).filter(Boolean).join(', ');
    const parts = [submitComment.trim(), fileNames].filter(Boolean);
    const submissionText = parts.length ? parts.join('. ') : (submissionFileUrls.length ? 'Files submitted.' : 'Submission sent.');
    try {
      await submitMenteeTask({ id: taskId, submissionText, submissionFileUrls: submissionFileUrls.length ? submissionFileUrls : undefined }).unwrap();
      message.success('Submission sent.');
    } catch {
      message.error('Failed to submit.');
      return;
    }
    setSubmitModalTask(null);
    setSubmitComment('');
    setSubmitFileList([]);
  };

  if (enrollmentLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          gap: 16,
        }}
      >
        <Spin size="large" />
        <span style={{ color: '#666', fontSize: 14 }}>
          {t('fullSupport.checkingEnrollment', 'Loading your Full Support…')}
        </span>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
        <Card>
          <h1 style={{ marginBottom: 16 }}>{t('fullSupport.studentTitle', 'Full Support Mentorship Program')}</h1>
          <Alert
            type="info"
            showIcon
            message={t('fullSupport.enrollFirstTitle', "Full Support isn't active on your account yet")}
            description={
              <>
                <p style={{ marginBottom: 12 }}>
                  {t(
                    'fullSupport.onlyAdminEnrollDesc',
                    "The Full Support Mentorship Program is available after enrollment. If you'd like to join or have questions, email our team at support@topcoach.uz and we'll walk you through the next steps.",
                  )}
                </p>
                <p style={{ color: '#666', fontSize: 13, marginBottom: 0 }}>
                  {t(
                    'fullSupport.contactAdmin',
                    'Prefer email? Reach us at support@topcoach.uz. Include your TopCoach account email if you have one so we can assist you faster.',
                  )}
                </p>
              </>
            }
          />
        </Card>
      </div>
    );
  }

  const mentorName = enrollmentData?.data?.mentorName ?? 'your mentor';
  const hasAssignedMentor = !!enrollmentData?.data?.mentorName;

  if (isEnrolled && !hasAssignedMentor) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
        <Card>
          <h1 style={{ marginBottom: 16 }}>{t('fullSupport.studentTitle', 'Full Support Mentorship Program')}</h1>
          <Alert
            type="info"
            showIcon
            message={t('fullSupport.waitingForMentorTitle', 'You’re enrolled')}
            description={
              <p style={{ marginBottom: 0 }}>
                {t('fullSupport.waitingForMentorDesc', 'An admin will assign you a mentor soon. Your dashboard (sessions, tasks, milestones) will be available once a mentor is assigned.')}
              </p>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="full-support-page full-support-student student-hub-page">
      <div style={{ marginBottom: 24 }}>
        <h1 className="student-hub-page-title">{t('fullSupport.studentDashboardTitle', 'Full Support Mentorship Program')}</h1>
        <p className="student-hub-page-subtitle" style={{ marginTop: 8 }}>
          {t('fullSupport.studentDashboardDesc', 'Track your mentorship sessions, applications, and deadlines.')}
        </p>
      </div>

      <div className="full-support-timeline-watchlist-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        <Card
          title={<><CalendarClock size={16} style={{ marginRight: 8, color: primary }} />Session timeline</>}
          className="full-support-card"
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>This month</span>
              <span>{allocatedHours > 0 ? `${usedHours}h used / ${allocatedHours}h allocated` : `${usedHours}h used · No sessions scheduled`}</span>
            </div>
            <Progress percent={allocatedHours > 0 ? Math.round((usedHours / allocatedHours) * 100) : 0} size="small" strokeColor={primary} showInfo={false} />
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {menteeSessions.length === 0 ? (
              <li style={{ color: '#666', fontSize: 13, padding: '8px 0' }}>No sessions logged yet.</li>
            ) : (
              menteeSessions.map((s) => (
                <li key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{dayjs(s.dateTime).format('MMM D, YYYY h:mm A')}</div>
                    <div style={{ color: '#666', fontSize: 13, marginTop: 2 }}>{s.description}</div>
                  </div>
                  <Tag color="blue">{s.duration}</Tag>
                </li>
              ))
            )}
          </ul>
        </Card>
        <Card
          title={<><Rocket size={16} style={{ marginRight: 8, color: primary }} />{t('fullSupport.satPrepTitle', 'SAT Prep')}</>}
          className="full-support-card"
        >
          <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
            {t(
              'fullSupport.satPrepDescTopCoach',
              'Full Support includes TopCoach SAT prep: quizzes, flashcards, and lessons aligned to the digital SAT (rolling out in the app).',
            )}
          </p>
          {satProgress ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Lessons completed</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {satProgress.completedLessons} / {satProgress.totalLessons}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Overall progress</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{Math.round(satProgress.overallProgress)}%</div>
              </div>
              {Array.isArray(satProgress.byCourse) && satProgress.byCourse.length > 0 && (
                <div style={{ minWidth: 240 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Breakdown</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {satProgress.byCourse
                      .filter((c) => c && c.courseName)
                      .map((c) => `${c.courseName.replace('SAT ', '')}: ${c.completedLessons} / ${c.totalLessons}`)
                      .join(' · ')}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#666', fontSize: 12, marginBottom: 16 }}>Your SAT progress will appear here once you start the course.</p>
          )}
          <Button
            type="primary"
            icon={<Rocket size={16} />}
            onClick={() => navigate('/student-hub?section=sat-course')}
            style={{ backgroundColor: primary, borderColor: primary }}
          >
            {t('fullSupport.openSatPrepInHub', 'Open SAT prep in My Journey')}
          </Button>
        </Card>
      </div>

      <Card
        title={
          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span><FileText size={16} style={{ marginRight: 8, color: primary }} />Tasks from your mentor</span>
            <Button
              type="primary"
              disabled={!enrollmentData?.data?.mentorId}
              onClick={async () => {
                const mentorId = enrollmentData?.data?.mentorId;
                if (!currentUser?.id || !mentorId) return;
                try {
                  const res = await findOrCreateConversation({ mentorId, studentId: currentUser.id }).unwrap();
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
              style={{ backgroundColor: primary, borderColor: primary }}
            >
              Chat with {mentorName}
            </Button>
          </span>
        }
        className="full-support-card"
        style={{ marginTop: 24 }}
      >
        <Table
          dataSource={tasks}
          columns={taskColumns}
          rowKey="id"
          pagination={false}
          size="middle"
          className="task-assignment-table"
        />
      </Card>

      <Card
        title={<><CheckCircle2 size={16} style={{ marginRight: 8, color: primary }} />Milestone Tracker</>}
        className="full-support-card"
        style={{ marginTop: 24 }}
      >
        <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>Your mentor tracks these milestones for you.</p>
        {menteeMilestones.map((m) => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div>
              <div><strong>{m.label}</strong></div>
              {m.date && <span style={{ fontSize: 12, color: '#666' }}>{dayjs(m.date).format('MMM D, YYYY')}</span>}
            </div>
            {m.done ? <Tag color="green">Done</Tag> : <Tag>Pending</Tag>}
          </div>
        ))}
      </Card>

      <Card
        title={<><Globe size={16} style={{ marginRight: 8, color: primary }} />Application tracker</>}
        className="full-support-card"
        style={{ marginTop: 24 }}
      >
        <Table
          dataSource={menteePipeline}
          rowKey="id"
          pagination={false}
          size="middle"
          className="task-assignment-table"
          columns={[
            { title: 'PROGRAM', dataIndex: 'program', key: 'program', width: 220 },
            { title: 'STAGE', dataIndex: 'stage', key: 'stage', width: 140 },
            {
              title: 'STATUS',
              dataIndex: 'status',
              key: 'status',
              width: 120,
              render: (s: string) => <Tag color={statusColors[s] ?? 'default'}>{s}</Tag>,
            },
            { title: 'FINANCIAL AID', dataIndex: 'aid', key: 'aid', width: 120, render: (v: boolean) => v ? <Tag color="green">Considering</Tag> : '-' },
          ]}
        />
      </Card>

      <div style={{ marginTop: 24 }}>
        <Button
          type="primary"
          loading={weeklyReportLoading}
          onClick={async () => {
            try {
              const res = await fetchWeeklyReport(undefined).unwrap();
              if (res?.data) generateWeeklyReportPdf(res.data);
              else message.error('Could not load report.');
            } catch {
              message.error('Could not load report.');
            }
          }}
          style={{ backgroundColor: primary, borderColor: primary }}
        >
          My weekly report
        </Button>
      </div>

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

      <Modal
        title="Task Feedback"
        open={!!feedbackModalTask}
        onCancel={() => setFeedbackModalTask(null)}
        footer={<Button type="primary" onClick={() => setFeedbackModalTask(null)} style={{ backgroundColor: primary, borderColor: primary }}>Close</Button>}
      >
        {feedbackModalTask?.hasFeedback && (
          <>
            <p style={{ color: '#666', marginBottom: 12 }}>Feedback from your mentor:</p>
            <div style={{ background: '#fafafa', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              {feedbackModalTask.feedback}
            </div>
            {feedbackModalTask.feedbackFileUrls && feedbackModalTask.feedbackFileUrls.length > 0 && (
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>Attached files</div>
                {feedbackModalTask.feedbackFileUrls.map((f, idx) => (
                  <div key={idx} style={{ marginBottom: 6 }}>
                    <a
                      href={f.url.startsWith('http') ? f.url : `${hostName}${f.url}`}
                      download={f.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: primary }}
                    >
                      {f.fileName}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal
        title={submitModalTask ? `Submit: ${submitModalTask.task}` : 'Submit task'}
        open={!!submitModalTask}
        onCancel={() => { setSubmitModalTask(null); setSubmitComment(''); setSubmitFileList([]); }}
        onOk={handleSubmitTask}
        okText="Send"
        cancelText="Cancel"
        okButtonProps={{ style: { backgroundColor: primary, borderColor: primary } }}
      >
        {submitModalTask && (
          <>
            <p style={{ color: '#666', marginBottom: 12 }}>Upload your work and add an optional comment for your mentor.</p>
            <Upload
              fileList={submitFileList}
              onChange={({ fileList }) => setSubmitFileList(fileList.slice(-3))}
              beforeUpload={() => false}
              maxCount={3}
              style={{ marginBottom: 40 }}
            >
              <Button icon={<UploadIcon size={16} />} style={{ marginBottom: 4 }}>Upload file</Button>
            </Upload>
            <Input.TextArea
              placeholder="Add a comment (optional)"
              value={submitComment}
              onChange={(e) => setSubmitComment(e.target.value)}
              rows={3}
              style={{ marginTop: 4, marginBottom: 8 }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
