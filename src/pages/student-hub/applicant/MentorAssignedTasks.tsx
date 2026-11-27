import { useEffect, useMemo, useState } from "react";
import { Alert, Button, DatePicker, Input, Modal, Select, Upload, message } from "antd";
import type { UploadFile } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  FileText,
  Paperclip,
  PencilLine,
  RefreshCw,
  Send,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";
import {
  useGetMenteeTasksQuery,
  useRequestTaskExtensionMutation,
  useSubmitMenteeTaskMutation,
  useUploadTaskSubmissionFileMutation,
  type TaskDto,
} from "src/app/services/fullSupportApi";
import { hostName } from "src/app/services/api/const";
import {
  deadlineDay,
  isTaskOverdue,
  latestDecidedExtension,
  pendingExtension,
  todayInTashkent,
} from "src/lib/taskDeadline";

import SearchButton from 'src/components/common/searchButton';
type FileLink = { fileName: string; url: string };
/** A file in the submission: an already-uploaded link, or a new local file. */
export type SubmissionFile = FileLink | UploadFile;

const MAX_FILES = 3;

const statusLabels: Record<TaskDto["status"], string> = {
  assigned: "To do",
  submitted: "Waiting for review",
  revision_requested: "Revision requested",
  approved: "Approved",
};
const EMPTY_TASKS: TaskDto[] = [];

type AssignedTaskListProps = {
  tasks: TaskDto[];
  selectedTaskId?: string | null;
  isLoading?: boolean;
  isError?: boolean;
  refetch?: () => unknown;
  submitting?: boolean;
  onSubmit: (id: string, response: string, files: SubmissionFile[]) => Promise<void>;
  onRequestExtension?: (id: string, requestedDeadline: string, reason: string) => Promise<void>;
};

const readableDeadline = (value?: string | null) => {
  const day = deadlineDay(value);
  if (!day) return "No deadline";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
};
const readableDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Tashkent" }).format(new Date(value));
const fileUrl = (url: string) => (/^https?:\/\//.test(url) ? url : `${hostName}${url}`);
const isLink = (file: SubmissionFile): file is FileLink => "url" in file && typeof file.url === "string" && !("uid" in file);
const errorMessage = (error: unknown, fallback: string) => {
  const data = (error as { data?: { message?: string | string[] } })?.data;
  const text = Array.isArray(data?.message) ? data?.message[0] : data?.message;
  return text || fallback;
};

export default function MentorAssignedTasks({ selectedTaskId }: { selectedTaskId?: string | null }) {
  const query = useGetMenteeTasksQuery(undefined, {
    pollingInterval: 10000,
    refetchOnMountOrArgChange: true,
  });
  const [submitTask, submitState] = useSubmitMenteeTaskMutation();
  const [uploadFile] = useUploadTaskSubmissionFileMutation();
  const [requestExtension] = useRequestTaskExtensionMutation();

  const submit = async (taskId: string, response: string, files: SubmissionFile[]) => {
    const links: FileLink[] = [];
    for (const file of files) {
      if (isLink(file)) {
        links.push({ fileName: file.fileName, url: file.url });
        continue;
      }
      if (!file.originFileObj) continue;
      const result = await uploadFile({ taskId, file: file.originFileObj }).unwrap();
      links.push(result.data);
    }
    await submitTask({ id: taskId, submissionText: response, submissionFileUrls: links }).unwrap();
  };

  return (
    <AssignedTaskList
      tasks={query.data?.data ?? EMPTY_TASKS}
      selectedTaskId={selectedTaskId}
      isLoading={query.isLoading}
      isError={query.isError}
      refetch={query.refetch}
      submitting={submitState.isLoading}
      onSubmit={submit}
      onRequestExtension={async (id, requestedDeadline, reason) => {
        await requestExtension({ id, requestedDeadline, reason }).unwrap();
      }}
    />
  );
}

/** One file per line; files the reviewer flagged carry a "Needs revision" tag. */
function FileList({ files, flagged = [], label }: { files?: FileLink[]; flagged?: string[]; label?: string }) {
  if (!files?.length) return null;
  return (
    <ul className="task-files">
      {files.map((file) => (
        <li key={file.url} className={flagged.includes(file.url) ? "is-flagged" : undefined}>
          <a href={fileUrl(file.url)} target="_blank" rel="noreferrer">
            <Paperclip size={14} aria-hidden />
            <span>{label ? `${label} ${file.fileName}` : file.fileName}</span>
          </a>
          {flagged.includes(file.url) && <span className="task-files__flag">Needs revision</span>}
        </li>
      ))}
    </ul>
  );
}

type SubmitMode = "submit" | "revision" | "edit";

export function AssignedTaskList({
  tasks,
  selectedTaskId,
  isLoading,
  isError,
  refetch,
  submitting,
  onSubmit,
  onRequestExtension,
}: AssignedTaskListProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(selectedTaskId ? "all" : "open");

  // Submit / revise / edit modal.
  const [active, setActive] = useState<{ task: TaskDto; mode: SubmitMode } | null>(null);
  const [response, setResponse] = useState("");
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [sending, setSending] = useState(false);

  // Extension modal.
  const [extensionTask, setExtensionTask] = useState<TaskDto | null>(null);
  const [extensionDate, setExtensionDate] = useState<Dayjs | null>(null);
  const [extensionReason, setExtensionReason] = useState("");
  const [requesting, setRequesting] = useState(false);

  const matchesSearch = (task: TaskDto) =>
    `${task.task} ${task.description ?? ""} ${task.mentorName ?? ""}`.toLowerCase().includes(search.toLowerCase());
  const visible = tasks.filter(
    (task) =>
      (status === "all" ||
        (status === "open"
          ? task.status !== "approved"
          : status === "overdue"
            ? isTaskOverdue(task)
            : task.status === status)) &&
      matchesSearch(task),
  );
  // With the default "To do" view, finished work moves to a history list
  // below instead of disappearing.
  const history = status === "open" ? tasks.filter((task) => task.status === "approved" && matchesSearch(task)) : [];
  const overdueCount = useMemo(() => tasks.filter((task) => isTaskOverdue(task)).length, [tasks]);

  const hasSelectedTask = !!selectedTaskId && tasks.some((task) => task.id === selectedTaskId);
  useEffect(() => {
    if (selectedTaskId) {
      setSearch("");
      setStatus("all");
    }
  }, [selectedTaskId]);
  useEffect(() => {
    if (hasSelectedTask) document.getElementById(`mentor-task-${selectedTaskId}`)?.scrollIntoView({ block: "center" });
  }, [selectedTaskId, hasSelectedTask]);

  const open = (task: TaskDto, mode: SubmitMode) => {
    setActive({ task, mode });
    // Revising or editing starts from the current submission, so the student
    // only changes what needs changing.
    setResponse(mode === "submit" ? "" : task.submissionText ?? "");
    setFiles(mode === "submit" ? [] : [...(task.submissionFileUrls ?? [])]);
  };
  const close = () => {
    setActive(null);
    setResponse("");
    setFiles([]);
  };

  const flagged = active?.mode === "revision" ? active.task.revisionFileUrls ?? [] : [];
  const unresolvedFlags = files.filter((file) => isLink(file) && flagged.includes(file.url));

  const replaceFile = (index: number, file: File) => {
    const upload: UploadFile = { uid: `${Date.now()}-${file.name}`, name: file.name, originFileObj: file as UploadFile["originFileObj"], status: "done" };
    setFiles((current) => current.map((item, i) => (i === index ? upload : item)));
  };
  const removeFile = (index: number) => setFiles((current) => current.filter((_, i) => i !== index));
  const addFiles = (list: File[]) =>
    setFiles((current) => {
      const room = MAX_FILES - current.length;
      if (room <= 0) {
        message.warning(`You can attach up to ${MAX_FILES} files.`);
        return current;
      }
      if (list.length > room) message.warning(`Only ${room} more file${room === 1 ? "" : "s"} can be attached.`);
      return [
        ...current,
        ...list.slice(0, room).map((file) => ({ uid: `${Date.now()}-${file.name}`, name: file.name, originFileObj: file as UploadFile["originFileObj"], status: "done" as const })),
      ];
    });

  const send = async () => {
    if (!active || sending) return;
    if (!response.trim() && files.length === 0) {
      message.warning("Add a response or a file.");
      return;
    }
    if (unresolvedFlags.length) {
      message.warning("Replace or remove the files marked “Needs revision”.");
      return;
    }
    setSending(true);
    try {
      await onSubmit(active.task.id, response.trim(), files);
      message.success(active.mode === "edit" ? "Submission updated." : "Sent to your advisor for review.");
      close();
    } catch (error) {
      message.error(errorMessage(error, "Could not send your work. Please try again."));
    } finally {
      setSending(false);
    }
  };

  const openExtension = (task: TaskDto) => {
    setExtensionTask(task);
    setExtensionDate(null);
    setExtensionReason("");
  };
  const extensionMin = (() => {
    if (!extensionTask) return dayjs();
    const day = deadlineDay(extensionTask.deadline);
    const afterDeadline = day ? dayjs(day).add(1, "day") : dayjs();
    const today = dayjs(todayInTashkent());
    return afterDeadline.isAfter(today) ? afterDeadline : today;
  })();
  const sendExtension = async () => {
    if (!extensionTask || !onRequestExtension || requesting) return;
    if (!extensionDate) return message.warning("Pick the new deadline you need.");
    if (!extensionReason.trim()) return message.warning("Tell your mentor why you need more time.");
    setRequesting(true);
    try {
      await onRequestExtension(extensionTask.id, extensionDate.format("YYYY-MM-DD"), extensionReason.trim());
      message.success("Extension request sent.");
      setExtensionTask(null);
    } catch (error) {
      message.error(errorMessage(error, "Could not send the request. Please try again."));
    } finally {
      setRequesting(false);
    }
  };

  const modalTitle =
    active?.mode === "edit" ? "Edit submission" : active?.mode === "revision" ? "Submit revision" : "Submit work";

  return (
    <section className="task-card mentor-assigned-tasks" aria-label="Assigned tasks">
      <header className="task-card__head">
        <div>
          <h2>
            Assigned to you <span className="task-count">{isLoading ? "–" : tasks.length}</span>
          </h2>
          <p>Work from your counselor or mentor. Submit it here and read their feedback.</p>
        </div>
      </header>
      <div className="task-toolbar">
        <Input
          className="task-toolbar__search"
          aria-label="Search assigned tasks"
          placeholder="Search tasks or mentors"
          suffix={<SearchButton size={24} />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          allowClear
        />
        <Select
          aria-label="Assigned task status"
          value={status}
          onChange={setStatus}
          popupMatchSelectWidth={false}
          options={[
            { value: "open", label: "To do" },
            { value: "all", label: "All statuses" },
            { value: "overdue", label: `Overdue${overdueCount ? ` (${overdueCount})` : ""}` },
            ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
          ]}
        />
      </div>
      {isLoading ? (
        <p className="task-loading">Loading assigned tasks…</p>
      ) : isError ? (
        <Alert type="error" message="Could not load assigned tasks" action={<Button onClick={() => refetch?.()}>Retry</Button>} />
      ) : visible.length === 0 ? (
        <div className="task-empty">
          <strong>
            {!tasks.length ? "Nothing assigned yet." : history.length && !search ? "You’re all caught up." : "No assigned tasks match these filters."}
          </strong>
          <p>
            {!tasks.length
              ? "When your counselor or mentor gives you work, it appears here."
              : history.length && !search
                ? "There’s nothing to submit right now. Your finished work is below."
                : "Try another status or clear the search."}
          </p>
        </div>
      ) : (
        <div className="task-assigned-list">
          {visible.map((task) => {
            const overdue = isTaskOverdue(task);
            const pending = pendingExtension(task);
            const decided = latestDecidedExtension(task);
            const canSubmit = task.status === "assigned" || task.status === "revision_requested";
            const canAskExtension = !!onRequestExtension && canSubmit && !pending;
            const flags = task.status === "revision_requested" ? task.revisionFileUrls ?? [] : [];
            const earlier = task.status === "submitted" ? task.reviewHistory ?? [] : (task.reviewHistory ?? []).slice(0, -1);
            return (
              <article
                id={`mentor-task-${task.id}`}
                key={task.id}
                className={`mentor-assigned-tasks__item task-assigned${task.id === selectedTaskId ? " is-selected" : ""}${overdue ? " is-overdue" : ""}`}
              >
                <div className="task-assigned__top">
                  <div className="task-assigned__heading">
                    <div className="task-assigned__title-row">
                      <h3>{task.task}</h3>
                      <span className={`task-status task-status--${task.status}`}>{statusLabels[task.status] || "To do"}</span>
                      {overdue && (
                        <span className="task-status task-status--overdue">
                          <AlertCircle size={12} aria-hidden /> Overdue
                        </span>
                      )}
                      {pending && <span className="task-status task-status--extension">Extension requested</span>}
                    </div>
                    <p className="task-assigned__meta">
                      From {task.mentorName || "your advisor"} ·{" "}
                      <span className={overdue ? "task-assigned__due is-overdue" : "task-assigned__due"}>
                        Due {readableDeadline(task.deadline)}
                      </span>
                      {decided?.status === "approved" && decided.previousDeadline && (
                        <> · extended from {readableDeadline(decided.previousDeadline)}</>
                      )}
                    </p>
                  </div>
                  <div className="task-assigned__actions">
                    {canAskExtension && (
                      <Button className="task-assigned__secondary" icon={<CalendarClock size={15} aria-hidden />} onClick={() => openExtension(task)}>
                        Request extension
                      </Button>
                    )}
                    {task.status === "submitted" && task.canEditSubmission && (
                      <Button className="task-assigned__secondary" icon={<PencilLine size={15} aria-hidden />} onClick={() => open(task, "edit")}>
                        Edit submission
                      </Button>
                    )}
                    {canSubmit && (
                      <Button
                        type="primary"
                        className="task-assigned__submit"
                        icon={task.status === "revision_requested" ? <RefreshCw size={15} aria-hidden /> : <Send size={15} aria-hidden />}
                        onClick={() => open(task, task.status === "revision_requested" ? "revision" : "submit")}
                      >
                        {task.status === "revision_requested" ? "Submit revision" : "Submit work"}
                      </Button>
                    )}
                  </div>
                </div>

                {task.description && task.description.trim() !== task.task.trim() && (
                  <p className="task-assigned__description">{task.description}</p>
                )}

                {pending && (
                  <p className="task-assigned__notice">
                    You asked to move the deadline to <strong>{readableDeadline(pending.requestedDeadline)}</strong>. Waiting for your
                    advisor’s answer.
                  </p>
                )}
                {!pending && decided?.status === "declined" && task.status !== "approved" && (
                  <p className="task-assigned__notice is-declined">
                    Your extension request was declined{decided.response ? `: ${decided.response}` : "."}
                  </p>
                )}

                {(task.submissionText || task.submissionFileUrls?.length) && (
                  <div className="task-submission">
                    <div className="task-submission__label">
                      <FileText size={14} aria-hidden /> Your submission
                      {task.submittedAt && <span>· {readableDate(task.submittedAt)}</span>}
                    </div>
                    {task.submissionText && <p className="task-submission__text">{task.submissionText}</p>}
                    <FileList files={task.submissionFileUrls} flagged={flags} />
                    {task.status === "submitted" && task.canEditSubmission && (
                      <p className="task-submission__hint">You can edit this until the end of {readableDeadline(task.deadline)}.</p>
                    )}
                  </div>
                )}

                {task.feedback && (
                  <div className="mentor-assigned-tasks__feedback">
                    <strong>{task.status === "submitted" ? "Previous advisor feedback:" : "Advisor feedback:"}</strong> {task.feedback}
                    {flags.length > 0 && (
                      <span className="task-feedback__flags">
                        {flags.length === 1 ? "1 file needs" : `${flags.length} files need`} revision — the rest can stay as they are.
                      </span>
                    )}
                    <FileList files={task.feedbackFileUrls} label="Feedback file:" />
                  </div>
                )}

                {earlier.length > 0 && (
                  <details className="task-previous">
                    <summary>Previous submissions and reviews ({earlier.length})</summary>
                    <ol className="task-previous__list">
                      {earlier.map((entry, index) => (
                        <li key={index} className="task-previous__entry">
                          <div className="task-previous__head">
                            <span className={`task-status task-status--${entry.decision}`}>
                              {entry.decision === "approved" ? "Approved" : "Revision requested"}
                            </span>
                            <span>{readableDate(entry.at)}</span>
                          </div>
                          {entry.feedback && <p className="task-previous__feedback">{entry.feedback}</p>}
                          {entry.submissionText && (
                            <p className="task-previous__text">
                              <strong>You submitted:</strong> {entry.submissionText}
                            </p>
                          )}
                          <FileList files={entry.submissionFileUrls} flagged={entry.revisionFileUrls} />
                          <FileList files={entry.feedbackFileUrls} label="Feedback file:" />
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      )}
      {!isLoading && !isError && history.length > 0 && (
        <div className="task-history">
          <h3 className="task-history__title">
            Completed <span className="task-count">{history.length}</span>
          </h3>
          <ul className="task-history__list">
            {history.map((task) => (
              <li key={task.id} className="task-history__item">
                <div className="task-history__row">
                  <CheckCircle2 size={18} className="task-history__icon" aria-hidden />
                  <div className="task-history__main">
                    <strong>{task.task}</strong>
                    <small>
                      From {task.mentorName || "your advisor"} · Due {readableDeadline(task.deadline)}
                    </small>
                  </div>
                  <span className="task-status task-status--approved">Approved</span>
                </div>
                {task.submissionText || task.feedback || task.submissionFileUrls?.length || task.feedbackFileUrls?.length ? (
                  <details className="task-history__details">
                    <summary>View submission &amp; feedback</summary>
                    {task.submissionText && (
                      <p>
                        <strong>Your submission:</strong> {task.submissionText}
                      </p>
                    )}
                    <FileList files={task.submissionFileUrls} />
                    {task.feedback && (
                      <p className="task-history__feedback">
                        <strong>Feedback:</strong> {task.feedback}
                      </p>
                    )}
                    <FileList files={task.feedbackFileUrls} label="Feedback file:" />
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        className="task-submit-modal"
        title={modalTitle}
        open={!!active}
        onCancel={close}
        onOk={send}
        okText={active?.mode === "edit" ? "Save changes" : "Send for review"}
        confirmLoading={submitting || sending}
        destroyOnClose
        width={580}
      >
        {active && (
          <div className="task-submit">
            <div className="task-submit__task">
              <strong>{active.task.task}</strong>
              <span>Due {readableDeadline(active.task.deadline)}</span>
            </div>
            {active.task.description && active.task.description.trim() !== active.task.task.trim() && (
              <div className="task-submit__instructions">
                <span>Instructions</span>
                <p>{active.task.description}</p>
              </div>
            )}
            {active.mode === "revision" && active.task.feedback && (
              <div className="task-submit__instructions is-feedback">
                <span>Advisor feedback</span>
                <p>{active.task.feedback}</p>
              </div>
            )}

            <label className="task-submit__field">
              <span>Your response</span>
              <Input.TextArea
                rows={4}
                placeholder="Describe what you completed or ask a question"
                value={response}
                onChange={(event) => setResponse(event.target.value)}
              />
            </label>

            <div className="task-submit__field">
              <span>
                Files <small>(up to {MAX_FILES})</small>
              </span>
              {flagged.length > 0 && (
                <p className="task-submit__flag-hint">
                  Replace only the files marked “Needs revision”. The others are kept as they are.
                </p>
              )}
              {files.length > 0 && (
                <ul className="task-submit__files">
                  {files.map((file, index) => {
                    const linked = isLink(file);
                    const needsRevision = linked && flagged.includes(file.url);
                    const name = linked ? file.fileName : file.name;
                    return (
                      <li key={linked ? file.url : file.uid} className={needsRevision ? "is-flagged" : undefined}>
                        <Paperclip size={14} aria-hidden />
                        <span className="task-submit__file-name" title={name}>
                          {name}
                        </span>
                        {needsRevision ? (
                          <span className="task-files__flag">Needs revision</span>
                        ) : !linked ? (
                          <span className="task-submit__file-new">New</span>
                        ) : null}
                        <Upload
                          showUploadList={false}
                          beforeUpload={(picked) => {
                            replaceFile(index, picked);
                            return false;
                          }}
                        >
                          <Button size="small" type={needsRevision ? "primary" : "default"} icon={<RefreshCw size={13} aria-hidden />}>
                            Replace
                          </Button>
                        </Upload>
                        <Button
                          size="small"
                          type="text"
                          aria-label={`Remove ${name}`}
                          icon={<Trash2 size={14} aria-hidden />}
                          onClick={() => removeFile(index)}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
              {files.length < MAX_FILES && (
                <Upload
                  multiple
                  showUploadList={false}
                  beforeUpload={(picked, list) => {
                    // Called once per file; add the whole batch on the first call.
                    if (picked === list[0]) addFiles(list);
                    return false;
                  }}
                >
                  <Button icon={<UploadIcon size={15} aria-hidden />}>Add files</Button>
                </Upload>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        className="task-submit-modal"
        title="Request a deadline extension"
        open={!!extensionTask}
        onCancel={() => setExtensionTask(null)}
        onOk={sendExtension}
        okText="Send request"
        confirmLoading={requesting}
        destroyOnClose
        width={520}
      >
        {extensionTask && (
          <div className="task-submit">
            <div className="task-submit__task">
              <strong>{extensionTask.task}</strong>
              <span className={isTaskOverdue(extensionTask) ? "is-overdue" : undefined}>
                Currently due {readableDeadline(extensionTask.deadline)}
              </span>
            </div>
            <label className="task-submit__field">
              <span>New deadline</span>
              <DatePicker
                value={extensionDate}
                onChange={setExtensionDate}
                format="D MMM YYYY"
                disabledDate={(date) => date.isBefore(extensionMin, "day")}
                style={{ width: "100%" }}
              />
            </label>
            <label className="task-submit__field">
              <span>Why do you need more time?</span>
              <Input.TextArea
                rows={3}
                maxLength={1000}
                placeholder="e.g. I have two exams this week and want to do this properly."
                value={extensionReason}
                onChange={(event) => setExtensionReason(event.target.value)}
              />
            </label>
            <p className="task-submit__flag-hint">Your advisor will approve or decline it. Until then the current deadline still applies.</p>
          </div>
        )}
      </Modal>
    </section>
  );
}
