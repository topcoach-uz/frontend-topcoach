import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
  message,
} from "antd";
import { ArrowLeft, History, MessageSquareText, Plus, Save } from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  useCreateStudentEssayMutation,
  useGetStudentEssayQuery,
  useGetStudentEssaysQuery,
  useGetEssayVersionsQuery,
  useCreateEssayVersionMutation,
  useUpdateStudentEssayMutation,
} from "src/app/services/student-hub/essayManagementApi";
import { useGetCollegeApplicationsQuery } from "src/app/services/student-hub/applicationTrackingApi";
import type {
  CreateStudentEssayRequest,
  StudentEssay,
} from "src/app/services/student-hub/types";
import { useTypedSelector } from "src/app/store";
import {
  ApplicantPage,
  Breadcrumb,
  QueryState,
  displayDate,
} from "./ApplicantPage";
import { useApplicantOverview } from "./ApplicantOverviewContext";

const essayTypes: Array<{ value: StudentEssay["essayType"]; label: string }> = [
  { value: "personal_statement", label: "Personal statement" },
  { value: "supplemental", label: "Supplemental essay" },
  { value: "why_school", label: "Why this university?" },
  { value: "why_major", label: "Why this major?" },
  { value: "scholarship", label: "Scholarship essay" },
  { value: "other", label: "Other writing" },
];
const masterEssayTypes: typeof essayTypes = [
  { value: "personal_statement", label: "Statement of purpose / personal statement" },
  { value: "supplemental", label: "Program-specific statement" },
  { value: "why_school", label: "Why this university or program?" },
  { value: "why_major", label: "Why this field?" },
  { value: "scholarship", label: "Scholarship essay" },
  { value: "other", label: "Other writing" },
];

export default function ApplicantEssaysPage() {
  const isMasters = useApplicantOverview().currentData?.profile?.targetDegree === "master";
  const writingTypes = isMasters ? masterEssayTypes : essayTypes;
  const defaultTitle = isMasters ? "Statement of purpose" : "Personal statement";
  const query = useGetStudentEssaysQuery({ page: 1, limit: 100 });
  const applications = useGetCollegeApplicationsQuery({ page: 1, limit: 100 });
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [createEssay, createState] = useCreateStudentEssayMutation();
  const [form] = Form.useForm<CreateStudentEssayRequest>();
  useEffect(() => {
    if (!location.pathname.endsWith("/new")) return;
    form.setFieldsValue({
      essayType: "personal_statement",
      title: defaultTitle,
      prompt: "",
      collegeApplicationId: params.get("application") ?? undefined,
    });
  }, [location.pathname, params.get("application"), defaultTitle]);
  const open = () => {
    form.setFieldsValue({
      essayType: "personal_statement",
      title: defaultTitle,
      prompt: "",
      collegeApplicationId: params.get("application") ?? undefined,
    });
    const next = new URLSearchParams(params);
    next.set("action", "new");
    setParams(next);
  };
  const close = () => {
    const next = new URLSearchParams(params);
    next.delete("action");
    setParams(next);
  };
  const create = async (values: CreateStudentEssayRequest) => {
    try {
      const result = await createEssay({ ...values, content: "" }).unwrap();
      const entity =
        result && typeof result === "object" && "data" in result
          ? result.data
          : (result as unknown as StudentEssay);
      message.success("Draft created.");
      navigate(`/student-hub/essays/${entity.id}`);
    } catch {
      message.error(
        "Could not create this draft. Your entries are still here.",
      );
    }
  };
  return (
    <ApplicantPage
      title="Your writing"
      subtitle={isMasters
        ? "Draft statements for graduate programs and keep each program’s prompt close at hand."
        : "Draft, revise and review feedback without losing your place."}
      actions={
        <Button type="primary" icon={<Plus size={16} />} onClick={open}>
          New draft
        </Button>
      }
    >
      <Breadcrumb>Statements & essays</Breadcrumb>
      <QueryState
        loading={query.isLoading}
        error={query.isError}
        retry={query.refetch}
      >
        {!query.data?.data.length ? (
          <div className="applicant-panel applicant-empty">
            <h2>Your first draft starts here.</h2>
            <p>
              {isMasters
                ? "Start a statement of purpose or personal statement, then link it to a program application."
                : "Create a personal statement or link writing to an application."}
            </p>
            <Button type="primary" onClick={open}>
              Start writing
            </Button>
          </div>
        ) : (
          <div className="applicant-panel applicant-card-grid">
            {query.data.data.map((essay) => (
              <Link
                className="applicant-writing-card"
                to={`/student-hub/essays/${essay.id}${isMasters ? "?view=review" : ""}`}
                key={essay.id}
              >
                <span className="applicant-kicker">
                  {writingTypes.find((type) => type.value === essay.essayType)
                    ?.label ?? "Essay"}
                </span>
                <h2>{essay.title}</h2>
                <p>{essay.prompt || "No prompt added"}</p>
                <small>
                  {essay.wordCount ?? 0} words · Updated{" "}
                  {displayDate(essay.updatedAt)}
                </small>
                {essay.mentorFeedback && (
                  <span className="applicant-feedback-badge">
                    <MessageSquareText size={14} /> Mentor feedback available
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </QueryState>
      <Modal
        rootClassName="applicant-modal"
        title="Start a new draft"
        open={
          params.get("action") === "new" || location.pathname.endsWith("/new")
        }
        onCancel={() =>
          location.pathname.endsWith("/new")
            ? navigate("/student-hub/essays")
            : close()
        }
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={create}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="essayType"
            label="Writing type"
            rules={[{ required: true }]}
          >
            <Select options={writingTypes} />
          </Form.Item>
          <Form.Item name="collegeApplicationId" label="Related application">
            <Select
              allowClear
              loading={applications.isLoading}
              options={(applications.data?.data ?? []).map((app) => ({
                value: app.id,
                label: app.universityName || app.major || "Application",
              }))}
            />
          </Form.Item>
          <Form.Item
            name="prompt"
            label="Prompt"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Add the question or prompt you are answering.",
              },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          {isMasters && (
            <p>Check the program’s exact prompt and word limit before you draft.</p>
          )}
          <div className="applicant-actions applicant-actions--end">
            <Button
              onClick={() =>
                location.pathname.endsWith("/new")
                  ? navigate("/student-hub/essays")
                  : close()
              }
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createState.isLoading}
            >
              Create draft
            </Button>
          </div>
        </Form>
      </Modal>
    </ApplicantPage>
  );
}

export function ApplicantEssayEditorPage() {
  const { essayId = "" } = useParams();
  const isMasters = useApplicantOverview().currentData?.profile?.targetDegree === "master";
  const query = useGetStudentEssayQuery(essayId, { skip: !essayId });
  const versionsQuery = useGetEssayVersionsQuery(essayId, { skip: !essayId || !isMasters });
  const [createVersion, createVersionState] = useCreateEssayVersionMutation();
  const [update, updateState] = useUpdateStudentEssayMutation();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<StudentEssay["status"]>("draft");
  const [dirty, setDirty] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const snapshotRef = useRef("");
  const savingRef = useRef(false);
  const [params, setParams] = useSearchParams();
  const [reviewTab, setReviewTab] = useState<"preview" | "feedback" | "versions">("preview");
  const essay = query.data?.data;
  const profileId = useTypedSelector((state) => state.auth.profile?.id);
  const localDraftKey = essayId
    ? `topcoach:essay-draft:${profileId || "current"}:${essayId}`
    : "";
  useEffect(() => {
    if (!essay) return;
    try {
      const saved = localDraftKey ? localStorage.getItem(localDraftKey) : null;
      if (saved) {
        const draft = JSON.parse(saved) as Partial<{
          content: string;
          title: string;
          status: StudentEssay["status"];
        }>;
        if (
          typeof draft.content === "string" &&
          typeof draft.title === "string" &&
          typeof draft.status === "string"
        ) {
          setContent(draft.content);
          setTitle(draft.title);
          setStatus(draft.status);
          setDirty(true);
          setRecovered(true);
          return;
        }
      }
    } catch {
      try {
        if (localDraftKey) localStorage.removeItem(localDraftKey);
      } catch {
        /* Storage can be blocked without preventing editing. */
      }
    }
    setContent(essay.content ?? "");
    setTitle(essay.title);
    setStatus(essay.status);
    setDirty(false);
    setRecovered(false);
  }, [essay?.id, localDraftKey]);
  const words = useMemo(
    () => (content.trim() ? content.trim().split(/\s+/).length : 0),
    [content],
  );
  snapshotRef.current = JSON.stringify({ content, title, status });
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (!localDraftKey || !dirty) return;
    try {
      localStorage.setItem(
        localDraftKey,
        JSON.stringify({ content, title, status }),
      );
    } catch {
      /* Server save remains available when local storage is blocked. */
    }
  }, [localDraftKey, dirty, content, title, status]);
  const save = async () => {
    if (!essay || !dirty || savingRef.current) return;
    const submitted = JSON.stringify({ content, title, status });
    savingRef.current = true;
    try {
      await update({ id: essay.id, data: { content, title, status } }).unwrap();
      if (snapshotRef.current === submitted) {
        setDirty(false);
        setRecovered(false);
        try {
          localStorage.removeItem(localDraftKey);
        } catch {
          /* A successful server save is still successful. */
        }
      }
      message.success(
        snapshotRef.current === submitted
          ? "Draft saved."
          : "Latest changes are still unsaved.",
      );
    } catch {
      message.error(
        "Could not save your draft. Your text remains in the editor.",
      );
    } finally {
      savingRef.current = false;
    }
  };
  const saveVersion = async () => {
    if (!essay || !content.trim()) {
      message.error("Write your statement before saving a version.");
      return;
    }
    try {
      if (dirty) await update({ id: essay.id, data: { content, title, status } }).unwrap();
      await createVersion({ essayId: essay.id, content, changeSummary: "Saved from statement editor" }).unwrap();
      setDirty(false);
      setRecovered(false);
      try { localStorage.removeItem(localDraftKey); } catch { /* Server copy remains saved. */ }
      setReviewTab("versions");
      message.success("New statement version saved.");
    } catch {
      message.error("Could not save a new version. Your text remains in the editor.");
    }
  };
  const feedback =
    typeof essay?.mentorFeedback === "string"
      ? essay.mentorFeedback
      : essay?.mentorFeedback
        ? [
            essay.mentorFeedback.strengths?.join("\n"),
            essay.mentorFeedback.areasForImprovement?.join("\n"),
            essay.mentorFeedback.suggestions?.join("\n"),
          ]
            .filter(Boolean)
            .join("\n\n")
        : "";
  return (
    <ApplicantPage
      title={isMasters && params.get("view") === "review" ? "Statement review" : "Focused editor"}
      actions={
        <div className="applicant-actions">
          <span className="applicant-save-state">
            {updateState.isLoading
              ? "Saving…"
              : recovered
                ? "Recovered unsaved draft"
                : dirty
                  ? "Unsaved changes"
                  : "Saved"}
          </span>
          <Button
            type="primary"
            icon={<Save size={15} />}
            disabled={!dirty}
            loading={updateState.isLoading}
            onClick={save}
          >
            Save draft
          </Button>
        </div>
      }
    >
      <Breadcrumb>
        <Link to="/student-hub/essays">Statements & essays</Link>
        <span>/</span>
        {essay?.title || "Draft"}
      </Breadcrumb>
      <QueryState
        loading={query.isLoading}
        error={query.isError || (!query.isLoading && !essay)}
        retry={query.refetch}
      >
        {essay && isMasters && params.get("view") === "review" ? (
          <div className="applicant-statement-review">
            <p className="applicant-statement-review__meta">Master’s · {essay.title} · Private</p>
            <div className="applicant-tabs" role="tablist" aria-label="Statement review">
              {(["preview", "feedback", "versions"] as const).map((view) => (
                <button key={view} type="button" role="tab" aria-selected={reviewTab === view}
                  className={reviewTab === view ? "is-active" : ""} onClick={() => setReviewTab(view)}>
                  {view[0].toUpperCase() + view.slice(1)}
                  {view === "feedback" && feedback && " · Available"}
                </button>
              ))}
            </div>
            {reviewTab === "preview" && <div className="applicant-panel applicant-statement-review__preview">
              <h2>{essay.title}</h2>
              <p>{essay.content || "This statement has no saved content yet. Open the editor to start writing."}</p>
            </div>}
            {reviewTab === "feedback" && <div className="applicant-panel applicant-statement-review__preview">
              <h2>Reviewer feedback</h2>
              {feedback ? <p>{feedback}</p> : <p>No reviewer feedback has been shared yet.</p>}
            </div>}
            {reviewTab === "versions" && <div className="applicant-panel applicant-statement-review__preview">
              <h2>Saved versions</h2>
              <QueryState loading={versionsQuery.isLoading} error={versionsQuery.isError} retry={versionsQuery.refetch}>
                {(versionsQuery.data?.data ?? []).length ? (
                  <ol className="applicant-statement-review__versions">
                    {[...(versionsQuery.data?.data ?? [])].sort((a, b) => b.version - a.version).map((version) => (
                      <li key={version.id}><History size={16} aria-hidden /><div><strong>Version {version.version}</strong><small>{displayDate(version.createdAt)} · {version.changeSummary || "Statement snapshot"}</small><p>{version.content}</p></div></li>
                    ))}
                  </ol>
                ) : <p>No versions saved yet. Save a version from the editor to keep a reviewable snapshot.</p>}
              </QueryState>
            </div>}
            <div className="applicant-actions">
              <Button type="primary" onClick={() => {
                const next = new URLSearchParams(params); next.delete("view"); setParams(next);
              }}>Open draft editor</Button>
              <Button onClick={saveVersion} loading={createVersionState.isLoading}>Save new version</Button>
            </div>
          </div>
        ) : essay && (
          <div
            className={`applicant-editor-layout${params.get("feedback") ? " has-feedback" : ""}`}
          >
            <div className="applicant-panel applicant-editor">
              {isMasters && <div className="applicant-actions applicant-editor__review-actions">
                <Button onClick={() => {
                  const next = new URLSearchParams(params); next.set("view", "review"); setParams(next);
                }}>Review statement</Button>
                <Button onClick={saveVersion} loading={createVersionState.isLoading}>Save new version</Button>
              </div>}
              <Input
                className="applicant-title-input"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setDirty(true);
                }}
                aria-label="Draft title"
              />
              <p>{essay.prompt}</p>
              <Input.TextArea
                className="applicant-writing"
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  setDirty(true);
                }}
                onBlur={save}
                placeholder="Begin your draft…"
              />
              <div className="applicant-editor__footer">
                <span>{words} words</span>
                <Select
                  value={status}
                  onChange={(value) => {
                    setStatus(value);
                    setDirty(true);
                  }}
                  options={[
                    ...["draft", "review", "revision", "final"].map(
                      (value) => ({
                        value,
                        label: value[0].toUpperCase() + value.slice(1),
                      }),
                    ),
                    ...(status === "submitted"
                      ? [
                          {
                            value: "submitted",
                            label: "Submitted",
                            disabled: true,
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            </div>
            {params.get("feedback") && (
              <aside className="applicant-panel applicant-feedback">
                <div className="applicant-page__heading">
                  <h2>Mentor feedback</h2>
                  <Button
                    type="text"
                    onClick={() => {
                      const next = new URLSearchParams(params);
                      next.delete("feedback");
                      setParams(next);
                    }}
                    icon={<ArrowLeft size={16} />}
                  >
                    Close
                  </Button>
                </div>
                {feedback ? (
                  <p style={{ whiteSpace: "pre-wrap" }}>{feedback}</p>
                ) : (
                  <Alert
                    type="info"
                    message="No mentor feedback has been shared yet."
                  />
                )}
              </aside>
            )}
          </div>
        )}
      </QueryState>
      {!params.get("feedback") && essay?.mentorFeedback && (
        <Button
          className="applicant-feedback-launcher"
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set("feedback", "mentor");
            setParams(next);
          }}
          icon={<MessageSquareText size={17} />}
        >
          Review mentor feedback
        </Button>
      )}
    </ApplicantPage>
  );
}
