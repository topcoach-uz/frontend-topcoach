import { SessionRecording } from "src/components/session-recording/SessionRecording";
import { FullSupportPaymentGate } from './FullSupportPaymentGate';
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Alert, Spin, message } from "antd";
import {
  CalendarClock,
  CheckCircle2,
  ArrowUpRight,
  MessageCircle,
  Clock,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTypedSelector } from "src/app/store";
import ChatModal from "src/components/chat/ChatModal";
import { useFindOrCreateConversationMutation } from "src/app/services/chat/chatApi";
import {
  useGetEnrollmentMeQuery,
  useGetMenteeTasksQuery,
  useGetMenteeMilestonesQuery,
  useGetMenteeSessionsQuery,
  useLazyGetWeeklyReportQuery,
  type SessionLogDto,
  type TaskDto,
  type MilestoneDto,
} from "src/app/services/fullSupportApi";
import dayjs from "src/lib/dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import { generateWeeklyReportPdf } from "src/utils/fullSupportWeeklyReportPdf";
import { ApplicantPage } from "../applicant/ApplicantPage";
import { applicantLinks } from "src/lib/applicantWorkspace";
import {
  lessonLabel,
  mentorTaskLink,
  nextLesson,
  nextTasks,
  plannedMinutes,
} from "./fullSupportOverviewModel";
import "../../full-support/full-support.scss";
import "./fullSupportOverview.scss";

export type FullSupportOverviewProps = {
  mentorName?: string;
  sessions: SessionLogDto[];
  tasks: TaskDto[];
  milestones: MilestoneDto[];
  usedHours: number;
  sessionsLoading?: boolean;
  sessionsError?: boolean;
  tasksLoading?: boolean;
  tasksError?: boolean;
  milestonesLoading?: boolean;
  milestonesError?: boolean;
  onRetrySessions?: () => unknown;
  onRetryTasks?: () => unknown;
  onRetryMilestones?: () => unknown;
  onChat?: () => unknown;
  onReport?: () => unknown;
  reportLoading?: boolean;
  now?: number;
};
const formatDate = (date: string) =>
  dayjs(date).tz("Asia/Tashkent").format("D MMM YYYY · HH:mm");
const taskLabels: Record<TaskDto["status"], string> = {
  assigned: "To do",
  revision_requested: "Revision requested",
  submitted: "Waiting for review",
  approved: "Approved",
};

export function FullSupportOverview({
  mentorName,
  sessions,
  tasks,
  milestones,
  usedHours,
  onChat,
  onReport,
  reportLoading,
  now = Date.now(),
  ...state
}: FullSupportOverviewProps) {
  const next = nextLesson(sessions, now);
  const history = sessions
    .filter((s) => s.id !== next?.id)
    .sort((a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime));
  const previews = nextTasks(tasks);
  return (
    <ApplicantPage
      title="Full Support"
      subtitle="Your mentoring sessions, next steps, and shared progress."
      actions={
        <>
          {onReport && (
            <Button loading={reportLoading} onClick={onReport}>
              My report
            </Button>
          )}
        </>
      }
    >
      <div className="fs-overview">
        {!mentorName && (
          <Alert
            showIcon
            type="info"
            message="You’re enrolled — mentor assignment pending"
            description="Your lessons, tasks, and previous notes remain available here while a mentor is assigned."
          />
        )}
        <div className="fs-overview__top">
          <section
            className="applicant-panel fs-overview__next"
            aria-label="Next mentoring lesson"
          >
            <div className="fs-overview__eyebrow">
              <CalendarClock size={16} /> NEXT LESSON <span>Tashkent time</span>
            </div>
            {state.sessionsLoading ? (
              <Spin />
            ) : state.sessionsError ? (
              <Alert
                type="error"
                message="Lessons could not be loaded"
                action={<Button onClick={state.onRetrySessions}>Retry</Button>}
              />
            ) : next ? (
              <>
                <h2>{next.description || "Mentoring session"}</h2>
                <p className="fs-overview__date">{formatDate(next.dateTime)}</p>
                <p>
                  {next.mentorName || mentorName || "Mentor to be assigned"} ·{" "}
                  {plannedMinutes(next.duration)} minutes
                </p>
                <span className="fs-overview__status">
                  {lessonLabel(next, now)}
                </span>
                <div className="fs-overview__actions">
                  {next.meetingLink ? (
                    <a
                      className="fs-overview__primary"
                      href={next.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join lesson <ArrowUpRight size={16} />
                    </a>
                  ) : (
                    <span className="fs-overview__muted">
                      Your mentor will add the meeting link.
                    </span>
                  )}
                  <a href="#full-support-lessons">View all lessons</a>
                </div>
              </>
            ) : (
              <>
                <h2>No upcoming lesson yet</h2>
                <p>
                  Your next lesson will appear here when your mentor schedules
                  it.
                </p>
              </>
            )}
          </section>
          <section
            className="applicant-panel fs-overview__mentor"
            aria-label="Mentoring support"
          >
            <div className="fs-overview__eyebrow">YOUR MENTOR</div>
            <h2>{mentorName || "Assignment pending"}</h2>
            <p>Full Support mentoring</p>
            {onChat && (
              <Button
                onClick={onChat}
                disabled={!mentorName}
                icon={<MessageCircle size={15} />}
              >
                Message mentor
              </Button>
            )}
            <div className="fs-overview__time">
              <Clock size={16} />
              <div>
                <strong>
                  {state.sessionsLoading
                    ? "Loading teaching time…"
                    : state.sessionsError
                      ? "Teaching time unavailable"
                      : `${Math.round(usedHours * 60)} min recorded`}
                </strong>
                <small>Teaching time from your saved lesson records</small>
              </div>
            </div>
          </section>
        </div>
        <section
          className="applicant-panel fs-overview__section"
          aria-label="Next tasks"
        >
          <div className="fs-overview__heading">
            <div>
              <h2>Your next tasks</h2>
              <p>Open a task to submit work or read your mentor’s feedback.</p>
            </div>
            <Link to={applicantLinks.tasks}>View all tasks →</Link>
          </div>
          {state.tasksLoading ? (
            <Spin />
          ) : state.tasksError ? (
            <Alert
              type="error"
              message="Tasks could not be loaded"
              action={<Button onClick={state.onRetryTasks}>Retry</Button>}
            />
          ) : !previews.length ? (
            <p className="fs-overview__empty">No outstanding mentor tasks.</p>
          ) : (
            previews.map((task) => (
              <div className="fs-overview__task" key={task.id}>
                <div>
                  <span
                    className={
                      "fs-overview__status" +
                      (task.status === "revision_requested"
                        ? " fs-overview__status--attention"
                        : "")
                    }
                  >
                    {taskLabels[task.status]}
                  </span>
                  <h3>{task.task}</h3>
                  <p>
                    {task.mentorName || mentorName || "Your mentor"}
                    {task.deadline &&
                      ` · Due ${dayjs(task.deadline).tz("Asia/Tashkent").format("D MMM YYYY")}`}
                  </p>
                </div>
                <Link to={mentorTaskLink(task.id)}>
                  {task.status === "revision_requested"
                    ? "Review feedback"
                    : task.status === "submitted"
                      ? "View submission"
                      : "Open task"}{" "}
                  →
                </Link>
              </div>
            ))
          )}
        </section>
        <section
          className="applicant-panel fs-overview__section"
          id="full-support-lessons"
          aria-label="Lessons and shared notes"
        >
          <div className="fs-overview__heading">
            <div>
              <h2>Lessons & shared notes</h2>
              <p>
                Attendance, teaching time, and your mentor’s notes stay with
                each lesson.
              </p>
            </div>
          </div>
          {state.sessionsLoading ? (
            <Spin />
          ) : state.sessionsError ? (
            <p className="fs-overview__empty">
              Lesson history is unavailable. Retry above.
            </p>
          ) : !history.length ? (
            <p className="fs-overview__empty">
              Your other scheduled and completed lessons will appear here.
            </p>
          ) : (
            history.map((s) => (
              <details className="fs-overview__lesson" key={s.id}>
                <summary>
                  <div>
                    <strong>{s.description || "Mentoring session"}</strong>
                    <small>
                      {formatDate(s.dateTime)} ·{" "}
                      {s.mentorName || mentorName || "Mentor"}
                    </small>
                  </div>
                  <span className="fs-overview__status">
                    {lessonLabel(s, now)}
                  </span>
                </summary>
                <div className="fs-overview__lesson-detail"><SessionRecording source="full-support" sessionId={s.id} />
                  <p>
                    {plannedMinutes(s.duration)}m planned
                    {s.actualDurationMinutes !== null &&
                      ` · ${s.actualDurationMinutes}m actual`}
                    {s.outcome === "held" &&
                      ` · ${s.attendance === "unknown" ? "Attendance not recorded" : s.attendance}`}
                  </p>
                  <p className="fs-overview__notes">
                    {s.sharedNotes || "No shared notes recorded yet."}
                  </p>
                  {s.outcome === "scheduled" && s.meetingLink && (
                    <a href={s.meetingLink} target="_blank" rel="noreferrer">
                      Meeting link ↗
                    </a>
                  )}
                  {s.homework?.map((task) => (
                    <div key={task.id}>
                      <Link to={mentorTaskLink(task.id)}>
                        Homework: {task.title} →
                      </Link>
                    </div>
                  ))}
                </div>
              </details>
            ))
          )}
        </section>
        <section
          className="applicant-panel fs-overview__section"
          aria-label="Mentoring goals"
        >
          <div className="fs-overview__heading">
            <div>
              <h2>Mentoring goals</h2>
              <p>Goals recorded by your mentor.</p>
            </div>
          </div>
          {state.milestonesLoading ? (
            <Spin />
          ) : state.milestonesError ? (
            <Alert
              type="error"
              message="Goals could not be loaded"
              action={<Button onClick={state.onRetryMilestones}>Retry</Button>}
            />
          ) : !milestones.length ? (
            <p className="fs-overview__empty">
              Your mentor hasn’t added any goals yet.
            </p>
          ) : (
            milestones.map((m) => (
              <div className="fs-overview__goal" key={m.id}>
                <CheckCircle2 size={17} aria-hidden />
                <span>
                  {m.label}
                  {m.date && (
                    <small>{dayjs(m.date).format("D MMM YYYY")}</small>
                  )}
                </span>
                <span className="fs-overview__status">
                  {m.done ? "Completed" : "In progress"}
                </span>
              </div>
            ))
          )}
        </section>
        <div className="fs-overview__shortcuts">
          <div>
            <strong>Courses & test preparation</strong>
            <p>
              Continue your courses and view learning progress in My Learning.
            </p>
            <Link to={applicantLinks.learning}>Open My Learning →</Link>
          </div>
          <div>
            <strong>University applications</strong>
            <p>
              Manage your applications, documents, and deadlines in
              Applications.
            </p>
            <Link to={applicantLinks.applications}>Open Applications →</Link>
          </div>
        </div>
      </div>
    </ApplicantPage>
  );
}

function LegacyFullSupportStudentPage() {
  const enrollment = useGetEnrollmentMeQuery();
  const isEnrolled = enrollment.data?.data?.enrolled ?? false;
  const tasks = useGetMenteeTasksQuery(undefined, { skip: !isEnrolled });
  const milestones = useGetMenteeMilestonesQuery(undefined, {
    skip: !isEnrolled,
  });
  const sessions = useGetMenteeSessionsQuery(undefined, {
    skip: !isEnrolled,
    pollingInterval: 15000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });
  const [fetchReport, reportState] = useLazyGetWeeklyReportQuery();
  const openReport = async () => {
    try {
      const result = await fetchReport(undefined).unwrap();
      if (result?.data) generateWeeklyReportPdf(result.data);
      else message.error("Could not load report.");
    } catch {
      message.error("Could not load report.");
    }
  };
  const [conversation, setConversation] = useState<string | null>(null);
  const currentUser = useTypedSelector((state) => state.auth.profile);
  const [findConversation] = useFindOrCreateConversationMutation();
  const openChat = async () => {
    const mentorId = enrollment.data?.data?.mentorId;
    if (!currentUser?.id || !mentorId) return;
    try {
      const result = await findConversation({
        mentorId,
        studentId: currentUser.id,
      }).unwrap();
      if (result.conversation?.id) setConversation(result.conversation.id);
    } catch {
      message.error("Could not open chat.");
    }
  };
  if (enrollment.isLoading)
    return (
      <ApplicantPage title="Full Support">
        <Spin size="large" />
      </ApplicantPage>
    );
  if (enrollment.isError)
    return (
      <ApplicantPage title="Full Support">
        <Alert
          type="error"
          message="Could not load your program access"
          action={<Button onClick={enrollment.refetch}>Retry</Button>}
        />
      </ApplicantPage>
    );
  if (!isEnrolled) return <FullSupportNotEnrolled />;
  return (
    <>
      <FullSupportOverview
        mentorName={enrollment.data?.data?.mentorName}
        sessions={sessions.data?.data?.sessions ?? []}
        tasks={tasks.data?.data ?? []}
        milestones={milestones.data?.data ?? []}
        usedHours={sessions.data?.data?.usedHours ?? 0}
        sessionsLoading={sessions.isLoading}
        sessionsError={sessions.isError}
        onRetrySessions={sessions.refetch}
        tasksLoading={tasks.isLoading}
        tasksError={tasks.isError}
        onRetryTasks={tasks.refetch}
        milestonesLoading={milestones.isLoading}
        milestonesError={milestones.isError}
        onRetryMilestones={milestones.refetch}
        onChat={openChat}
        onReport={openReport}
        reportLoading={reportState.isLoading}
      />
      {conversation && (
        <ChatModal
          conversationId={conversation}
          open
          onClose={() => setConversation(null)}
          openToGeneralConversation
          onConversationChange={setConversation}
        />
      )}
    </>
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
  return <ApplicantPage title={t('fullSupport.studentTitle','Full Support Mentorship Program')} subtitle="Individual guidance, mentor sessions and application support.">
    <FullSupportPaymentGate salesEmail={SUPPORT_EMAIL} programUrl={PROGRAMS_PAGE_URL}/>
  </ApplicantPage>;
}

export { default } from "../my-programs/MyProgramsStudentPage";
