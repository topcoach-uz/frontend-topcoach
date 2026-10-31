import { useState } from "react";
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";
import { FileText, Plus, Search } from "lucide-react";
import {
  useGetSharedMentorApplicationsQuery,
  useCreateSharedMentorApplicationMutation,
  useUpdateSharedMentorApplicationMutation,
  useConvertEarlierMentorPlanMutation,
  type SharedApplication,
  type EarlierMentorPlan,
  type ApplicationEdit,
} from "src/app/services/student-hub/sharedApplicationsApi";
import ApplicationRequirements from "src/pages/student-hub/applicant/ApplicationRequirements";
import { useUpdateMentorApplicationRequirementsMutation } from "src/app/services/student-hub/applicationTrackingApi";
import { formatDate } from "../utils";
import "./SharedApplications.scss";
const statuses = [
  ["researching", "Saved for later"],
  ["applying", "Preparing"],
  ["submitted", "Submitted"],
  ["under_review", "Under review"],
  ["accepted", "Accepted"],
  ["rejected", "Not accepted"],
  ["waitlisted", "Waitlisted"],
  ["deferred", "Deferred"],
].map(([value, label]) => ({ value, label }));
const label = (s: string) =>
  statuses.find((item) => item.value === s)?.label || s;
const errorText = (error: unknown) =>
  (error as { data?: { message?: string } })?.data?.message ||
  "Could not save. Your changes are still here.";
type Editor =
  | { kind: "new" }
  | { kind: "edit"; app: SharedApplication }
  | { kind: "convert"; plan: EarlierMentorPlan };
export default function SharedApplications({
  studentId,
}: {
  studentId: string;
}) {
  const query = useGetSharedMentorApplicationsQuery(studentId, {
    pollingInterval: 10000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const [create, { isLoading: creating }] =
    useCreateSharedMentorApplicationMutation();
  const [update, { isLoading: updating }] =
    useUpdateSharedMentorApplicationMutation();
  const [convert, { isLoading: converting }] =
    useConvertEarlierMentorPlanMutation();
  const [updateRequirements] = useUpdateMentorApplicationRequirementsMutation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");
  const [form] = Form.useForm();
  const target = Form.useWatch("applicationId", form);
  const saving = creating || updating || converting;
  const apps = query.data?.data ?? [],
    plans = query.data?.legacyPlans ?? [];
  const viewed = apps.find((app) => app.id === detail);
  const rows = apps.filter(
    (app) =>
      (filter === "all" || app.status === filter) &&
      `${app.universityName ?? ""} ${app.major ?? ""} ${app.intake ?? ""}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  function open(next: Editor) {
    setSaveError("");
    form.resetFields();
    const app = next.kind === "edit" ? next.app : null;
    form.setFieldsValue({
      applicationId: "new",
      universityName:
        app?.universityName ??
        (next.kind === "convert" ? next.plan.program : ""),
      major: app?.major ?? "",
      degreeLevel: app?.degreeLevel ?? "bachelor",
      intake: app?.intake ?? "",
      status: app?.status ?? "researching",
      deadline: app?.deadline
        ? dayjs(app.deadline)
        : next.kind === "convert" && next.plan.deadline
          ? dayjs(next.plan.deadline)
          : null,
      sharedNotes: app?.sharedNotes ?? "",
    });
    setEditor(next);
  }
  async function save() {
    if (!editor) return;
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    const { applicationId, deadline, ...rest } = values;
    const data: ApplicationEdit = {
      ...rest,
      deadline: deadline ? deadline.format("YYYY-MM-DD") : null,
    };
    setSaveError("");
    try {
      if (editor.kind === "edit")
        await update({
          student: studentId,
          id: editor.app.id,
          data: { ...data, expectedUpdatedAt: editor.app.updatedAt },
        }).unwrap();
      else if (editor.kind === "convert") {
        const existing = apps.find((app) => app.id === applicationId);
        await convert({
          student: studentId,
          plan: editor.plan.id,
          data:
            applicationId !== "new"
              ? { applicationId, expectedUpdatedAt: existing?.updatedAt }
              : data,
        }).unwrap();
      } else await create({ student: studentId, data }).unwrap();
      setEditor(null);
      message.success("Application saved. The student sees the same record.");
    } catch (error) {
      setSaveError(errorText(error));
    }
  }
  if (query.isLoading)
    return (
      <div className="mc-ws-empty">
        <Spin />
      </div>
    );
  if (query.isError)
    return (
      <Alert
        type="warning"
        showIcon
        message="Applications could not be loaded"
        description="An active application or essay support assignment is required. Existing applications stay saved."
        action={<Button onClick={() => query.refetch()}>Retry</Button>}
      />
    );
  return (
    <section className="mc-shared-apps">
      <div className="mc-ws-section-head">
        <div>
          <h2 className="mc-ws-section-title">
            <FileText size={18} />
            Applications
          </h2>
          <p className="mc-ws-section-copy">
            One application record, shared with your student. Changes appear in
            their Applications workspace.
          </p>
        </div>
        {query.data?.canCreate && (
          <Button
            type="primary"
            icon={<Plus size={15} />}
            onClick={() => open({ kind: "new" })}
          >
            Add application
          </Button>
        )}
      </div>
      <div className="mc-shared-apps-toolbar">
        <Input
          prefix={<Search size={15} />}
          placeholder="Search university, program or intake…"
          aria-label="Search shared applications"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
        <Select
          aria-label="Application status"
          value={filter}
          onChange={setFilter}
          options={[{ value: "all", label: "All statuses" }, ...statuses]}
        />
      </div>
      <div className="mc-ws-card mc-shared-apps-list">
        {!rows.length ? (
          <div className="mc-ws-empty">
            {apps.length
              ? "No applications match your search."
              : "No applications yet. Add one here or ask the student to save their university choices."}
          </div>
        ) : (
          rows.map((app) => (
            <article className="mc-shared-app-row" key={app.id}>
              <div>
                <button
                  className="mc-shared-app-title"
                  onClick={() => setDetail(app.id)}
                >
                  {app.universityName || "University application"}
                </button>
                <p>
                  {[app.major, app.intake].filter(Boolean).join(" · ") ||
                    "Program details not set"}
                </p>
                <small>
                  Application mentor: {app.mentorName || "Not assigned"}
                  {!app.canEditApplication ? " · View only" : ""}
                </small>
              </div>
              <Tag>{label(app.status)}</Tag>
              <div className="mc-shared-app-date">
                <small>Planning deadline</small>
                <span>{formatDate(app.deadline ?? null)}</span>
              </div>
              <Space>
                <Button onClick={() => setDetail(app.id)}>Details</Button>
                {app.canEditApplication && (
                  <Button onClick={() => open({ kind: "edit", app })}>
                    Edit
                  </Button>
                )}
              </Space>
            </article>
          ))
        )}
      </div>
      {!!plans.length && (
        <details className="mc-ws-archive">
          <summary>Earlier mentor notes · {plans.length} to review</summary>
          <p>
            These older notes are read-only. Review each one and attach it to an
            existing application or create an application. Its original stage,
            status and aid details will be preserved.
          </p>
          {plans.map((plan) => (
            <div className="mc-shared-legacy" key={plan.id}>
              <div>
                <strong>{plan.program}</strong>
                <p>
                  {plan.stage} · {plan.status} ·{" "}
                  {formatDate(plan.deadline ?? null)}
                  {plan.aid ? " · Financial aid" : ""}
                </p>
              </div>
              {query.data?.canCreate && (
                <Button onClick={() => open({ kind: "convert", plan })}>
                  Review & convert
                </Button>
              )}
            </div>
          ))}
        </details>
      )}
      <Modal
        title={
          editor?.kind === "convert"
            ? "Convert earlier mentor note"
            : editor?.kind === "edit"
              ? "Edit shared application"
              : "Add shared application"
        }
        open={!!editor}
        onCancel={() => !saving && setEditor(null)}
        onOk={save}
        okText={
          editor?.kind === "convert"
            ? "Save shared application"
            : "Save application"
        }
        confirmLoading={saving}
        maskClosable={!saving}
        closable={!saving}
        cancelButtonProps={{ disabled: saving }}
        destroyOnClose
        width={620}
      >
        {saveError && (
          <Alert
            type="error"
            showIcon
            message={saveError}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={form} layout="vertical" disabled={saving}>
          {editor?.kind === "convert" && (
            <>
              <Alert
                type="info"
                message="Review the original name before saving. A plan may describe a goal rather than a university. Attaching preserves the application's current status, deadline and checklist."
                style={{ marginBottom: 16 }}
              />
              <Form.Item
                name="applicationId"
                label="Where should this note go?"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: "new", label: "Create an application" },
                    ...apps
                      .filter((a) => a.canEditApplication)
                      .map((a) => ({
                        value: a.id,
                        label: [a.universityName, a.major, a.intake]
                          .filter(Boolean)
                          .join(" · "),
                      })),
                  ]}
                />
              </Form.Item>
            </>
          )}
          {(editor?.kind !== "convert" || target === "new") && (
            <>
              <Form.Item
                name="universityName"
                label="University"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Enter the university name",
                  },
                  { max: 255 },
                ]}
              >
                <Input
                  disabled={
                    editor?.kind === "edit" && !!editor.app.universityId
                  }
                />
              </Form.Item>
              <div className="mc-shared-form-grid">
                <Form.Item
                  name="major"
                  label="Program / intended major"
                  rules={[{ max: 255 }]}
                >
                  <Input
                    disabled={
                      editor?.kind === "edit" &&
                      !!(
                        editor.app.programId || editor.app.undergraduateDegreeId
                      )
                    }
                  />
                </Form.Item>
                <Form.Item
                  name="degreeLevel"
                  label="Degree"
                  rules={[{ required: true }]}
                >
                  <Select
                    disabled={
                      editor?.kind === "edit" &&
                      !!(
                        editor.app.programId || editor.app.undergraduateDegreeId
                      )
                    }
                    options={[
                      { value: "bachelor", label: "Bachelor’s" },
                      { value: "master", label: "Master’s" },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="intake" label="Intake" rules={[{ max: 64 }]}>
                  <Input placeholder="e.g. Fall 2027" />
                </Form.Item>
                <Form.Item
                  name="status"
                  label="Application status"
                  rules={[{ required: true }]}
                >
                  <Select options={statuses} />
                </Form.Item>
              </div>
              <Form.Item name="deadline" label="Planning deadline">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name="sharedNotes"
                label="Shared application notes"
                rules={[{ max: 20000 }]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
      <Modal
        title={viewed?.universityName || "Application details"}
        open={!!viewed}
        onCancel={() => setDetail(null)}
        footer={<Button onClick={() => setDetail(null)}>Close</Button>}
        width={700}
      >
        {viewed && (
          <>
            <p>{[viewed.major, viewed.intake].filter(Boolean).join(" · ")}</p>
            <p>
              <Tag>{label(viewed.status)}</Tag>Planning deadline:{" "}
              {formatDate(viewed.deadline ?? null)}
            </p>
            <ApplicationRequirements
              requirements={viewed.requirements}
              updatedAt={viewed.updatedAt}
              onSave={
                viewed.canEditRequirements
                  ? (requirements, expectedUpdatedAt) =>
                      updateRequirements({
                        studentUserId: studentId,
                        id: viewed.id,
                        requirements,
                        expectedUpdatedAt,
                      }).unwrap()
                  : undefined
              }
            />
            <h3>Shared notes</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {viewed.sharedNotes || "No notes yet."}
            </p>
            <small>
              Last updated{" "}
              {viewed.updatedAt
                ? dayjs(viewed.updatedAt).format("D MMM YYYY, HH:mm")
                : "—"}
            </small>
          </>
        )}
      </Modal>
    </section>
  );
}
