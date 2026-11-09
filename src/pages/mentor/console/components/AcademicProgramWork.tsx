import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  message,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  useGetMentorProgramEnrollmentsQuery,
  useRecordMentorProgramWorkMutation,
} from "src/app/services/mentorProgramsApi";
import { useMentorConsole } from "../MentorConsoleContext";
import {
  hours,
  PROGRAM_LABELS,
  ROLE_LABELS,
  programHours,
} from "../programDisplay";
import {
  readPendingWork,
  storePendingWork,
  type ProgramWorkSubmission,
} from "../programWorkRetry";

type Draft = {
  assignmentId: string;
  date: Dayjs;
  minutes: number;
  description: string;
};
const tashkentDay = (value: string | number) =>
  new Date(new Date(value).getTime() + 5 * 3600000).toISOString().slice(0, 10);

/** The same enrollment and work-log API used by the program hour ledger. */
export default function AcademicProgramWork({
  studentId,
}: {
  studentId?: string;
}) {
  const { id: mentorId, isMentor } = useMentorConsole();
  const query = useGetMentorProgramEnrollmentsQuery(undefined, {
    skip: !isMentor,
    refetchOnMountOrArgChange: true,
  });
  const [record, { isLoading: saving }] = useRecordMentorProgramWorkMutation();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<ProgramWorkSubmission | null>(() =>
    readPendingWork(mentorId),
  );
  const [form] = Form.useForm<Draft>();
  const assignmentId = Form.useWatch("assignmentId", form);
  const enrollments = (query.data?.data ?? []).filter(
    (e) => !studentId || e.studentUserId === studentId,
  );
  const selected = enrollments.find((e) => e.assignmentId === assignmentId);

  const start = (nextAssignmentId?: string) => {
    if (pending) {
      form.setFieldsValue({
        assignmentId: enrollments.find((e) => e.id === pending.id)
          ?.assignmentId,
        date: dayjs(pending.body.date),
        minutes: pending.body.actualDurationMinutes,
        description: pending.body.description,
      });
    } else {
      setError("");
      form.resetFields();
      form.setFieldsValue({
        assignmentId: nextAssignmentId ?? enrollments[0]?.assignmentId,
        date: dayjs(tashkentDay(Date.now())),
        minutes: 60,
      });
    }
    setOpen(true);
  };
  const save = async () => {
    let submission = pending;
    if (!submission) {
      const values = await form.validateFields().catch(() => null);
      if (!values) return;
      const enrollment = enrollments.find(
        (e) => e.assignmentId === values.assignmentId,
      );
      if (!enrollment) return;
      submission = {
        id: enrollment.id,
        body: {
          mentorUserId: mentorId,
          date: values.date.format("YYYY-MM-DD"),
          actualDurationMinutes: values.minutes,
          description: values.description.trim(),
          reason: "Mentor recorded completed program work",
          requestId: crypto.randomUUID(),
        },
      };
    }
    setError("");
    storePendingWork(mentorId, submission);
    try {
      await record(submission).unwrap();
      setPending(null);
      storePendingWork(mentorId, null);
      setOpen(false);
      form.resetFields();
      message.success("Program work recorded. Hours updated.");
    } catch (failure) {
      const status = (failure as { status?: number | string }).status;
      const rejected =
        typeof status === "number" && status >= 400 && status < 500;
      // A lost response may have committed. Retry the exact request ID and
      // payload so one session cannot charge the hour budget twice.
      setPending(rejected ? null : submission);
      if (rejected) storePendingWork(mentorId, null);
      const detail = (failure as { data?: { message?: string | string[] } })
        .data?.message;
      setError(
        rejected
          ? (Array.isArray(detail) ? detail.join(", ") : detail) ||
              "Could not record work. Refresh your assignments and check the details."
          : "The save could not be confirmed. Retry to confirm the same work without recording it twice.",
      );
      if (rejected) void query.refetch();
    }
  };

  if (!isMentor) return null;
  return (
    <section aria-label="Academic program work" style={{ marginBottom: 24 }}>
      {query.isLoading && <Spin />}
      {query.isError && (
        <Alert
          type="warning"
          message="Could not load program assignments"
          action={<Button onClick={() => void query.refetch()}>Retry</Button>}
        />
      )}
      {pending && !open && (
        <Alert
          type="warning"
          message="A program work save needs confirmation"
          action={<Button onClick={() => start()}>Confirm save</Button>}
        />
      )}
      {enrollments.length > 0 && (
        <Card
          className="mc-panel"
          title="Academic programs"
          extra={
            <Button type="primary" onClick={() => start()}>
              {pending ? "Confirm save" : "Record program work"}
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {enrollments.map((e) => (
              <div key={e.assignmentId}>
                <strong>
                  {studentId ? "" : `${e.studentName || "Student"} · `}
                  {PROGRAM_LABELS[e.program]}
                </strong>
                <div>
                  {ROLE_LABELS[e.role] ?? e.role} · {programHours(e)}
                  {e.remainingMinutes != null
                    ? ` · ${hours(e.remainingMinutes)} remaining`
                    : ""}
                </div>
              </div>
            ))}
          </Space>
        </Card>
      )}
      <Modal
        open={open}
        title="Record completed program work"
        okText={pending ? "Confirm save" : "Record work"}
        confirmLoading={saving}
        onOk={() => void save()}
        onCancel={() => !saving && setOpen(false)}
        closable={!saving}
        maskClosable={!saving}
      >
        {error && (
          <Alert type="error" message={error} style={{ marginBottom: 16 }} />
        )}
        <Form form={form} layout="vertical" disabled={saving || !!pending}>
          <Form.Item
            name="assignmentId"
            label="Student and program"
            rules={[{ required: true }]}
          >
            <Select
              options={enrollments.map((e) => ({
                value: e.assignmentId,
                label: `${e.studentName || "Student"} · ${PROGRAM_LABELS[e.program]} · ${ROLE_LABELS[e.role] ?? e.role}`,
              }))}
            />
          </Form.Item>
          {selected && (
            <p>
              {programHours(selected)}
              {selected.remainingMinutes != null
                ? ` · ${hours(selected.remainingMinutes)} remaining`
                : ""}
            </p>
          )}
          <Form.Item
            name="date"
            label="Work date (Tashkent)"
            rules={[{ required: true }]}
          >
            <DatePicker
              disabledDate={(date) => {
                const value = date.format("YYYY-MM-DD");
                return (
                  value > tashkentDay(Date.now()) ||
                  (!!selected &&
                    (value < tashkentDay(selected.startsAt) ||
                      value < tashkentDay(selected.assignedAt)))
                );
              }}
            />
          </Form.Item>
          <Form.Item
            name="minutes"
            label="Time spent (minutes)"
            rules={[
              { required: true },
              {
                type: "integer",
                min: 1,
                max: 480,
                message: "Enter 1–480 whole minutes",
              },
            ]}
          >
            <InputNumber min={1} max={480} precision={0} />
          </Form.Item>
          <Form.Item
            name="description"
            label="Work completed"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Describe the work completed",
              },
            ]}
          >
            <Input.TextArea rows={3} maxLength={4000} />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}
