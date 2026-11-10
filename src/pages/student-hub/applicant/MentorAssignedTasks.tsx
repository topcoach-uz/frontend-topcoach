import { useEffect, useState } from "react";
import { Alert, Button, Input, Modal, Select, Upload, message } from "antd";
import type { UploadFile } from "antd";
import { CheckCircle2, Paperclip, Search, Send } from "lucide-react";
import {
  useGetMenteeTasksQuery,
  useSubmitMenteeTaskMutation,
  useUploadTaskSubmissionFileMutation,
  type TaskDto,
} from "src/app/services/fullSupportApi";
import { hostName } from "src/app/services/api/const";

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
  onSubmit: (
    id: string,
    response: string,
    files: UploadFile[],
  ) => Promise<void>;
};
const readableDeadline = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "No deadline"
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Tashkent",
      }).format(date);
};
const fileUrl = (url: string) =>
  /^https?:\/\//.test(url) ? url : `${hostName}${url}`;

export default function MentorAssignedTasks({
  selectedTaskId,
}: {
  selectedTaskId?: string | null;
}) {
  const query = useGetMenteeTasksQuery(undefined, {
    pollingInterval: 10000,
    refetchOnMountOrArgChange: true,
  });
  const [submitTask, submitState] = useSubmitMenteeTaskMutation();
  const [uploadFile] = useUploadTaskSubmissionFileMutation();
  const submit = async (
    taskId: string,
    response: string,
    files: UploadFile[],
  ) => {
    const uploaded: { fileName: string; url: string }[] = [];
    for (const file of files) {
      if (!file.originFileObj) continue;
      const result = await uploadFile({
        taskId,
        file: file.originFileObj,
      }).unwrap();
      uploaded.push(result.data);
    }
    await submitTask({
      id: taskId,
      submissionText: response,
      submissionFileUrls: uploaded,
    }).unwrap();
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
    />
  );
}

export function AssignedTaskList({
  tasks,
  selectedTaskId,
  isLoading,
  isError,
  refetch,
  submitting,
  onSubmit,
}: AssignedTaskListProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(selectedTaskId ? "all" : "open");
  const [active, setActive] = useState<TaskDto | null>(null);
  const [response, setResponse] = useState("");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const visible = tasks.filter(
    (task) =>
      (status === "all" ||
        (status === "open"
          ? task.status !== "approved"
          : task.status === status)) &&
      `${task.task} ${task.description ?? ""} ${task.mentorName ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  // With the default "To do" view, finished work moves to a history list
  // below instead of disappearing.
  const matchesSearch = (task: TaskDto) =>
    `${task.task} ${task.description ?? ""} ${task.mentorName ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
  const history = status === "open"
    ? tasks.filter((task) => task.status === "approved" && matchesSearch(task))
    : [];

  const hasSelectedTask =
    !!selectedTaskId && tasks.some((task) => task.id === selectedTaskId);
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (selectedTaskId) {
      setSearch("");
      setStatus("all");
    }
  }, [selectedTaskId]);
  useEffect(() => {
    if (hasSelectedTask)
      document
        .getElementById(`mentor-task-${selectedTaskId}`)
        ?.scrollIntoView({ block: "center" });
  }, [selectedTaskId, hasSelectedTask]);

  const close = () => {
    setActive(null);
    setResponse("");
    setFiles([]);
  };
  const send = async () => {
    if (!active || sending) return;
    if (!response.trim() && files.length === 0) {
      message.warning("Add a response or file.");
      return;
    }
    setSending(true);
    try {
      await onSubmit(active.id, response.trim(), files);
      message.success("Sent to your advisor for review.");
      close();
    } catch {
      message.error("Could not send your work. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      className="task-card mentor-assigned-tasks"
      aria-label="Assigned tasks"
    >
      <header className="task-card__head">
        <div>
          <h2>Assigned to you <span className="task-count">{isLoading ? "–" : tasks.length}</span></h2>
          <p>Work from your counselor or mentor. Submit it here and read their feedback.</p>
        </div>
      </header>
      <div className="task-toolbar">
        <Input
          className="task-toolbar__search"
          aria-label="Search assigned tasks"
          placeholder="Search tasks or mentors"
          prefix={<Search size={15} aria-hidden />}
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
            ...Object.entries(statusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>
      {isLoading ? (
        <p className="task-loading">Loading assigned tasks…</p>
      ) : isError ? (
        <Alert
          type="error"
          message="Could not load assigned tasks"
          action={<Button onClick={() => refetch?.()}>Retry</Button>}
        />
      ) : visible.length === 0 ? (
        <div className="task-empty">
          <strong>{!tasks.length ? "Nothing assigned yet." : history.length && !search ? "You’re all caught up." : "No assigned tasks match these filters."}</strong>
          <p>{!tasks.length ? "When your counselor or mentor gives you work, it appears here." : history.length && !search ? "There’s nothing to submit right now. Your finished work is below." : "Try another status or clear the search."}</p>
        </div>
      ) : (
        <div className="task-assigned-list">
        {visible.map((task) => (
          <article
            id={`mentor-task-${task.id}`}
            key={task.id}
            className={`mentor-assigned-tasks__item task-assigned${task.id === selectedTaskId ? " is-selected" : ""}`}
          >
            <div className="task-assigned__top">
              <div className="task-assigned__heading">
                <div className="task-assigned__title-row">
                  <h3>{task.task}</h3>
                  <span className={`task-status task-status--${task.status}`}>
                    {statusLabels[task.status] || "To do"}
                  </span>
                </div>
                <p className="task-assigned__meta">
                  From {task.mentorName || "your advisor"} · Due {readableDeadline(task.deadline)}
                </p>
              </div>
              {(task.status === "assigned" ||
                task.status === "revision_requested") && (
                <Button
                  type="primary"
                  className="task-assigned__submit"
                  icon={<Send size={15} aria-hidden />}
                  onClick={() => setActive(task)}
                >
                  {task.status === "revision_requested"
                    ? "Submit revision"
                    : "Submit work"}
                </Button>
              )}
            </div>
            {task.description && task.description.trim() !== task.task.trim() && (
              <p className="task-assigned__description">
                {task.description}
              </p>
            )}
            {task.submissionText && (
              <p className="mentor-assigned-tasks__description">
                <strong>Your submission:</strong> {task.submissionText}
              </p>
            )}
            {task.submissionFileUrls?.map((file) => (
              <a
                key={file.url}
                href={fileUrl(file.url)}
                target="_blank"
                rel="noreferrer"
              >
                <Paperclip size={14} /> Submitted: {file.fileName}
              </a>
            ))}
            {task.feedback && (
              <p className="mentor-assigned-tasks__feedback">
                <strong>
                  {task.status === "submitted"
                    ? "Previous advisor feedback:"
                    : "Advisor feedback:"}
                </strong>{" "}
                {task.feedback}
              </p>
            )}
            {(task.status === "submitted"
              ? task.reviewHistory?.length > 0
              : task.reviewHistory?.length > 1) && (
              <details>
                <summary>Previous submissions and reviews</summary>
                {(task.status === "submitted"
                  ? task.reviewHistory
                  : task.reviewHistory.slice(0, -1)
                ).map((entry, index) => (
                  <div key={index}>
                    <p>
                      {entry.decision === "approved"
                        ? "Approved"
                        : "Revision requested"}{" "}
                      · {new Date(entry.at).toLocaleDateString()}:{" "}
                      {entry.feedback}
                    </p>
                    {entry.submissionText && (
                      <p>Submitted: {entry.submissionText}</p>
                    )}
                    {entry.submissionFileUrls?.map((file) => (
                      <a
                        key={file.url}
                        href={fileUrl(file.url)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Submitted file: {file.fileName}
                      </a>
                    ))}
                    {entry.feedbackFileUrls?.map((file) => (
                      <a
                        key={file.url}
                        href={fileUrl(file.url)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Feedback file: {file.fileName}
                      </a>
                    ))}
                  </div>
                ))}
              </details>
            )}
            {task.feedbackFileUrls?.map((file) => (
              <a
                key={file.url}
                href={fileUrl(file.url)}
                target="_blank"
                rel="noreferrer"
              >
                <Paperclip size={14} /> {file.fileName}
              </a>
            ))}
          </article>
        ))}
        </div>
      )}
      {!isLoading && !isError && history.length > 0 && (
        <div className="task-history">
          <h3 className="task-history__title">Completed <span className="task-count">{history.length}</span></h3>
          <ul className="task-history__list">
            {history.map((task) => (
              <li key={task.id} className="task-history__item">
                <div className="task-history__row">
                  <CheckCircle2 size={18} className="task-history__icon" aria-hidden />
                  <div className="task-history__main">
                    <strong>{task.task}</strong>
                    <small>From {task.mentorName || "your advisor"} · Due {readableDeadline(task.deadline)}</small>
                  </div>
                  <span className="task-status task-status--approved">Approved</span>
                </div>
                {(task.submissionText || task.feedback || task.submissionFileUrls?.length || task.feedbackFileUrls?.length) ? (
                  <details className="task-history__details">
                    <summary>View submission &amp; feedback</summary>
                    {task.submissionText && <p><strong>Your submission:</strong> {task.submissionText}</p>}
                    {task.submissionFileUrls?.map((file) => (
                      <a key={file.url} href={fileUrl(file.url)} target="_blank" rel="noreferrer"><Paperclip size={14} /> {file.fileName}</a>
                    ))}
                    {task.feedback && <p className="task-history__feedback"><strong>Feedback:</strong> {task.feedback}</p>}
                    {task.feedbackFileUrls?.map((file) => (
                      <a key={file.url} href={fileUrl(file.url)} target="_blank" rel="noreferrer"><Paperclip size={14} /> {file.fileName}</a>
                    ))}
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Modal
        title={active ? `Submit: ${active.task}` : "Submit work"}
        open={!!active}
        onCancel={close}
        onOk={send}
        okText="Send for review"
        confirmLoading={submitting || sending}
        destroyOnClose
      >
        {active?.description && <p>{active.description}</p>}
        <Input.TextArea
          rows={5}
          placeholder="Describe what you completed or ask a question"
          value={response}
          onChange={(event) => setResponse(event.target.value)}
        />
        <Upload
          beforeUpload={() => false}
          fileList={files}
          onChange={({ fileList }) => setFiles(fileList.slice(-3))}
          multiple
        >
          <Button style={{ marginTop: 12 }}>Attach files (up to 3)</Button>
        </Upload>
      </Modal>
    </section>
  );
}
