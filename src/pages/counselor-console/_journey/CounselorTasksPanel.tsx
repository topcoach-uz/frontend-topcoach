import { useState } from "react";
import { Alert, Button, Form, Input, Modal, Skeleton, message } from "antd";
import { useGetMeQuery } from "src/app/services/users";
import {
  useGetStudentJourneyTasksQuery,
  type StudentJourneyTask,
} from "src/app/services/student-hub/studentJourneyReadonlyApi";
import { useReviewStudentTaskMutation } from "src/app/services/orgStudentActionsApi";
import { CcPill } from "../components/CcPill";
import "./CounselorTasksPanel.scss";
import { hostName } from "src/app/services/api/const";

const labels = {
  assigned: "Awaiting submission",
  submitted: "Needs review",
  approved: "Approved",
  revision_requested: "Revision requested",
};

export default function CounselorTasksPanel({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  const { data: me } = useGetMeQuery();
  const { data, isLoading, isError, refetch } =
    useGetStudentJourneyTasksQuery(userId);
  const [selected, setSelected] = useState<StudentJourneyTask | null>(null);
  const [review, { isLoading: saving }] = useReviewStudentTaskMutation();
  const [form] = Form.useForm<{ feedback: string }>();
  const [error, setError] = useState("");
  const canReview =
    selected?.status === "submitted" && selected.mentorUserId === me?.id;

  async function submit(decision: "approved" | "revision_requested") {
    if (!selected || !canReview) return;
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setError("");
    try {
      await review({
        orgId,
        userId,
        taskId: selected.id,
        feedback: values.feedback.trim(),
        decision,
      }).unwrap();
      message.success(
        decision === "approved" ? "Task approved" : "Revision requested",
      );
      setSelected(null);
      form.resetFields();
    } catch (cause: any) {
      setError(
        cause?.data?.message ||
          "Could not save the review. Your feedback is still here.",
      );
    }
  }

  if (isLoading) return <Skeleton active />;
  if (isError)
    return (
      <Alert
        type="error"
        message="Could not load tasks"
        action={<Button onClick={() => refetch()}>Try again</Button>}
      />
    );
  const tasks = data?.data ?? [];
  return (
    <section className="cc-task-review" aria-label="Student tasks">
      {tasks.length === 0 ? (
        <p className="cc-task-review-empty">
          No tasks yet. Assign a follow-up to help this student take their next
          step.
        </p>
      ) : (
        <div className="cc-task-review-list">
          {tasks.map((task) => (
            <article key={task.id} className="cc-task-review-card">
              <div>
                <h3>{task.task}</h3>
                <p>
                  Due {task.deadline}
                  {task.mentorUserId === me?.id ? " · Assigned by you" : ""}
                </p>
              </div>
              <CcPill
                variant={
                  task.status === "approved"
                    ? "success"
                    : task.status === "submitted"
                      ? "warning"
                      : "neutral"
                }
              >
                {labels[task.status] ?? "Awaiting submission"}
              </CcPill>
              <Button
                className="cc-task-review-action"
                onClick={() => {
                  setSelected(task);
                  setError("");
                  form.resetFields();
                }}
              >
                {task.status === "submitted" && task.mentorUserId === me?.id
                  ? "Review submission"
                  : "View task"}
              </Button>
            </article>
          ))}
        </div>
      )}
      <Modal
        open={!!selected}
        title={selected?.task}
        onCancel={() => setSelected(null)}
        destroyOnClose
        className="cc-task-review-modal"
        footer={
          canReview ? (
            <div className="cc-task-review-footer">
              <Button
                onClick={() => submit("revision_requested")}
                disabled={saving}
              >
                Request revision
              </Button>
              <Button
                type="primary"
                onClick={() => submit("approved")}
                loading={saving}
              >
                Approve task
              </Button>
            </div>
          ) : (
            <Button onClick={() => setSelected(null)}>Done</Button>
          )
        }
      >
        {selected && (
          <>
            {selected.description && (
              <section>
                <h3>Instructions</h3>
                <p className="cc-task-review-text">{selected.description}</p>
              </section>
            )}
            <section>
              <h3>Student submission</h3>
              <p className="cc-task-review-text">
                {selected.submissionText || "No written response yet."}
              </p>
              {selected.submissionFileUrls
                ?.filter((file) => file.url.startsWith("/uploads/"))
                .map((file) => (
                  <p key={file.url}>
                    <a
                      href={`${hostName}${file.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {file.fileName}
                    </a>
                  </p>
                ))}
            </section>
            {selected.feedback && (
              <section>
                <h3>Previous feedback</h3>
                <p className="cc-task-review-text">{selected.feedback}</p>
              </section>
            )}
            {canReview ? (
              <Form form={form} layout="vertical">
                <Form.Item
                  name="feedback"
                  label="Your feedback"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: "Add feedback for the student",
                    },
                    {
                      max: 5000,
                      message: "Keep feedback under 5,000 characters",
                    },
                  ]}
                >
                  <Input.TextArea
                    rows={5}
                    maxLength={5000}
                    placeholder="Explain what worked and what to improve."
                  />
                </Form.Item>
              </Form>
            ) : selected.status === "submitted" ? (
              <p>Only the person who assigned this task can review it.</p>
            ) : null}
            {error && <Alert type="error" message={error} role="alert" />}
          </>
        )}
      </Modal>
    </section>
  );
}
