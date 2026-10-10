import { useState } from "react";
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Progress,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  useGetAdminUserSetupQuery,
  useCompleteAdminOnboardingMutation,
  useChangeAdminUserPasswordMutation,
} from "src/app/services/adminUserSetupApi";
import { useAdminConsole } from "../AdminConsoleContext";

const labels: Record<string, string> = {
  goal: "Choose path",
  basics: "Basic details",
  education: "Education",
  direction: "Study plans",
  support: "Support",
  referral: "Referral source",
  intro: "Introduction",
  telegram: "Telegram",
  review: "Review",
  role: "Choose role",
  source: "Referral source",
  video: "Introduction",
  contact: "Contact details",
  mentor_application: "Mentor application",
  "mentor-profile": "Mentor profile",
  "mentor-academic": "Academic background",
  "mentor-story": "Mentor story",
  "mentor-offer": "Mentoring offer",
  "mentor-background": "Expertise",
  "mentor-review": "Application review",
};
function failureMessage(failure: unknown) {
  const message = (failure as { data?: { message?: string | string[] } })?.data
    ?.message;
  return Array.isArray(message)
    ? message.join(" ")
    : message || "Could not save changes. Please try again.";
}
export default function UserSetupControls({ userId }: { userId: string }) {
  const { role } = useAdminConsole();
  const allowed = role === "SuperAdmin" || role === "Owner";
  const { data, isFetching, isError, refetch } = useGetAdminUserSetupQuery(
    userId,
    { skip: !allowed },
  );
  const [complete, completion] = useCompleteAdminOnboardingMutation();
  const [changePassword, passwordChange] = useChangeAdminUserPasswordMutation();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form] = Form.useForm<{ password: string; confirmation: string }>();
  if (!allowed) return null;
  async function finishOnboarding() {
    if (!data) return;
    setError("");
    setNotice("");
    try {
      await complete({ userId, expectedRevision: data.revision }).unwrap();
      setCompleteOpen(false);
      setNotice("Onboarding marked complete.");
    } catch (failure) {
      setError(failureMessage(failure));
    }
  }
  async function savePassword() {
    const values = await form.validateFields();
    setError("");
    setNotice("");
    try {
      await changePassword({ userId, password: values.password }).unwrap();
      form.resetFields();
      setPasswordOpen(false);
      setNotice("Password changed.");
    } catch (failure) {
      setError(failureMessage(failure));
    }
  }
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Text strong>Onboarding progress</Typography.Text>
      {isFetching ? (
        <Spin />
      ) : isError || !data ? (
        <Alert
          type="error"
          showIcon
          message="Could not load onboarding"
          action={<Button onClick={() => void refetch()}>Retry</Button>}
        />
      ) : (
        <>
          <Typography.Text>
            {data.completedAt
              ? "Passed · " + new Date(data.completedAt).toLocaleDateString()
              : data.currentStep
                ? `Current step: ${labels[data.currentStep.replace(/^[bm]-/, "")] ?? data.currentStep}`
                : "Not started"}
          </Typography.Text>
          {data.percent !== null ? (
            <Progress
              percent={data.percent}
              status={data.completedAt ? "success" : "normal"}
              strokeColor="var(--ac-accent, #10b981)"
            />
          ) : (
            <Typography.Text type="secondary">
              Progress unavailable for this saved step.
            </Typography.Text>
          )}
          <Space wrap>
            {data.steps.map((step) => (
              <Tag key={step.key} color={step.passed ? "green" : undefined}>
                {step.passed ? "✓ " : ""}
                {labels[step.key] ?? step.key}
              </Tag>
            ))}
          </Space>
          <Typography.Text type="secondary">
            Progress follows the saved wizard step. Passed steps may include
            steps the user skipped.
          </Typography.Text>
          <Space wrap>
            <Button
              disabled={!!data.completedAt || completion.isLoading}
              onClick={() => {
                setError("");
                setCompleteOpen(true);
              }}
            >
              Mark onboarding passed
            </Button>
            <Button
              disabled={!data.canChangePassword}
              onClick={() => {
                setError("");
                form.resetFields();
                setPasswordOpen(true);
              }}
            >
              Change password
            </Button>
          </Space>
          {!data.canChangePassword && (
            <Typography.Text type="secondary">
              This account uses social sign-in. Password changes are available
              for email accounts.
            </Typography.Text>
          )}
        </>
      )}
      {notice && <Alert type="success" message={notice} showIcon />}
      {error && !passwordOpen && !completeOpen && (
        <Alert type="error" message={error} showIcon />
      )}
      <Modal
        title="Mark onboarding passed?"
        open={completeOpen}
        onCancel={() => {
          if (!completion.isLoading) setCompleteOpen(false);
        }}
        onOk={() => void finishOnboarding()}
        confirmLoading={completion.isLoading}
        okText="Mark passed"
        cancelButtonProps={{ disabled: completion.isLoading }}
      >
        <Typography.Paragraph>
          This admin override lets the user continue past onboarding. It does
          not fill missing profile answers or approve a mentor application.
        </Typography.Paragraph>
        {error && <Alert type="error" message={error} showIcon />}
      </Modal>
      <Modal
        title="Change user password"
        open={passwordOpen}
        onCancel={() => {
          if (!passwordChange.isLoading) {
            setPasswordOpen(false);
            form.resetFields();
          }
        }}
        onOk={() => void savePassword().catch(() => undefined)}
        confirmLoading={passwordChange.isLoading}
        okText="Save password"
        cancelButtonProps={{ disabled: passwordChange.isLoading }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" disabled={passwordChange.isLoading}>
          <Form.Item
            name="password"
            label="New password"
            rules={[
              { required: true },
              { min: 12, message: "Use at least 12 characters." },
              {
                validator: (_, value: string) =>
                  !value || new TextEncoder().encode(value).length <= 72
                    ? Promise.resolve()
                    : Promise.reject(new Error("Use at most 72 UTF-8 bytes.")),
              },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmation"
            label="Confirm password"
            dependencies={["password"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  value === getFieldValue("password")
                    ? Promise.resolve()
                    : Promise.reject(new Error("Passwords do not match.")),
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
        {error && <Alert type="error" message={error} showIcon />}
      </Modal>
    </Space>
  );
}
