import { LEGACY_ENROLLMENT, canCreateProgramWork, enrollmentHours, isAccessDenied, matchesEnrollment, programHasTool } from "../programCapabilities";
import { validateProgramProgress } from "../programProgress";
import { downloadProgramReport } from "src/app/services/programReports";
import { mentorProgramLabel } from '../mentorProgramLabel';
import LessonPlanModal from "./LessonPlanModal";
import { useLocation } from "react-router-dom";
import SharedApplications from "./SharedApplications";
import { useGetMentorEssayReviewsQuery } from "src/app/services/student-hub/essayReviewApi";
import { calendarDateValue } from "../calendarDate";
import ApplicationRequirements from "src/pages/student-hub/applicant/ApplicationRequirements";
import { useUpdateMentorApplicationRequirementsMutation } from "src/app/services/student-hub/applicationTrackingApi";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  Circle,
  FileText,
  Flag,
  MessageSquare,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import {
  useCreateMentorMilestoneMutation,
  useCreateMentorPipelineRowMutation,
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
  useDecideTaskExtensionMutation,
  type CurriculumWatchlistItemDto,
  type MilestoneDto,
  type PipelineDto,
  type TaskDto,
} from "src/app/services/fullSupportApi";
import {
  useGetGraderInboxQuery,
  type ResearchSubmission,
} from "src/app/services/research-prep";
import { useFindOrCreateConversationMutation } from "src/app/services/chat/chatApi";
import MessageList from "src/components/chat/MessageList";
import ChatInput from "src/components/chat/ChatInput";
import SubmissionDrawer from "../../research-grading/SubmissionDrawer";
import { useMentorBookings } from "../sessionSources";
import { bookingDisplay, groupStudentSessions } from "../sessionDisplay";
import { useSessionActions } from "./sessions/useSessionActions";
import { EssayReviewList } from "./reviews/EssayReviewList";
import { DocumentReviewList } from "./reviews/DocumentReviewList";
import { useReviewCounts } from "./reviews/reviewCounts";
import { useMentorConsole } from "../MentorConsoleContext";
import { McPill, type McPillVariant } from "./McPill";
import { McStat } from "./McStat";
import {
  avatarStyleForId,
  formatDate,
  formatDateTime,
  initialsFromName,
} from "../utils";
import {
  programNames,
  roleNames,
} from "src/pages/student-hub/my-programs/programModel";
import { useGetProgramEnrollmentProgressQuery, useSetProgramEnrollmentProgressMutation, type ProgramProgressItem, type ProgramKey } from "src/app/services/studentProgramsApi";
import type { MentorRosterProgram } from "src/app/services/fullSupportApi";
import { canUseResearchPrepLive } from "src/lib/researchPrepAccess";
import {
  deadlineDay,
  isTaskOverdue,
  pendingExtension,
} from "src/lib/taskDeadline";
import { hostName } from "src/app/services/api/const";
import "./StudentWorkspace.scss";
import { rosterHoursLabel } from "../rosterDisplay";

const { Text } = Typography;

export type WorkspaceStudent = {
  id: string;
  name: string;
  initials: string;
  used: number;
  allocated: number;
  scheduledHours?: number;
  sessionsCount: number;
  completedSessionsCount?: number;
  allocationKnown?: boolean;
  usageKnown?: boolean;
  /** Programs and roles assigned to this mentor. */
  programs?: MentorRosterProgram[];
  hasLegacyFullSupport?: boolean;
};

/** "Admissions · Research" — the eyebrow under which the student's name sits. */
function assignmentLabel(
  student: WorkspaceStudent,
  isProgramStudent: boolean,
): string {
  return mentorProgramLabel(student, isProgramStudent);
}

const RG_MC: Record<ResearchSubmission["status"], McPillVariant> = {
  submitted: "info",
  under_review: "warning",
  graded: "success",
  returned_for_revision: "warning",
};
const RG_LABEL: Record<ResearchSubmission["status"], string> = {
  submitted: "Submitted",
  under_review: "Under review",
  graded: "Graded",
  returned_for_revision: "Revision",
};

type TaskScope = "open" | "awaiting-review" | "done";
type MoreView = "milestones" | "research" | "curriculum";

function taskStatus(t: TaskDto): TaskScope {
  if (t.status === "approved") return "done";
  if (t.status === "submitted") return "awaiting-review";
  return "open";
}

function pipelineStatusVariant(
  status: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  const s = (status || "").toLowerCase();
  if (s === "accepted" || s === "admitted") return "success";
  if (s === "rejected" || s === "denied") return "danger";
  if (s === "waitlist" || s === "deferred") return "warning";
  if (s === "submitted" || s === "applied") return "info";
  return "neutral";
}

function tabLabel(label: string, count?: number) {
  return (
    <span>
      {label}
      {typeof count === "number" && count > 0 ? (
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
function StudentMessageTab({
  mentorId,
  studentId,
}: {
  mentorId: string;
  studentId: string;
}) {
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
        <Button
          size="small"
          icon={<RotateCcw size={14} />}
          onClick={resolveConversation}
        >
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
  isProgramStudent = true,
  identityDetails,
}: {
  student: WorkspaceStudent;
  /** Extra line under the student's name (e.g. their goal and majors). */
  identityDetails?: ReactNode;
  /** Whether this student has an academic program assignment. */
  isProgramStudent?: boolean;
}) {
  const {
    id: mentorId,
    email,
    managementRole,
  } = useMentorConsole();
  const researchPrepLive = canUseResearchPrepLive(email, managementRole);
  const studentId = student.id;
  const location = useLocation();
  const requestedEnrollmentId = new URLSearchParams(location.search).get('enrollment');
  const [acknowledgedEnrollmentRequest, setAcknowledgedEnrollmentRequest] = useState<string | null>(null);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(
    requestedEnrollmentId && student.programs?.some(program => program.enrollmentId === requestedEnrollmentId)
      ? requestedEnrollmentId : student.programs?.[0]?.enrollmentId ?? LEGACY_ENROLLMENT,
  );
  const workspaceScopeRef = useRef(selectedEnrollmentId);
  workspaceScopeRef.current = selectedEnrollmentId;
  const selectedProgram = student.programs?.find(program => program.enrollmentId === selectedEnrollmentId);
  const canUse = (tool: string) => selectedProgram ? programHasTool(selectedProgram, tool) : (!!student.hasLegacyFullSupport || (isProgramStudent && student.hasLegacyFullSupport === undefined && !student.programs?.length));
  const canUseResearch = canUse('research');
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [progressEditorOpen, setProgressEditorOpen] = useState(false);
  const [progressDraft, setProgressDraft] = useState<ProgramProgressItem[]>([]);
  const [progressDraftUpdatedAt, setProgressDraftUpdatedAt] = useState<string | null>(null);
  const [progressConflict, setProgressConflict] = useState(false);
  const [saveProgramProgress, { isLoading: savingProgramProgress }] = useSetProgramEnrollmentProgressMutation();
  useEffect(() => {
    if (selectedEnrollmentId !== LEGACY_ENROLLMENT && !student.programs?.some(program => program.enrollmentId === selectedEnrollmentId)) {
      setSelectedEnrollmentId(student.programs?.[0]?.enrollmentId ?? LEGACY_ENROLLMENT);
    }
  }, [student.id, student.programs, selectedEnrollmentId]);

  // Tasks first — the mockup's everyday view. Heavy sections load lazily.
  const [activeTab, setActiveTab] = useState(new URLSearchParams(location.search).get('tab') === 'applications' ? 'essays' : 'tasks');
  useEffect(() => {
    if (requestedEnrollmentId && student.programs?.some(program => program.enrollmentId === requestedEnrollmentId)) {
      setSelectedEnrollmentId(requestedEnrollmentId);
      setProgressEditorOpen(false);
    }
    const requestedTab = new URLSearchParams(location.search).get('tab') === 'applications' ? 'essays' : new URLSearchParams(location.search).get('tab');
    if (requestedTab && ['tasks', 'sessions', 'message', 'reports', 'reviews', 'essays', 'more'].includes(requestedTab)) setActiveTab(requestedTab);
    // Apply navigation once; roster refreshes must preserve the mentor's selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, location.search]);
  const [moreView, setMoreView] = useState<MoreView>("milestones");

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskDescription, setQuickTaskDescription] = useState("");
  const [quickTaskDeadline, setQuickTaskDeadline] = useState<Dayjs | null>(
    null,
  );
  const [feedbackTask, setFeedbackTask] = useState<TaskDto | null>(null);
  const [feedbackForm] = Form.useForm<{
    feedback: string;
    decision: "approved" | "revision_requested";
    revisionFileUrls?: string[];
  }>();
  const feedbackDecision = Form.useWatch("decision", feedbackForm);
  // Deadline extension request being answered.
  const [extensionTask, setExtensionTask] = useState<TaskDto | null>(null);
  const [extensionDeadline, setExtensionDeadline] = useState<Dayjs | null>(
    null,
  );
  const [extensionResponse, setExtensionResponse] = useState("");
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [milestoneForm] = Form.useForm<{ label: string; date: Dayjs | null }>();
  const [logSessionOpen, setLogSessionOpen] = useState(false);

  const [addPipelineOpen, setAddPipelineOpen] = useState(false);
  const [pipelineForm] = Form.useForm<{
    program: string;
    stage?: string;
    status?: string;
    deadline?: Dayjs | null;
  }>();
  const [researchPick, setResearchPick] = useState<ResearchSubmission | null>(
    null,
  );
  useEffect(() => {
    setExpandedTaskId(null);
    setQuickTaskTitle('');
    setQuickTaskDescription('');
    setQuickTaskDeadline(null);
    setFeedbackTask(null);
    setExtensionTask(null);
    setExtensionResponse('');
    setExtensionDeadline(null);
    setAddMilestoneOpen(false);
    setLogSessionOpen(false);
    setAddPipelineOpen(false);
    setResearchPick(null);
    setProgressEditorOpen(false);
    setProgressDraft([]);
    setProgressDraftUpdatedAt(null);
    setProgressConflict(false);
    feedbackForm.resetFields();
    milestoneForm.resetFields();
    pipelineForm.resetFields();
  }, [selectedEnrollmentId, feedbackForm, milestoneForm, pipelineForm]);

  // Always loaded — power the stat cards + tab badges.
  const { bookings, isLoading: loadingBookings, isError: bookingsError } = useMentorBookings(
    studentId,
    {
      includeFullSupport: true,
    },
  );
  const { currentData: tasksRes, isLoading: loadingTasks, isError: tasksError, error: taskError, refetch: refetchTasks } = useGetMentorTasksQuery(
    undefined,
    {
      skip: !studentId,
      pollingInterval: 10000,
      refetchOnMountOrArgChange: true,
    },
  );
  const { data: pipelineRes } = useGetMentorPipelineQuery(undefined, {
    skip: !studentId,
  });

  const essayReviews = useGetMentorEssayReviewsQuery(undefined, {
    skip: !studentId,
    pollingInterval: 10000,
    refetchOnMountOrArgChange: true,
  });
  const sharedEssayCount = new Set(
    (essayReviews.data ?? [])
      .filter(
        (review) =>
          review.studentUserId === studentId && review.status !== "withdrawn",
      )
      .map((review) => review.essayId),
  ).size;

  const { essayCount: pendingEssayCount, documentCount: pendingDocCount } =
    useReviewCounts(false, studentId);
  const [updateApplicationRequirements] =
    useUpdateMentorApplicationRequirementsMutation();

  // Lazy — fetched only when the matching tab (or "More" section) is active.
  const { currentData: milestonesRes, isFetching: loadingMilestones, isError: milestonesError, error: milestoneError, refetch: refetchMilestones } =
    useGetMentorMilestonesQuery({ studentUserId: studentId, enrollmentId: selectedProgram?.enrollmentId }, {
      skip: activeTab !== "more" || !canUse("milestones"),
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    });
  const { currentData: curriculumRes } = useGetMentorCurriculumProgressQuery(
    studentId,
    {
      skip: activeTab !== "more" || !canUse("progress") || !!selectedProgram,
    },
  );
  const scopedProgress = useGetProgramEnrollmentProgressQuery(selectedProgram?.enrollmentId ?? '', {
    skip: !selectedProgram || !canUse('progress') || activeTab !== 'more',
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    pollingInterval: 30000,
  });
  const { data: inbox, isFetching: loadingInbox } = useGetGraderInboxQuery(
    undefined,
    {
      skip:
        activeTab !== "more" ||
        !canUseResearch ||
        !researchPrepLive,
    },
  );

  const tasks = useMemo<TaskDto[]>(
    () => (isAccessDenied(taskError) ? [] : tasksRes?.data ?? []).filter((t) => t.studentUserId === studentId && matchesEnrollment(t, selectedEnrollmentId)),
    [tasksRes?.data, studentId, selectedEnrollmentId, taskError],
  );
  const pipeline = useMemo<PipelineDto[]>(
    () =>
      (pipelineRes?.data ?? []).filter((p) => p.studentUserId === studentId),
    [pipelineRes?.data, studentId],
  );
  const milestones = (isAccessDenied(milestoneError) ? [] : milestonesRes?.data ?? []).filter(row => matchesEnrollment(row, selectedEnrollmentId));
  const curriculumItems: CurriculumWatchlistItemDto[] = (selectedProgram ? (scopedProgress.currentData?.data.items ?? []).map(item => ({ ...item, label: item.key, target: item.target ?? null })) : curriculumRes?.data ?? []).filter(
    (c) => c.percent >= 0,
  );

  // The Full Support query is already scoped to this student server-side.
  const studentBookings = useMemo(
    () =>
      bookings.filter(
        (b) => (b.source === "full-support" || b.studentUserId === studentId) && matchesEnrollment(b.source === "full-support" ? b.raw as { academicEnrollmentId?: string | null } : {}, selectedEnrollmentId),
      ),
    [bookings, studentId, selectedEnrollmentId],
  );
  const selectedHours = selectedProgram ? { ...student, ...enrollmentHours(selectedProgram) } : {
    ...student,
    sessionsCount: studentBookings.length,
    used: studentBookings.reduce((sum, booking) => {
      const raw = booking.raw as { outcome?: string; actualDurationMinutes?: number | null };
      return sum + (raw.outcome === 'held' ? (raw.actualDurationMinutes ?? 0) / 60 : 0);
    }, 0),
    scheduledHours: studentBookings.filter(booking => booking.status === 'upcoming').reduce((sum, booking) => sum + booking.durationMinutes / 60, 0),
    usageKnown: false,
    allocationKnown: false,
  };
  const grouped = useMemo(
    () => groupStudentSessions(studentBookings),
    [studentBookings],
  );
  const upcomingSessions = grouped.upcoming;
  const pastSessions = useMemo(
    () => studentBookings.filter((b) => b.status !== "upcoming"),
    [studentBookings],
  );
  const canAssignTask = !isAccessDenied(taskError) && (
    canCreateProgramWork(student, selectedEnrollmentId, "tasks") ||
    (!isProgramStudent &&
    studentBookings.some(
      (booking) =>
        booking.source === "platform" &&
        (booking.status === "completed" || booking.status === "report-due"),
    )));
  const researchForStudent = useMemo(
    () => (inbox ?? []).filter((s) => s.studentId === studentId),
    [inbox, studentId],
  );

  const openTasksCount = useMemo(
    () => tasks.filter((t) => taskStatus(t) !== "done").length,
    [tasks],
  );
  const awaitingReviewCount = useMemo(
    () => tasks.filter((t) => taskStatus(t) === "awaiting-review").length,
    [tasks],
  );
  const reportsFiled = useMemo(
    () =>
      studentBookings.filter((b) =>
        b.source === "platform"
          ? !!b.report
          : bookingDisplay(b).label === "Held",
      ).length,
    [studentBookings],
  );
  const reportsDue = useMemo(
    () => grouped.needsAction.length,
    [grouped.needsAction],
  );

  const [createTask, { isLoading: creatingTask }] =
    useCreateMentorTaskMutation();
  const [updateFeedback, { isLoading: savingFeedback }] =
    useUpdateMentorTaskFeedbackMutation();
  const [decideExtension, { isLoading: decidingExtension }] =
    useDecideTaskExtensionMutation();
  const [deleteTask] = useDeleteMentorTaskMutation();
  const [createMilestone, { isLoading: creatingMs }] =
    useCreateMentorMilestoneMutation();
  const [updateMilestone] = useUpdateMentorMilestoneMutation();
  const [deleteMilestone] = useDeleteMentorMilestoneMutation();
  const sessionActions = useSessionActions();

  const [createPipeline, { isLoading: creatingPl }] =
    useCreateMentorPipelineRowMutation();
  const [deletePipeline] = useDeleteMentorPipelineRowMutation();

  const submitQuickTask = async () => {
    if (!canAssignTask) {
      message.warning('Select an active program where task assignment is available.');
      return;
    }
    const title = quickTaskTitle.trim();
    if (!title) {
      message.warning("Give the task a title");
      return;
    }
    if (!quickTaskDeadline) {
      message.warning("Pick a due date");
      return;
    }
    await createTask({
      studentUserId: studentId,
      enrollmentId: selectedProgram?.enrollmentId,
      task: title,
      description: quickTaskDescription.trim() || undefined,
      deadline: calendarDateValue(quickTaskDeadline)!,
    })
      .unwrap()
      .then(() => {
        if (workspaceScopeRef.current !== selectedEnrollmentId) return;
        message.success("Task assigned");
        setQuickTaskTitle("");
        setQuickTaskDescription("");
        setQuickTaskDeadline(null);
      })
      .catch(() => message.error("Could not assign task"));
  };

  const submitFeedback = async () => {
    if (!feedbackTask) return;
    const values = await feedbackForm.validateFields();
    await updateFeedback({
      id: feedbackTask.id,
      feedback: values.feedback,
      decision: values.decision,
      feedbackFileUrls: feedbackTask.feedbackFileUrls,
      revisionFileUrls:
        values.decision === "revision_requested"
          ? (values.revisionFileUrls ?? [])
          : [],
    })
      .unwrap()
      .then(() => {
        if (workspaceScopeRef.current !== selectedEnrollmentId) return;
        message.success("Feedback saved");
        setFeedbackTask(null);
      })
      .catch(() => message.error("Could not save"));
  };

  const submitMilestone = async () => {
    if (!canCreateProgramWork(student, selectedEnrollmentId, 'milestones')) return;
    const values = await milestoneForm.validateFields();
    await createMilestone({
      studentUserId: studentId,
      enrollmentId: selectedProgram?.enrollmentId,
      label: values.label,
      date: calendarDateValue(values.date),
    })
      .unwrap()
      .then(() => {
        if (workspaceScopeRef.current !== selectedEnrollmentId) return;
        message.success("Milestone added");
        setAddMilestoneOpen(false);
        milestoneForm.resetFields();
      })
      .catch(() => message.error("Could not add"));
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
        if (workspaceScopeRef.current !== selectedEnrollmentId) return;
        message.success("Application row added");
        setAddPipelineOpen(false);
        pipelineForm.resetFields();
      })
      .catch(() => message.error("Could not add"));
  };

  const openFeedbackModal = (t: TaskDto) => {
    setFeedbackTask(t);
    feedbackForm.setFieldsValue({
      feedback: "",
      decision: "approved",
      revisionFileUrls: [],
    });
  };

  const openExtensionModal = (t: TaskDto) => {
    const pending = pendingExtension(t);
    setExtensionTask(t);
    setExtensionDeadline(pending ? dayjs(pending.requestedDeadline) : null);
    setExtensionResponse("");
  };

  const answerExtension = (decision: "approved" | "declined") => {
    if (!extensionTask) return;
    if (decision === "approved" && !extensionDeadline) {
      message.warning("Pick the new deadline");
      return;
    }
    decideExtension({
      id: extensionTask.id,
      decision,
      response: extensionResponse.trim() || undefined,
      deadline:
        decision === "approved"
          ? extensionDeadline?.format("YYYY-MM-DD")
          : undefined,
    })
      .unwrap()
      .then(() => {
        if (workspaceScopeRef.current !== selectedEnrollmentId) return;
        message.success(
          decision === "approved" ? "Deadline extended" : "Request declined",
        );
        setExtensionTask(null);
      })
      .catch((error: { data?: { message?: string } }) =>
        message.error(error?.data?.message || "Could not save"),
      );
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
        <Button
          type="primary"
          size="small"
          icon={<Plus size={14} />}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );

  const renderTaskRow = (t: TaskDto) => {
    const s = taskStatus(t);
    const done = s === "done";
    const overdue = isTaskOverdue(t);
    const extension = pendingExtension(t);
    const expanded = expandedTaskId === t.id;
    const hasDetail = !!(
      t.description ||
      t.submissionText ||
      t.feedback ||
      t.submissionFileUrls?.length
    );

    return (
      <div
        key={t.id}
        className={`mc-ws-task${done ? " mc-ws-task--done" : ""}`}
      >
        <div className="mc-ws-task-row">
          <span
            className={`mc-ws-task-check${done ? " mc-ws-task-check--done" : ""}`}
            title={
              done
                ? "Feedback given"
                : s === "awaiting-review"
                  ? "Awaiting your review"
                  : "Assigned"
            }
          >
            {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
          </span>

          <button
            type="button"
            className="mc-ws-task-main"
            onClick={() =>
              hasDetail && setExpandedTaskId(expanded ? null : t.id)
            }
            style={{ cursor: hasDetail ? "pointer" : "default" }}
          >
            <span className="mc-ws-task-title">{t.task}</span>
            {s === "awaiting-review" && (
              <McPill variant="warning">Awaiting review</McPill>
            )}
            {t.status === "revision_requested" && (
              <McPill variant="warning">Revision requested</McPill>
            )}
            {overdue && (
              <McPill variant="danger">
                <AlertCircle
                  size={11}
                  style={{ marginRight: 3, verticalAlign: "-1px" }}
                />
                Overdue
              </McPill>
            )}
            {extension && <McPill variant="info">Extension requested</McPill>}
          </button>

          <span
            className={`mc-ws-task-due${overdue ? " mc-ws-task-due--overdue" : ""}`}
          >
            {t.deadline ? `Due ${formatDate(t.deadline)}` : ""}
          </span>

          {extension ? (
            <Button
              size="small"
              icon={<CalendarClock size={13} />}
              onClick={() => openExtensionModal(t)}
            >
              Extension
            </Button>
          ) : null}
          {s === "awaiting-review" ? (
            <Button
              type="primary"
              size="small"
              onClick={() => openFeedbackModal(t)}
            >
              Review
            </Button>
          ) : null}

          <Popconfirm
            title="Delete this task?"
            onConfirm={() =>
              deleteTask(t.id)
                .unwrap()
                .then(() => message.success("Task removed"))
                .catch(() => message.error("Could not delete"))
            }
          >
            <button
              type="button"
              className="mc-ws-task-x"
              aria-label="Delete task"
            >
              <X size={15} />
            </button>
          </Popconfirm>
        </div>

        {expanded && hasDetail && (
          <div className="mc-ws-task-detail">
            {t.description && (
              <div className="mc-ws-task-detail-text">
                Instructions: {t.description}
              </div>
            )}
            {t.submissionText ? (
              <>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Student submission
                </Text>
                <div className="mc-ws-task-detail-text">{t.submissionText}</div>
              </>
            ) : null}
            {t.submissionFileUrls?.length ? (
              <ul className="mc-ws-files">
                {t.submissionFileUrls.map((file) => (
                  <li key={file.url}>
                    <a
                      href={`${hostName}${file.url}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText size={13} /> {file.fileName}
                    </a>
                    {t.status === "revision_requested" &&
                      t.revisionFileUrls?.includes(file.url) && (
                        <McPill variant="warning">Needs revision</McPill>
                      )}
                  </li>
                ))}
              </ul>
            ) : null}
            {t.feedback ? (
              <>
                <Text
                  strong
                  style={{ color: "var(--mc-accent)", fontSize: 12 }}
                >
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
            {isFs ? ` · ${student.programs?.find(program => program.enrollmentId === (b.raw as { academicEnrollmentId?: string }).academicEnrollmentId)?.name || programNames[b.program as ProgramKey] || b.program || 'Program unconfirmed'}` : ' · 1:1 session'}
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
          {sessionActions.renderActions(b)}
        </Space>
      </div>
    );
  };

  const renderSessionGroup = (
    title: string,
    rows: typeof bookings,
    empty?: string,
  ) => {
    if (rows.length === 0 && !empty) return null;
    return (
      <>
        {sectionHead(
          title,
          <Calendar size={18} color="var(--mc-accent)" aria-hidden />,
        )}
        <div className="mc-ws-card">
          {rows.length === 0 ? (
            <div className="mc-ws-empty">{empty}</div>
          ) : (
            rows.map(renderBookingRow)
          )}
        </div>
      </>
    );
  };

  const milestoneColumns: ColumnsType<MilestoneDto> = [
    { title: "Milestone", dataIndex: "label", key: "label" },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 116,
      render: (v: string | null) => formatDate(v),
    },
    {
      title: "Status",
      dataIndex: "done",
      key: "done",
      width: 100,
      render: (done: boolean) =>
        done ? (
          <McPill variant="success">Done</McPill>
        ) : (
          <McPill variant="neutral">Pending</McPill>
        ),
    },
    {
      title: "",
      key: "toggle",
      width: 88,
      render: (_, row) => (
        <Switch
          checked={row.done}
          onChange={(v) =>
            updateMilestone({ id: row.id, done: v })
              .unwrap()
              .catch(() => message.error("Update failed"))
          }
        />
      ),
    },
    {
      title: "",
      key: "del",
      width: 72,
      render: (_, row) => (
        <Popconfirm
          title="Delete milestone?"
          onConfirm={() =>
            deleteMilestone(row.id)
              .unwrap()
              .then(() => message.success("Removed"))
              .catch(() => message.error("Failed"))
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
    { title: "Program", dataIndex: "program", key: "program" },
    { title: "Stage", dataIndex: "stage", key: "stage", width: 120 },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (s: string) => (
        <McPill variant={pipelineStatusVariant(s)}>{s || "—"}</McPill>
      ),
    },
    {
      title: "Deadline",
      dataIndex: "deadline",
      key: "deadline",
      width: 116,
      render: (v: string | null) => formatDate(v),
    },
    {
      title: "",
      key: "del",
      width: 72,
      render: (_, row) => (
        <Popconfirm
          title="Remove this row?"
          onConfirm={() =>
            deletePipeline(row.id)
              .unwrap()
              .then(() => message.success("Removed"))
              .catch(() => message.error("Failed"))
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
    ...(canUse("milestones") ? [{ label: "Milestones", value: "milestones" }] : []),
    ...(canUseResearch && researchPrepLive
      ? [{ label: "Research", value: "research" }]
      : []),
    ...(canUse("progress") ? [{ label: selectedProgram ? "Program progress" : "Legacy curriculum", value: "curriculum" }] : []),
  ];

  const currentMoreView = moreOptions.some(option => option.value === moreView) ? moreView : moreOptions[0]?.value;

  const items = [
    {
      key: "tasks",
      label: tabLabel("Tasks", openTasksCount),
      children: (
        <>
          {sectionHead(
            "Tasks",
            <CheckSquare size={18} color="var(--mc-accent)" aria-hidden />,
          )}
          <div className="mc-ws-card">
            {tasksError && <Alert type="error" showIcon message={isAccessDenied(taskError) ? "You no longer have access to these tasks" : "Tasks could not refresh"} description={!isAccessDenied(taskError) && tasks.length ? "Showing the last loaded tasks." : undefined} action={<Button onClick={() => void refetchTasks()}>Retry</Button>} />}
            {loadingTasks ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: 24,
                }}
              >
                <Spin />
              </div>
            ) : tasksError && tasks.length === 0 ? null : tasks.length === 0 ? (
              <div className="mc-ws-empty">
                No tasks yet — assign the first one below.
              </div>
            ) : (
              <div className="mc-ws-tasklist">{tasks.map(renderTaskRow)}</div>
            )}
            {!canAssignTask && !loadingBookings && (
              <div className="mc-ws-empty">
                {isProgramStudent ? "Choose an active program to assign new tasks. Legacy history stays separate." : "Task assignment becomes available after your first completed 1:1 meeting with this student."}
              </div>
            )}
            {canAssignTask && (
              <div className="mc-ws-task-add">
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
              </div>
            )}
          </div>
        </>
      ),
    },
    {
      key: "sessions",
      // Badge = sessions waiting on the mentor only, so a number always means "act here".
      label: tabLabel("Sessions", reportsDue),
      children: (
        <>
          {canCreateProgramWork(student, selectedEnrollmentId, "lessons") && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 8,
              }}
            >
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={() => setLogSessionOpen(true)}
              >
                Schedule lessons
              </Button>
            </div>
          )}
          {loadingBookings ? (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 24 }}
            >
              <Spin />
            </div>
          ) : (
            <>
              {renderSessionGroup("Needs action", grouped.needsAction)}
              {renderSessionGroup(
                "Upcoming",
                grouped.upcoming,
                "No upcoming sessions with this student.",
              )}
              {renderSessionGroup(
                "Past",
                grouped.past,
                "No past sessions with this student yet.",
              )}
            </>
          )}
        </>
      ),
    },
    {
      key: "message",
      label: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <MessageSquare size={14} />
          Message
        </span>
      ),
      children: <StudentMessageTab mentorId={mentorId} studentId={studentId} />,
    },
    {
      key: "reports",
      label: "Reports",
      children: selectedProgram ? <p>Download this enrollment’s program PDF above for attendance, hours, tasks, milestones and shared comments.</p> : <p>Select a linked program to download its enrollment report. Existing unscoped records remain in legacy history.</p>,
    },
    {
      key: "reviews",
      label: tabLabel("Reviews", pendingEssayCount + pendingDocCount),
      children: (
        <>
          {sectionHead(
            "Essays",
            <FileText size={18} color="var(--mc-accent)" aria-hidden />,
          )}
          <EssayReviewList studentUserId={studentId} embedded />
          {sectionHead(
            "Documents",
            <FileText size={18} color="var(--mc-accent)" aria-hidden />,
          )}
          <DocumentReviewList studentUserId={studentId} embedded />
        </>
      ),
    },
    {key:'essays',label:'Applications',children:<SharedApplications studentId={studentId}/>},
    {
      key: "more",
      label: tabLabel("More"),
      children: (
        <>
          <div className="mc-ws-more-switch">
            <Segmented
              value={currentMoreView}
              onChange={(v) => setMoreView(v as MoreView)}
              options={moreOptions}
            />
          </div>

          {currentMoreView === "milestones" && (
            <>
              {sectionHead(
                "Milestones",
                <Flag size={18} color="var(--mc-accent)" aria-hidden />,
                !isAccessDenied(milestoneError) && canCreateProgramWork(student, selectedEnrollmentId, "milestones") ? {
                  label: "Add milestone",
                  onClick: () => setAddMilestoneOpen(true),
                } : undefined,
              )}
              <div className="mc-ws-card">
                {milestonesError && <Alert type="error" showIcon message={isAccessDenied(milestoneError) ? "You no longer have access to these milestones" : "Milestones could not refresh"} action={<Button onClick={() => void refetchMilestones()}>Retry</Button>} />}
                {loadingMilestones ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: 24,
                    }}
                  >
                    <Spin />
                  </div>
                ) : milestonesError && milestones.length === 0 ? null : milestones.length === 0 ? (
                  <div className="mc-ws-empty">
                    No milestones — add key dates and deliverables here.
                  </div>
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

          {currentMoreView === "research" && canUseResearch && researchPrepLive && (
            <>
              {sectionHead(
                "Research grading",
                <CheckSquare size={18} color="var(--mc-accent)" aria-hidden />,
              )}
              <div className="mc-ws-card" style={{ padding: 0 }}>
                {loadingInbox ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: 24,
                    }}
                  >
                    <Spin />
                  </div>
                ) : researchForStudent.length === 0 ? (
                  <div className="mc-ws-empty">
                    No research submissions from this student yet.
                  </div>
                ) : (
                  researchForStudent.map((s) => (
                    <div
                      key={s.id}
                      className="mc-ws-rg-row"
                      role="button"
                      tabIndex={0}
                      onClick={() => setResearchPick(s)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
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
                          Submitted {formatDateTime(s.submittedAt)} · Attempt #
                          {s.attemptNumber}
                          {s.fileName ? ` · ${s.fileName}` : ""}
                        </div>
                      </div>
                      <Space
                        direction="vertical"
                        size={2}
                        style={{ alignItems: "flex-end" }}
                      >
                        {s.status === "graded" && s.score != null ? (
                          <Text strong style={{ fontSize: 12 }}>
                            {s.score}/100
                          </Text>
                        ) : null}
                        <McPill variant={RG_MC[s.status]}>
                          {RG_LABEL[s.status]}
                        </McPill>
                      </Space>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {currentMoreView === "curriculum" && (
            <>
              {sectionHead(
                selectedProgram ? "Program progress" : "Legacy curriculum progress",
                <CheckSquare size={18} color="var(--mc-accent)" aria-hidden />,
                selectedProgram && canCreateProgramWork(student, selectedEnrollmentId, 'progress') && scopedProgress.currentData && !scopedProgress.isError && !scopedProgress.isFetching ? { label: 'Update progress', onClick: () => { setProgressDraft((scopedProgress.currentData?.data.items ?? []).map(item => ({ ...item }))); setProgressDraftUpdatedAt(scopedProgress.currentData?.data.updatedAt ?? null); setProgressConflict(false); setProgressEditorOpen(true); } } : undefined,
              )}
              <div className="mc-ws-card">
                {selectedProgram && scopedProgress.isFetching ? <Spin /> : selectedProgram && scopedProgress.isError ? <div role="alert">Could not load program progress. <Button onClick={() => void scopedProgress.refetch()}>Retry</Button></div> : curriculumItems.length === 0 ? (
                  <div className="mc-ws-empty">
                    No progress items yet.
                  </div>
                ) : (
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: "100%" }}
                  >
                    {curriculumItems.map((item: CurriculumWatchlistItemDto) => (
                      <div key={item.key}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                            marginBottom: 4,
                          }}
                        >
                          <span>{item.label}</span>
                          <span style={{ color: "var(--mc-text-muted)" }}>
                            {item.percent}%
                            {item.target ? ` · target ${item.target}` : ""}
                          </span>
                        </div>
                        <Progress
                          percent={item.percent}
                          showInfo={false}
                          strokeColor="var(--mc-accent)"
                          size="small"
                        />
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
  const visibleItems = items.filter(item => {
    if (item.key === 'message') return true;
    if (selectedEnrollmentId === LEGACY_ENROLLMENT) return ['tasks', 'sessions', 'message', 'reviews', 'reports'].includes(item.key) || (item.key === 'more' && moreOptions.length > 0);
    if (item.key === 'tasks') return canUse('tasks');
    if (item.key === 'sessions') return canUse('lessons');
    if (item.key === 'reports') return canUse('reports');
    if (item.key === 'more') return moreOptions.length > 0;
    return canUse(item.key === 'essays' ? 'applications' : 'reviews');
  });
  const currentTab = visibleItems.some(item => item.key === activeTab) ? activeTab : visibleItems[0]?.key;
  if (requestedEnrollmentId && requestedEnrollmentId !== acknowledgedEnrollmentRequest && !student.programs?.some(program => program.enrollmentId === requestedEnrollmentId)) {
    return <Alert type="warning" showIcon message="The linked program enrollment is no longer available" description="Choose an available program or open legacy history to continue with this student." action={<Select aria-label="Choose an available program enrollment" placeholder="Choose a program" style={{ minWidth: 240 }} options={[
      ...(student.programs ?? []).map(program => ({ value: program.enrollmentId, label: program.name || programNames[program.program] || program.program })),
      { value: LEGACY_ENROLLMENT, label: 'Legacy / 1:1 history' },
    ]} onChange={value => { setSelectedEnrollmentId(value); setAcknowledgedEnrollmentRequest(requestedEnrollmentId); }} />} />;
  }

  return (
    <>
      <div className="mc-ws-focus">
        <div className="mc-ws-hero">
          <div className="mc-ws-who">
            <div
              className="mc-avatar mc-ws-who-avatar"
              style={avatarStyleForId(student.id)}
              aria-hidden
            >
              {initialsFromName(student.name)}
            </div>
            <div className="mc-ws-who-text">
              <span className="mc-ws-eyebrow">
                {(selectedProgram ? assignmentLabel({ ...student, programs: [selectedProgram], hasLegacyFullSupport: false }, true) : "Legacy / 1:1 history").toUpperCase()}
              </span>
              <h1>{student.name}</h1>
            </div>
          </div>
          <p className="mc-ws-who-meta">
            {selectedHours.sessionsCount} session
            {selectedHours.sessionsCount === 1 ? "" : "s"} total
            {selectedProgram
              ? ` · ${selectedHours.used}h completed · ${selectedHours.scheduledHours ?? 0}h scheduled`
              : ""}
          </p>
          {identityDetails}
          {!!student.programs?.length && <Space wrap style={{ marginBottom: 12 }}>
            <Select aria-label="Student program enrollment" disabled={creatingTask || savingFeedback || creatingMs || savingProgramProgress || decidingExtension} value={selectedEnrollmentId} onChange={value => { setSelectedEnrollmentId(value); setExpandedTaskId(null); setProgressEditorOpen(false); }} style={{ minWidth: 260 }} options={[
              ...student.programs.map(program => ({ value: program.enrollmentId, label: `${program.name || programNames[program.program] || program.program} · ${program.roles.map(role => roleNames[role] || role).join(', ')}` })),
              { value: LEGACY_ENROLLMENT, label: 'Legacy / 1:1 history (program unconfirmed)' },
            ]} />
            {selectedProgram && canUse('reports') && <Button loading={downloadingReport} onClick={async () => {
              setDownloadingReport(true);
              try { await downloadProgramReport(selectedProgram.enrollmentId, 'mentor', `${student.name} ${selectedProgram.name || selectedProgram.program}`); }
              catch { message.error('Could not download the program report'); }
              finally { setDownloadingReport(false); }
            }}>Download program PDF</Button>}
          </Space>}
          {isProgramStudent && selectedEnrollmentId === LEGACY_ENROLLMENT && <p className="mc-ws-who-meta">These records have no confirmed program enrollment. They are preserved separately from program hours and progress.</p>}
          <Button
            onClick={() => setActiveTab("message")}
            icon={<MessageSquare size={14} />}
          >
            Message {student.name.split(/\s+/)[0] || "student"}
          </Button>
        </div>
        <div className="mc-ws-next">
          <span className="mc-ws-eyebrow">NEXT SESSION · TASHKENT</span>
          {bookingsError ? (
            <p>Session information could not be loaded.</p>
          ) : loadingBookings ? (
            <Spin />
          ) : upcomingSessions[0] ? (
            <>
              <h2>{formatDateTime(upcomingSessions[0].dateTime)}</h2>
              <p>
                {upcomingSessions[0].description || "Mentoring session"} ·{" "}
                {upcomingSessions[0].durationLabel}
              </p>
              <Button onClick={() => setActiveTab("sessions")}>
                View sessions
              </Button>
            </>
          ) : (
            <>
              <h2>No upcoming session</h2>
              <p>Check session history or arrange the next meeting.</p>
              <Button onClick={() => setActiveTab("sessions")}>
                View sessions
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="mc-stat-grid mc-ws-stats">
        <McStat
          icon={<Calendar size={18} />}
          label="Total sessions"
          value={selectedHours.sessionsCount}
          meta={
            isProgramStudent
              ? rosterHoursLabel(selectedHours)
              : upcomingSessions.length > 0
                ? `${upcomingSessions.length} upcoming`
                : "All past"
          }
          tone="info"
        />
        <McStat
          icon={<CalendarCheck size={18} />}
          label="Completed sessions"
          value={reportsFiled}
          meta={
            reportsDue > 0
              ? `${reportsDue} report${reportsDue === 1 ? "" : "s"} due`
              : "No pending session records"
          }
          tone={reportsDue > 0 ? "alert" : "good"}
          cta={reportsDue > 0 ? "Open sessions" : undefined}
          onClick={reportsDue > 0 ? () => setActiveTab("sessions") : undefined}
        />
        <McStat
          icon={<CheckSquare size={18} />}
          label="Open tasks"
          value={openTasksCount}
          meta={
            awaitingReviewCount > 0
              ? `${awaitingReviewCount} awaiting review`
              : openTasksCount > 0
                ? "Assigned"
                : "All caught up"
          }
          tone={awaitingReviewCount > 0 ? "warn" : "neutral"}
        />
        {canUse("reviews") ? (
          <McStat
            icon={<FileText size={18} />}
            label="Shared essays"
            value={essayReviews.isError ? "—" : sharedEssayCount}
            meta={
              essayReviews.isError
                ? "Count unavailable"
                : "Shared with you for review"
            }
            tone="neutral"
            cta="Open reviews"
            onClick={() => setActiveTab("reviews")}
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
        activeKey={currentTab}
        onChange={setActiveTab}
        items={visibleItems}
        destroyInactiveTabPane
      />

      <Modal title="Program progress" open={progressEditorOpen} onCancel={() => setProgressEditorOpen(false)} confirmLoading={savingProgramProgress} okButtonProps={{ disabled: progressConflict }} onOk={async () => {
        if (!selectedProgram || progressConflict || !canCreateProgramWork(student, selectedEnrollmentId, 'progress') || scopedProgress.isError) return;
        const validationError = validateProgramProgress(progressDraft);
        if (validationError) { message.warning(validationError); return; }
        try { await saveProgramProgress({ id: selectedProgram.enrollmentId, expectedUpdatedAt: progressDraftUpdatedAt, items: progressDraft.map(item => ({ ...item, key: item.key.trim() })) }).unwrap(); if (workspaceScopeRef.current !== selectedEnrollmentId) return; setProgressEditorOpen(false); message.success('Program progress saved'); }
        catch (error) { if (workspaceScopeRef.current !== selectedEnrollmentId) return; if (error && typeof error === 'object' && 'status' in error && error.status === 409) { setProgressConflict(true); void scopedProgress.refetch(); } else message.error('Could not save program progress'); }
      }}>
        {progressConflict && <Alert type="warning" showIcon message="Program progress changed while you were editing" description="Your draft has not overwritten the newer progress. Close and reopen this editor to load the latest version before making changes." />}
        <Space direction="vertical" style={{ width: '100%' }}>
          {progressDraft.map((item,index) => <Space key={index} wrap>
            <Input aria-label={`Progress item ${index + 1}`} placeholder="Progress item" maxLength={200} value={item.key} onChange={event => setProgressDraft(items => items.map((row,i) => i === index ? { ...row, key: event.target.value } : row))} />
            <InputNumber aria-label={`Progress percent ${index + 1}`} min={0} max={100} value={item.percent} onChange={value => setProgressDraft(items => items.map((row,i) => i === index ? { ...row, percent: value ?? 0 } : row))} suffix="%" />
            <Input aria-label={`Progress target ${index + 1}`} placeholder="Target (optional)" maxLength={1000} value={item.target ?? ''} onChange={event => setProgressDraft(items => items.map((row,i) => i === index ? { ...row, target: event.target.value } : row))} />
            <Button danger onClick={() => setProgressDraft(items => items.filter((_,i) => i !== index))}>Remove</Button>
          </Space>)}
          <Button disabled={progressDraft.length >= 100} onClick={() => setProgressDraft(items => [...items, { key: '', percent: 0 }])}>Add progress item</Button>
        </Space>
      </Modal>
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
            <div style={{ fontWeight: 600, marginBottom: 12 }}>
              {feedbackTask.task}
            </div>
            {feedbackTask.submissionText ? (
              <>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Submission
                </Text>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    marginBottom: 14,
                    padding: 10,
                    borderRadius: 8,
                    background: "var(--mc-bg-subtle)",
                    fontSize: 13,
                  }}
                >
                  {feedbackTask.submissionText}
                </div>
              </>
            ) : null}
            {feedbackTask.submissionFileUrls?.length ? (
              <ul className="mc-ws-files" style={{ marginBottom: 14 }}>
                {feedbackTask.submissionFileUrls.map((file) => (
                  <li key={file.url}>
                    <a
                      href={`${hostName}${file.url}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText size={13} /> {file.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            <Form form={feedbackForm} layout="vertical">
              <Form.Item
                name="decision"
                label="Decision"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: "approved", label: "Approve task" },
                    { value: "revision_requested", label: "Request revision" },
                  ]}
                />
              </Form.Item>
              {feedbackDecision === "revision_requested" &&
                (feedbackTask.submissionFileUrls?.length ?? 0) > 0 && (
                  <Form.Item
                    name="revisionFileUrls"
                    label="Which files need revision?"
                    extra="Leave all unticked to ask for the whole submission again. The student only re-uploads the ticked files."
                  >
                    <Checkbox.Group className="mc-ws-revision-files">
                      {feedbackTask.submissionFileUrls!.map((file) => (
                        <Checkbox key={file.url} value={file.url}>
                          {file.fileName}
                        </Checkbox>
                      ))}
                    </Checkbox.Group>
                  </Form.Item>
                )}
              <Form.Item
                name="feedback"
                label="Feedback"
                rules={[{ required: true, message: "Write your feedback" }]}
              >
                <Input.TextArea
                  rows={5}
                  placeholder="What went well, what to improve…"
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      <Modal
        title="Deadline extension request"
        open={!!extensionTask}
        onCancel={() => setExtensionTask(null)}
        destroyOnClose
        width={520}
        footer={[
          <Button
            key="decline"
            danger
            disabled={decidingExtension}
            onClick={() => answerExtension("declined")}
          >
            Decline
          </Button>,
          <Button
            key="approve"
            type="primary"
            loading={decidingExtension}
            onClick={() => answerExtension("approved")}
          >
            Approve new deadline
          </Button>,
        ]}
      >
        {extensionTask &&
          (() => {
            const request = pendingExtension(extensionTask);
            if (!request)
              return (
                <Text type="secondary">This request was already answered.</Text>
              );
            const current = deadlineDay(extensionTask.deadline);
            return (
              <div className="mc-ws-extension">
                <div className="mc-ws-extension-task">{extensionTask.task}</div>
                <div className="mc-ws-extension-dates">
                  <div>
                    <span>Current deadline</span>
                    <strong>{formatDate(extensionTask.deadline)}</strong>
                  </div>
                  <div>
                    <span>Requested</span>
                    <strong>{formatDate(request.requestedDeadline)}</strong>
                  </div>
                </div>
                <div className="mc-ws-extension-reason">
                  <span>Reason</span>
                  <p>{request.reason}</p>
                </div>
                <label className="mc-ws-extension-field">
                  <span>New deadline</span>
                  <DatePicker
                    value={extensionDeadline}
                    onChange={setExtensionDeadline}
                    format="D MMM YYYY"
                    disabledDate={(date) =>
                      !!current && !date.isAfter(dayjs(current), "day")
                    }
                    style={{ width: "100%" }}
                  />
                </label>
                <label className="mc-ws-extension-field">
                  <span>Message to the student (optional)</span>
                  <Input.TextArea
                    rows={2}
                    value={extensionResponse}
                    onChange={(event) =>
                      setExtensionResponse(event.target.value)
                    }
                    placeholder="e.g. Fine — but please send the outline by Friday."
                  />
                </label>
              </div>
            );
          })()}
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
          <Form.Item
            name="label"
            label="Milestone"
            rules={[{ required: true, message: "Describe the milestone" }]}
          >
            <Input placeholder="e.g. Submit RD1 application" />
          </Form.Item>
          <Form.Item name="date" label="Target date (optional)">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <LessonPlanModal
        open={logSessionOpen}
        onClose={() => setLogSessionOpen(false)}
        studentId={studentId}
        enrollmentId={selectedProgram?.enrollmentId}
      />

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
          <Form.Item
            name="program"
            label="Program or school"
            rules={[{ required: true, message: "Required" }]}
          >
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
                { value: "draft", label: "Draft" },
                { value: "in progress", label: "In progress" },
                { value: "submitted", label: "Submitted" },
                { value: "waitlist", label: "Waitlist" },
                { value: "accepted", label: "Accepted" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
          </Form.Item>
          <Form.Item name="deadline" label="Deadline (optional)">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {sessionActions.modals}
      <SubmissionDrawer
        open={!!researchPick}
        submission={researchPick}
        onClose={() => setResearchPick(null)}
      />
    </>
  );
}
