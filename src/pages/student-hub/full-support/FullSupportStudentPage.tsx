import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Alert, Modal, Input, Upload, Spin, message } from 'antd';
import {
  CheckCircle2,
  CalendarClock,
  FileText,
  Globe,
  Eye,
  Upload as UploadIcon,
  Rocket,
  ArrowUpRight,
  MessageCircle,
  Clock,
  LockKeyhole,
} from 'lucide-react';
import type { UploadFile } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { useStudentProfile } from 'src/hooks/useStudentHub';
import ChatModal from 'src/components/chat/ChatModal';
import { useFindOrCreateConversationMutation } from 'src/app/services/chat/chatApi';
import { hostName } from 'src/app/services/api/const';
import {
  useGetEnrollmentMeQuery,
  useGetMenteeTasksQuery,
  useSubmitMenteeTaskMutation,
  useUploadTaskSubmissionFileMutation,
  useGetMenteeMilestonesQuery,
  useGetMenteePipelineQuery,
  useGetMenteeSessionsQuery,
  useLazyGetWeeklyReportQuery,
  useGetMenteeSatProgressQuery,
  type TaskDto,
} from 'src/app/services/fullSupportApi';
import dayjs from 'src/lib/dayjs';
import { generateWeeklyReportPdf } from 'src/utils/fullSupportWeeklyReportPdf';
import { ApplicantPage } from '../applicant/ApplicantPage';
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

/** Map backend statuses → editorial pill modifier classes. */
function statusModifier(status: string): string {
  switch (status) {
    case 'Reviewed':
    case 'Done':
      return 'fseditorial__pill--done';
    case 'Needs review':
    case 'In-Process':
      return 'fseditorial__pill--progress';
    case 'Submitted':
      return 'fseditorial__pill--submitted';
    case 'Pending':
    default:
      return 'fseditorial__pill--pending';
  }
}

export default function FullSupportStudentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: enrollmentData, isLoading: enrollmentLoading } = useGetEnrollmentMeQuery();
  const isEnrolled = enrollmentData?.data?.enrolled ?? false;
  const { profile: studentProfile, isLoading: studentProfileLoading } = useStudentProfile();
  const isMastersGoal = studentProfile?.academicProfile?.targetDegree === 'master';
  const showSatPrep = !studentProfileLoading && !isMastersGoal;

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
    skip: !isEnrolled || !showSatPrep,
    pollingInterval: 60000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const satProgress = satProgressData?.data ?? null;

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
    const submissionText = parts.length
      ? parts.join('. ')
      : submissionFileUrls.length
        ? 'Files submitted.'
        : 'Submission sent.';
    try {
      await submitMenteeTask({
        id: taskId,
        submissionText,
        submissionFileUrls: submissionFileUrls.length ? submissionFileUrls : undefined,
      }).unwrap();
      message.success('Submission sent.');
    } catch {
      message.error('Failed to submit.');
      return;
    }
    setSubmitModalTask(null);
    setSubmitComment('');
    setSubmitFileList([]);
  };

  const openChatWithMentor = async () => {
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
  };

  if (enrollmentLoading) {
    return (
      <ApplicantPage title={t('fullSupport.studentTitle', 'Full Support Mentorship Program')}>
        <div className="fseditorial fseditorial--loading applicant-full-support-page applicant-panel">
          <Spin size="large" />
          <span className="fseditorial__loading-label">
            {t('fullSupport.checkingEnrollment', 'Loading your Full Support…')}
          </span>
        </div>
      </ApplicantPage>
    );
  }

  if (!isEnrolled) {
    return <FullSupportNotEnrolled />;
  }

  const mentorName = enrollmentData?.data?.mentorName ?? 'your mentor';
  const hasAssignedMentor = !!enrollmentData?.data?.mentorName;

  if (isEnrolled && !hasAssignedMentor) {
    return (
      <ApplicantPage
        title={t('fullSupport.studentTitle', 'Full Support Mentorship Program')}
        subtitle={t(
          'fullSupport.studentDashboardDesc',
          'Track your mentorship sessions, applications, and deadlines.',
        )}
      >
        <div className="fseditorial fseditorial--gated applicant-full-support-page">
          <div className="fseditorial__gated-card applicant-panel">
            <Alert
              type="info"
              showIcon
              message={t('fullSupport.waitingForMentorTitle', 'You’re enrolled')}
              description={
                <p style={{ marginBottom: 0 }}>
                  {t(
                    'fullSupport.waitingForMentorDesc',
                    'An admin will assign you a mentor soon. Your dashboard (sessions, tasks, milestones) will be available once a mentor is assigned.',
                  )}
                </p>
              }
            />
          </div>
        </div>
      </ApplicantPage>
    );
  }

  const sessionPct = allocatedHours > 0 ? Math.round((usedHours / allocatedHours) * 100) : 0;

  return (
    <ApplicantPage
      title={t('fullSupport.studentDashboardTitle', 'Full Support Mentorship Program')}
      subtitle={t(
        'fullSupport.studentDashboardDesc',
        'Track your mentorship sessions, applications, and deadlines.',
      )}
      actions={
        <>
          <button
            type="button"
            className="fseditorial__btn fseditorial__btn--primary"
            onClick={openChatWithMentor}
            disabled={!enrollmentData?.data?.mentorId}
          >
            <MessageCircle size={14} />
            Chat with {mentorName}
          </button>
          <button
            type="button"
            className="fseditorial__btn fseditorial__btn--ghost"
            onClick={async () => {
              try {
                const res = await fetchWeeklyReport(undefined).unwrap();
                if (res?.data) generateWeeklyReportPdf(res.data);
                else message.error('Could not load report.');
              } catch {
                message.error('Could not load report.');
              }
            }}
            disabled={weeklyReportLoading}
          >
            <FileText size={14} />
            {weeklyReportLoading ? 'Preparing…' : 'My weekly report'}
          </button>
        </>
      }
    >
      <div className="fseditorial applicant-full-support-page">

      {/* Session timeline and, for undergraduate applicants, SAT Prep. */}
      <div className={`fseditorial__row${showSatPrep ? ' fseditorial__row--two' : ''}`}>
        {/* Session timeline */}
        <section className="fseditorial__card applicant-panel">
          <div className="fseditorial__card-head">
            <div className="fseditorial__card-head-left">
              <CalendarClock size={16} />
              <h2 className="fseditorial__card-title">Session timeline</h2>
            </div>
            <span className="fseditorial__card-meta">This month</span>
          </div>
          <div className="fseditorial__card-body">
            <div className="fseditorial__hours">
              <div className="fseditorial__hours-figure">
                <span className="fseditorial__hours-num">{usedHours}h</span>
                <span className="fseditorial__hours-divider">/</span>
                <span className="fseditorial__hours-total">
                  {allocatedHours > 0 ? `${allocatedHours}h allocated` : 'No sessions scheduled'}
                </span>
              </div>
              <div className="fseditorial__bar">
                <div
                  className="fseditorial__bar-fill"
                  style={{ width: `${Math.min(100, sessionPct)}%` }}
                />
              </div>
            </div>

            <ul className="fseditorial__sessions">
              {menteeSessions.length === 0 ? (
                <li className="fseditorial__empty">No sessions logged yet.</li>
              ) : (
                menteeSessions.map((s) => (
                  <li key={s.id} className="fseditorial__session">
                    <div className="fseditorial__session-main">
                      <div className="fseditorial__session-date">
                        {dayjs(s.dateTime).format('MMM D, YYYY · h:mm A')}
                      </div>
                      {s.description && (
                        <div className="fseditorial__session-desc">{s.description}</div>
                      )}
                    </div>
                    <span className="fseditorial__session-duration">
                      <Clock size={12} />
                      {s.duration}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        {showSatPrep && (
        <section className="fseditorial__card applicant-panel">
          <div className="fseditorial__card-head">
            <div className="fseditorial__card-head-left">
              <Rocket size={16} />
              <h2 className="fseditorial__card-title">{t('fullSupport.satPrepTitle', 'SAT Prep')}</h2>
            </div>
          </div>
          <div className="fseditorial__card-body">
            <p className="fseditorial__lede">
              {t(
                'fullSupport.satPrepDescTopCoach',
                'Full Support includes TopCoach SAT prep: quizzes, flashcards, and lessons aligned to the digital SAT (rolling out in the app).',
              )}
            </p>
            {satProgress ? (
              <div className="fseditorial__sat-stats">
                <div className="fseditorial__stat">
                  <span className="fseditorial__stat-label">Lessons completed</span>
                  <span className="fseditorial__stat-value">
                    {satProgress.completedLessons}
                    <span className="fseditorial__stat-divider"> / {satProgress.totalLessons}</span>
                  </span>
                </div>
                <div className="fseditorial__stat">
                  <span className="fseditorial__stat-label">Overall progress</span>
                  <span className="fseditorial__stat-value">
                    {Math.round(satProgress.overallProgress)}%
                  </span>
                </div>
                {Array.isArray(satProgress.byCourse) && satProgress.byCourse.length > 0 && (
                  <div className="fseditorial__stat fseditorial__stat--wide">
                    <span className="fseditorial__stat-label">Breakdown</span>
                    <span className="fseditorial__stat-value fseditorial__stat-value--small">
                      {satProgress.byCourse
                        .filter((c) => c && c.courseName)
                        .map(
                          (c) =>
                            `${c.courseName.replace('SAT ', '')}: ${c.completedLessons} / ${c.totalLessons}`,
                        )
                        .join(' · ')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="fseditorial__muted">
                Your SAT progress will appear here once you start the course.
              </p>
            )}
            <button
              type="button"
              className="fseditorial__btn fseditorial__btn--primary"
              onClick={() => navigate('/learning?course=sat')}
            >
              <Rocket size={14} />
              {t('fullSupport.openSatPrepInHub', 'Open SAT prep in My Journey')}
            </button>
          </div>
        </section>
        )}
      </div>

      {/* Tasks from your mentor ─────────────────────────────────── */}
      <section className="fseditorial__card applicant-panel">
        <div className="fseditorial__card-head">
          <div className="fseditorial__card-head-left">
            <FileText size={16} />
            <h2 className="fseditorial__card-title">Tasks from your mentor</h2>
          </div>
          <button
            type="button"
            className="fseditorial__card-action"
            onClick={openChatWithMentor}
            disabled={!enrollmentData?.data?.mentorId}
          >
            Chat with {mentorName}
            <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="fseditorial__table">
          <div className="fseditorial__table-head">
            <span>Task</span>
            <span>Deadline</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {tasks.length === 0 ? (
            <div className="fseditorial__empty fseditorial__empty--row">
              No tasks yet — your mentor will assign them here.
            </div>
          ) : (
            tasks.map((r) => {
              const status = getTaskStatus(r);
              return (
                <div key={r.id} className="fseditorial__table-row">
                  <span className="fseditorial__table-cell fseditorial__table-cell--task">
                    {r.task}
                  </span>
                  <span className="fseditorial__table-cell fseditorial__table-cell--meta">
                    {formatDeadline(r.deadline)}
                  </span>
                  <span className="fseditorial__table-cell">
                    <span className={`fseditorial__pill ${statusModifier(status)}`}>{status}</span>
                  </span>
                  <span className="fseditorial__table-cell">
                    {r.hasFeedback ? (
                      <button
                        type="button"
                        className="fseditorial__link"
                        onClick={() => setFeedbackModalTask(r)}
                      >
                        <Eye size={14} /> View feedback
                      </button>
                    ) : r.submissionText ? (
                      <span className="fseditorial__muted-row">Awaiting mentor feedback</span>
                    ) : (
                      <button
                        type="button"
                        className="fseditorial__link"
                        onClick={() => {
                          setSubmitModalTask(r);
                          setSubmitComment('');
                          setSubmitFileList([]);
                        }}
                      >
                        <UploadIcon size={14} /> Upload submission
                      </button>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Bottom row: Milestones + Applications ──────────────────── */}
      <div className="fseditorial__row fseditorial__row--two">
        {/* Milestones */}
        <section className="fseditorial__card applicant-panel">
          <div className="fseditorial__card-head">
            <div className="fseditorial__card-head-left">
              <CheckCircle2 size={16} />
              <h2 className="fseditorial__card-title">Milestone tracker</h2>
            </div>
          </div>
          <div className="fseditorial__card-body">
            <p className="fseditorial__lede">Your mentor tracks these milestones for you.</p>
            {menteeMilestones.length === 0 ? (
              <div className="fseditorial__empty">No milestones yet.</div>
            ) : (
              <ul className="fseditorial__milestones">
                {menteeMilestones.map((m) => (
                  <li key={m.id} className="fseditorial__milestone">
                    <div className="fseditorial__milestone-main">
                      <div className="fseditorial__milestone-label">{m.label}</div>
                      {m.date && (
                        <div className="fseditorial__milestone-date">
                          {dayjs(m.date).format('MMM D, YYYY')}
                        </div>
                      )}
                    </div>
                    <span
                      className={`fseditorial__pill ${
                        m.done ? 'fseditorial__pill--done' : 'fseditorial__pill--pending'
                      }`}
                    >
                      {m.done ? 'Done' : 'Pending'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Applications */}
        <section className="fseditorial__card applicant-panel">
          <div className="fseditorial__card-head">
            <div className="fseditorial__card-head-left">
              <Globe size={16} />
              <h2 className="fseditorial__card-title">Application tracker</h2>
            </div>
          </div>
          <div className="fseditorial__table fseditorial__table--applications">
            <div className="fseditorial__table-head">
              <span>Program</span>
              <span>Stage</span>
              <span>Status</span>
              <span>Aid</span>
            </div>
            {menteePipeline.length === 0 ? (
              <div className="fseditorial__empty fseditorial__empty--row">
                No applications tracked yet.
              </div>
            ) : (
              menteePipeline.map((p: any) => (
                <div key={p.id} className="fseditorial__table-row">
                  <span className="fseditorial__table-cell fseditorial__table-cell--task">
                    {p.program}
                  </span>
                  <span className="fseditorial__table-cell fseditorial__table-cell--meta">
                    {p.stage}
                  </span>
                  <span className="fseditorial__table-cell">
                    <span className={`fseditorial__pill ${statusModifier(p.status)}`}>
                      {p.status}
                    </span>
                  </span>
                  <span className="fseditorial__table-cell">
                    {p.aid ? (
                      <span className="fseditorial__pill fseditorial__pill--soft">Considering</span>
                    ) : (
                      <span className="fseditorial__muted-row">—</span>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Modals (kept as AntD; styling follows global brand) ────── */}
      {chatModalOpen && (
        <ChatModal
          conversationId={selectedConversationId}
          threadId={selectedThreadId || undefined}
          open={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false);
            setSelectedConversationId(null);
            setSelectedThreadId(null);
            setFullSupportChatOpen(false);
          }}
          openToGeneralConversation={fullSupportChatOpen}
          onConversationChange={setSelectedConversationId}
          onThreadChange={setSelectedThreadId}
        />
      )}

      <Modal
        title="Task Feedback"
        open={!!feedbackModalTask}
        onCancel={() => setFeedbackModalTask(null)}
        footer={
          <Button
            type="primary"
            onClick={() => setFeedbackModalTask(null)}
            style={{ backgroundColor: '#7B1F2F', borderColor: '#7B1F2F' }}
          >
            Close
          </Button>
        }
      >
        {feedbackModalTask?.hasFeedback && (
          <>
            <p style={{ color: '#6b6258', marginBottom: 12 }}>Feedback from your mentor:</p>
            <div
              style={{
                background: '#faf8f3',
                border: '1px solid #e5e3da',
                padding: 12,
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                marginBottom: 12,
              }}
            >
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
                      style={{ color: '#7B1F2F' }}
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
        onCancel={() => {
          setSubmitModalTask(null);
          setSubmitComment('');
          setSubmitFileList([]);
        }}
        onOk={handleSubmitTask}
        okText="Send"
        cancelText="Cancel"
        okButtonProps={{ style: { backgroundColor: '#7B1F2F', borderColor: '#7B1F2F' } }}
      >
        {submitModalTask && (
          <>
            <p style={{ color: '#6b6258', marginBottom: 12 }}>
              Upload your work and add an optional comment for your mentor.
            </p>
            <Upload
              fileList={submitFileList}
              onChange={({ fileList }) => setSubmitFileList(fileList.slice(-3))}
              beforeUpload={() => false}
              maxCount={3}
              style={{ marginBottom: 40 }}
            >
              <Button icon={<UploadIcon size={16} />} style={{ marginBottom: 4 }}>
                Upload file
              </Button>
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
    </ApplicantPage>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Not-yet-enrolled view.
//
// Important: Community enrollment does NOT grant Full Support. Full
// Support is a separate, admin-managed program (12-month intensive
// mentorship). Even community-subscribed users land on this page if
// they haven't been individually enrolled by an admin. Surfacing a
// marketing-style overview was misleading — students read it as if
// they were already inside. Keep this as a short, honest contact
// notice with one clear next step.
// ─────────────────────────────────────────────────────────────────────

const PROGRAMS_PAGE_URL = 'https://topcoachuni.com/programs';
const SUPPORT_EMAIL = 'support@topcoach.uz';

/**
 * Compact editorial "not enrolled" card. One card, centered, ~520px
 * max — readable in a single scroll without the page feeling empty.
 * Replaces the wide magazine spread which was looking broken at narrow
 * widths and too sparse at desktop.
 */
function FullSupportNotEnrolled() {
  const { t } = useTranslation();

  return (
    <ApplicantPage
      title={t('fullSupport.studentTitle', 'Full Support Mentorship Program')}
      subtitle={t(
        'fullSupport.notEnrolledSubtitle',
        'A year-long admissions mentorship with individual guidance and weekly check-ins.',
      )}
    >
      <div className="fseditorial fseditorial--gated applicant-full-support-page">
      <section className="fseditorial__access-lock applicant-panel" aria-labelledby="full-support-lock-title">
        <div className="fseditorial__access-preview" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="fseditorial__access-content">
          <span className="fseditorial__access-icon">
            <LockKeyhole size={20} aria-hidden />
          </span>
          <p className="fseditorial__eyebrow">Full Support · Mentorship</p>
          <h2 id="full-support-lock-title" className="fseditorial__access-title">
          You're not enrolled in Full Support yet.
          </h2>
          <p className="fseditorial__access-copy">
          Full Support is a separate, year-long admissions mentorship —{' '}
          <em>not</em> included with Community. Pairing, essay reviews, and
          weekly check-ins are admitted by application; the team reviews
          every request individually.
          </p>
          <div className="fseditorial__access-actions">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Full%20Support%20Mentorship%20Program`}
              className="fseditorial__btn fseditorial__btn--primary"
            >
              <MessageCircle size={14} />
              Write to {SUPPORT_EMAIL}
            </a>
            <a href={PROGRAMS_PAGE_URL} target="_blank" rel="noreferrer noopener" className="fseditorial__btn fseditorial__btn--ghost">
              Read the full program
              <ArrowUpRight size={14} />
            </a>
          </div>
          <p className="fseditorial__access-note">
            {t('fullSupport.notEnrolledFooter', 'A short note works — tell us your grade and target year. We reply within a working day.')}
          </p>
        </div>
      </section>
      </div>
    </ApplicantPage>
  );
}
