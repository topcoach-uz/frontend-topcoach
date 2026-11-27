import { useState } from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
} from "antd";
import type { Dayjs } from "dayjs";
import type { CreateScholarshipApplicationRequest } from "src/app/services/student-hub/types";
import { useUnsavedApplicationChanges } from "./useUnsavedApplicationChanges";

export const scholarshipStatuses = [
  "researching",
  "eligible",
  "applying",
  "submitted",
  "under_review",
  "awarded",
  "rejected",
  "expired",
];
export const scholarshipTypes = [
  { value: "merit", label: "Merit-based" },
  { value: "need", label: "Need-based" },
  { value: "athletic", label: "Athletic" },
  { value: "academic", label: "Academic" },
  { value: "minority", label: "Diversity" },
  { value: "major", label: "Major-specific" },
  { value: "other", label: "Other" },
];
export const scholarshipLabel = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
type Values = Omit<
  CreateScholarshipApplicationRequest,
  "applicationDeadline"
> & { applicationDeadline?: Dayjs | null };
export default function ScholarshipForm({
  initialValues,
  onSave,
  onCancel,
  onSaved,
  saving,
  editing = false,
}: {
  initialValues?: Values;
  onSave: (data: CreateScholarshipApplicationRequest) => Promise<void>;
  onCancel: () => void;
  onSaved?: () => void;
  saving: boolean;
  editing?: boolean;
}) {
  const [dirty, setDirty] = useState(false);
  const { canLeave, markSaved } = useUnsavedApplicationChanges(dirty);
  return (
    <Form<Values>
      layout="vertical"
      initialValues={{
        status: "researching",
        currency: "USD",
        ...initialValues,
      }}
      onValuesChange={() => setDirty(true)}
      onFinish={async (values) => {
        try {
          await onSave({
            ...values,
            scholarshipName: values.scholarshipName?.trim(),
            organization: values.organization?.trim(),
            currency: values.currency?.toUpperCase(),
            scholarshipType: values.scholarshipType ?? null,
            eligibility: values.eligibility?.trim() || "",
            essayPrompt: values.essayPrompt?.trim() || "",
            essayRequired: values.essayRequired ?? false,
            amount: values.amount ?? null,
            applicationDeadline:
              values.applicationDeadline?.format("YYYY-MM-DD") ?? null,
          });
          markSaved();
          setDirty(false);
          onSaved?.();
        } catch {
          /* The caller displays the failure; keep the form and its dirty state. */
        }
      }}
    >
      <h2 className="application-form-section">Scholarship details</h2>
      <Form.Item
        name="scholarshipName"
        label="Scholarship name"
        rules={[{ required: true, whitespace: true, max: 255 }]}
      >
        <Input maxLength={255} placeholder="e.g. Global Scholars Award" />
      </Form.Item>
      <Form.Item
        name="organization"
        label="Organization"
        rules={[{ required: true, whitespace: true, max: 255 }]}
      >
        <Input
          maxLength={255}
          placeholder="University, foundation or organization"
        />
      </Form.Item>
      <div className="applicant-form-grid">
        <Form.Item name="scholarshipType" label="Scholarship type (optional)">
          <Select
            allowClear
            placeholder="Choose a type"
            options={scholarshipTypes}
          />
        </Form.Item>
        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select
            options={scholarshipStatuses.map((value) => ({
              value,
              label: scholarshipLabel(value),
            }))}
          />
        </Form.Item>
      </div>
      <h2 className="application-form-section">Funding & deadline</h2>
      <p className="application-form-help">
        You can save this scholarship while the amount or deadline is still
        unknown.
      </p>
      <div className="applicant-form-grid">
        <Form.Item name="amount" label="Amount (optional)">
          <InputNumber
            min={0}
            max={9999999999.99}
            precision={2}
            style={{ width: "100%" }}
            placeholder="Not confirmed yet"
          />
        </Form.Item>
        <Form.Item
          name="currency"
          label="Currency"
          rules={[
            {
              required: true,
              pattern: /^[A-Za-z]{3}$/,
              message:
                "Enter a three-letter currency code, such as USD or EUR.",
            },
          ]}
        >
          <Input
            maxLength={3}
            placeholder="e.g. USD, EUR, GBP"
            style={{ textTransform: "uppercase" }}
          />
        </Form.Item>
      </div>
      <Form.Item
        name="applicationDeadline"
        label="Application deadline (optional)"
      >
        <DatePicker />
      </Form.Item>
      <h2 className="application-form-section">Requirements & notes</h2>
      <Form.Item name="eligibility" label="Eligibility requirements (optional)">
        <Input.TextArea rows={3} maxLength={10000} />
      </Form.Item>
      <Form.Item name="essayRequired" valuePropName="checked">
        <Checkbox>Essay required</Checkbox>
      </Form.Item>
      <Form.Item
        name="essayPrompt"
        label="Application requirements / essay prompt (optional)"
      >
        <Input.TextArea rows={3} maxLength={10000} />
      </Form.Item>
      <Form.Item name="notes" label="Private notes (optional)">
        <Input.TextArea rows={3} maxLength={10000} />
      </Form.Item>
      <div className="applicant-actions applicant-actions--end">
        <Button
          disabled={saving}
          onClick={() => {
            if (canLeave()) onCancel();
          }}
        >
          Cancel
        </Button>
        <Button type="primary" htmlType="submit" loading={saving}>
          {editing ? "Save scholarship" : "Add scholarship"}
        </Button>
      </div>
    </Form>
  );
}
