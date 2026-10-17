import { useEffect } from "react";
import { Form, Input, InputNumber, Modal, Select, message } from "antd";
import type { AttendanceInput } from "src/app/services/sessions";

export type LessonRecordInput = Omit<AttendanceInput, "outcome"> & {
  outcome: AttendanceInput["outcome"] | "cancelled";
};

export default function LessonRecordModal({
  open,
  title,
  value,
  plannedMinutes,
  allowCancelled = false,
  correction = false,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  value?: Partial<LessonRecordInput> | null;
  plannedMinutes: number;
  allowCancelled?: boolean;
  correction?: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (input: LessonRecordInput) => Promise<void>;
}) {
  const [form] = Form.useForm<LessonRecordInput>();
  const outcome = Form.useWatch("outcome", form);
  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        outcome: value?.outcome ?? "held",
        attendance: value?.attendance ?? "present",
        actualDurationMinutes: value?.actualDurationMinutes ?? plannedMinutes,
        sharedNotes: value?.sharedNotes ?? "",
      });
    }
  }, [open, value, plannedMinutes, form]);
  const save = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    try {
      await onSave({
        ...values,
        attendance: values.outcome === "held" ? values.attendance : undefined,
        actualDurationMinutes:
          values.outcome === "held" ? values.actualDurationMinutes : undefined,
      });
      message.success("Lesson record saved");
      onClose();
    } catch (error) {
      message.error(
        (error as { data?: { message?: string } })?.data?.message ||
          "Could not save the lesson record",
      );
    }
  };
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      onOk={() => void save()}
      confirmLoading={saving}
      okText="Save record"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="outcome"
          label="Lesson outcome"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: "held", label: "Held" },
              { value: "student_no_show", label: "Student no-show" },
              { value: "mentor_no_show", label: "Mentor no-show" },
              ...(allowCancelled
                ? [{ value: "cancelled", label: "Cancelled" }]
                : []),
            ]}
          />
        </Form.Item>
        {outcome === "held" && (
          <>
            <Form.Item
              name="attendance"
              label="Student attendance"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: "present", label: "Present" },
                  { value: "late", label: "Late" },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="actualDurationMinutes"
              label="Actual teaching time (minutes)"
              rules={[
                { required: true },
                { type: "integer", min: 1, max: 480 },
              ]}
            >
              <InputNumber min={1} max={480} precision={0} />
            </Form.Item>
          </>
        )}
        <Form.Item name="sharedNotes" label="Shared notes">
          <Input.TextArea rows={3} maxLength={5000} />
        </Form.Item>
        {correction && (
          <Form.Item
            name="reason"
            label="Correction reason"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
