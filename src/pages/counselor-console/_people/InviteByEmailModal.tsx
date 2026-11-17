/* ── Counselor Console — invite-by-email modal ────────────────────────────────
   One modal, parameterized by role. The Students page collects the profile it
   will need on day one (name, grade, graduating class, phone); the Staff page
   collects an email and nothing else, because a counselor's profile is theirs
   to fill in. Previously these were two separate modals whose shared half — the
   email field, the validation, the error handling, the success message — had
   already drifted apart.

   The role is fixed by the page that opened the modal and is NOT a form field:
   an invitation reached from the Staff page is a counselor invitation, full
   stop. The old shared page offered a role dropdown, which is precisely the
   ambiguity this restructure removes. */
import { useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Select, message } from "antd";

import {
  useCreateInvitationMutation,
  type OrgMembershipRole,
} from "src/app/services/counselorConsoleApi";
import { useCounselorConsole } from "../CounselorConsoleContext";
import { activeBranches, defaultInviteBranchId } from "./branchHelpers";
import { apiErrorMessage } from "./peopleChrome";

/**
 * Grade bounds mirror the backend's `@IsInt() @Min(1) @Max(13)` on
 * `gradeLevel`. Keeping them in step means a bad grade is caught inline rather
 * than as a 400 the counselor cannot interpret.
 */
export const GRADE_MIN = 1;
export const GRADE_MAX = 13;

interface InviteFormValues {
  name?: string;
  email: string;
  gradeLevel?: number;
  graduationYear?: number;
  phone?: string;
  branchId?: string;
}

export function InviteByEmailModal({
  open,
  onClose,
  orgId,
  orgName,
  role,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
  orgName?: string | null;
  role: OrgMembershipRole;
  onInvited?: () => void;
}) {
  const [form] = Form.useForm<InviteFormValues>();
  const [createInvitation, { isLoading }] = useCreateInvitationMutation();
  const { branches, branchId, hasBranches } = useCounselorConsole();
  const defaultBranchId = defaultInviteBranchId(branches, branchId);

  const [showMore, setShowMore] = useState(false);
  const [submitMode, setSubmitMode] = useState<"close" | "another">("close");

  const isStudent = role === "student";
  const noun = isStudent ? "student" : "counselor";

  const submit = async (keepOpen = false) => {
    setSubmitMode(keepOpen ? "another" : "close");
    let values: InviteFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return; // validation errors are shown inline
    }
    const email = values.email.trim();
    try {
      await createInvitation({
        orgId,
        email,
        role,
        name: values.name?.trim() || undefined,
        // InputNumber already yields a number (or null/undefined when blank);
        // never send the raw string — `gradeLevel` is a smallint server-side.
        gradeLevel: values.gradeLevel ?? undefined,
        graduationYear: values.graduationYear ?? undefined,
        phone: values.phone?.trim() || undefined,
        branchId: hasBranches
          ? (values.branchId ?? defaultBranchId)
          : undefined,
      }).unwrap();
      // The email itself goes out in the background (it may retry a
      // throttled relay for a while) — the invitations list shows
      // Sending / Sent / Not delivered per row.
      message.success(`Invitation created. Emailing ${email} now.`);
      if (keepOpen) {
        // Keep the modal (and the chosen branch) for the next invite.
        form.resetFields([
          "name",
          "email",
          "gradeLevel",
          "graduationYear",
          "phone",
        ]);
        onInvited?.();
      } else {
        form.resetFields();
        onClose();
        onInvited?.();
      }
    } catch (err) {
      message.error(
        apiErrorMessage(
          err,
          "Could not send the invitation. Please try again.",
        ),
      );
    }
  };

  return (
    <Modal
      title={isStudent ? "Invite a student" : "Invite a counselor"}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>,
        isStudent ? (
          <Button
            key="another"
            onClick={() => submit(true)}
            loading={isLoading && submitMode === "another"}
            disabled={isLoading && submitMode !== "another"}
          >
            Send &amp; invite another
          </Button>
        ) : null,
        <Button
          key="send"
          type="primary"
          className="cc-invite-primary"
          onClick={() => submit(false)}
          loading={isLoading && submitMode === "close"}
          disabled={isLoading && submitMode !== "close"}
        >
          Send invitation
        </Button>,
      ]}
      className="cc-invite-modal"
      destroyOnClose
    >
      <p className="cc-invite-add-help">
        Email {isStudent ? "someone" : "a counselor"} who does not yet have a
        TopCoach account. They will get an invitation to join{" "}
        <b>{orgName ?? "this organization"}</b> as a {noun}.
      </p>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ branchId: defaultBranchId }}
      >
        {isStudent ? (
          <Form.Item name="name" label="Full name">
            <Input placeholder="Jane Doe" autoComplete="off" />
          </Form.Item>
        ) : null}
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "An email is required" },
            { type: "email", message: "Enter a valid email" },
          ]}
        >
          <Input
            placeholder={
              isStudent ? "jane@example.com" : "counselor@example.com"
            }
            autoComplete="off"
            onPressEnter={() => submit(false)}
          />
        </Form.Item>
        {hasBranches ? (
          <Form.Item name="branchId" label="Branch">
            <Select
              options={activeBranches(branches).map((b) => ({
                value: b.id,
                label: b.name,
              }))}
            />
          </Form.Item>
        ) : null}
        {isStudent ? (
          <>
            <Button
              type="link"
              size="small"
              className="cc-invite-more-toggle"
              aria-expanded={showMore}
              onClick={() => setShowMore((v) => !v)}
              style={{ paddingInline: 0, marginBottom: 8 }}
            >
              {showMore ? "Fewer details" : "More details"}
            </Button>
            <div hidden={!showMore}>
              <div className="cc-invite-form-row">
                <Form.Item
                  name="gradeLevel"
                  label="Grade"
                  /* A number, not "11th" — see GRADE_MIN/GRADE_MAX. */
                  rules={[
                    {
                      type: "number",
                      min: GRADE_MIN,
                      max: GRADE_MAX,
                      message: `Grade must be between ${GRADE_MIN} and ${GRADE_MAX}`,
                    },
                  ]}
                >
                  <InputNumber
                    placeholder="11"
                    controls={false}
                    min={GRADE_MIN}
                    max={GRADE_MAX}
                    precision={0}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item name="graduationYear" label="Graduation year">
                  <InputNumber
                    placeholder="2027"
                    controls={false}
                    min={1900}
                    max={2100}
                    precision={0}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </div>
              <Form.Item name="phone" label="Phone">
                <Input placeholder="+1 555 000 0000" autoComplete="off" />
              </Form.Item>
            </div>
          </>
        ) : null}
      </Form>
    </Modal>
  );
}

export default InviteByEmailModal;
