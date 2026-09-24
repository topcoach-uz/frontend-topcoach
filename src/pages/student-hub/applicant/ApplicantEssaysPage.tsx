import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Select,
  message,
} from "antd";
import { History, Lightbulb, MessageSquareText, Plus, Save } from "lucide-react";
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
  RelatedApplicationLabel,
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
  const selectedEssayType = Form.useWatch("essayType", form);
  const promptRequired = Boolean(selectedEssayType && selectedEssayType !== "personal_statement");
  useEffect(() => {
    if (!location.pathname.endsWith("/new") && params.get("action") !== "new") return;
    form.setFieldsValue({
      essayType: "personal_statement",
      title: defaultTitle,
      prompt: "",
      collegeApplicationId: params.get("application") ?? undefined,
    });
  }, [location.pathname, params.get("application"), params.get("action"), defaultTitle]);
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
      const result = await createEssay({ ...values, prompt: values.prompt?.trim() ?? "", content: "" }).unwrap();
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
      actions={query.data?.data.length ? (
        <Button type="primary" icon={<Plus size={16} />} onClick={open}>
          New draft
        </Button>
      ) : undefined}
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
            <Select
              options={writingTypes}
              onChange={(type) => {
                if (type === "personal_statement") form.setFieldValue("prompt", "");
              }}
            />
          </Form.Item>
          <Form.Item name="collegeApplicationId" label="Related application (optional)">
            <Select
              allowClear
              loading={applications.isLoading}
              options={(applications.data?.data ?? []).map((app) => ({
                value: app.id,
                label: <RelatedApplicationLabel application={app} />,
              }))}
            />
          </Form.Item>
          {promptRequired && <Form.Item
            name="prompt"
            label="Essay question or prompt"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Add the question or prompt you are answering.",
              },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>}
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
  const versionsQuery = useGetEssayVersionsQuery(essayId, { skip: !essayId });
  const [createVersion, createVersionState] = useCreateEssayVersionMutation();
  const [update, updateState] = useUpdateStudentEssayMutation();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<StudentEssay["status"]>("draft");
  const [dirty, setDirty] = useState(false);
  const snapshotRef = useRef("");
  const savingRef = useRef(false);
  const [params, setParams] = useSearchParams();
  const [reviewTab, setReviewTab] = useState<"preview" | "feedback" | "versions">("preview");
  const [sidePanel, setSidePanel] = useState<"ideas" | "review" | null>(null);
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
  useEffect(() => {
    if (!essay || !dirty || updateState.isLoading) return;
    const timer = window.setTimeout(() => { void save(); }, 2500);
    return () => window.clearTimeout(timer);
  }, [essay?.id, content, title, status, dirty, updateState.isLoading]);
  const saveVersion = async () => {
    if (!essay || !content.trim()) {
      message.error("Write your statement before saving a version.");
      return;
    }
    try {
      if (dirty) await update({ id: essay.id, data: { content, title, status } }).unwrap();
      await createVersion({ essayId: essay.id, content, changeSummary: "Saved from statement editor" }).unwrap();
      setDirty(false);
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
  useEffect(() => {
    if (params.get("feedback") === "mentor" && feedback) setSidePanel("review");
  }, [params.get("feedback"), feedback]);
  return (
    <ApplicantPage
      title={isMasters && params.get("view") === "review" ? "Statement review" : undefined}
      actions={isMasters && params.get("view") === "review" ? (
        <div className="applicant-actions">
          {(dirty || updateState.isLoading) && (
            <Button
              type="primary"
              icon={<Save size={15} />}
              loading={updateState.isLoading}
              onClick={save}
            >
              Save draft
            </Button>
          )}
        </div>
      ) : undefined}
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
          <div className="applicant-writing-desk">
            <div className="applicant-writing-desk__bar">
              <span>{essay.essayType === "personal_statement" ? "PERSONAL STATEMENT" : "ESSAY DRAFT"}</span>
              <div className="applicant-actions">
                {(dirty || updateState.isLoading) && (
                  <Button
                    icon={<Save size={15} />}
                    loading={updateState.isLoading}
                    onClick={save}
                  >Save draft</Button>
                )}
                <Button
                  icon={<Lightbulb size={17} />}
                  type={sidePanel === "ideas" ? "primary" : "default"}
                  onClick={() => setSidePanel(sidePanel === "ideas" ? null : "ideas")}
                >Ideas</Button>
                <Button
                  type={sidePanel === "review" ? "primary" : "default"}
                  onClick={() => setSidePanel(sidePanel === "review" ? null : "review")}
                >Review & versions</Button>
              </div>
            </div>
            <div className={`applicant-editor-layout${sidePanel ? " has-side-panel" : ""}`}>
            <div className="applicant-panel applicant-editor">
              <label className="applicant-editor__title-label" htmlFor="applicant-essay-title">DRAFT TITLE</label>
              <Input
                id="applicant-essay-title"
                className="applicant-title-input"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setDirty(true);
                }}
                aria-label="Draft title"
              />
              {essay.prompt?.trim() && <p className="applicant-editor__prompt"><strong>Essay question</strong>{essay.prompt}</p>}
              <Input.TextArea
                className="applicant-writing"
                rows={16}
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  setDirty(true);
                }}
                onBlur={save}
                placeholder="Begin your draft…"
                aria-label="Draft text"
              />
              <div className="applicant-editor__footer">
                <span>{words} words</span>
                <span>{dirty ? "Changes saved automatically after a pause" : "Private draft"}</span>
              </div>
            </div>
            {sidePanel && <aside className="applicant-panel applicant-writing-desk__side">
              <div className="applicant-page__heading">
                <h2>{sidePanel === "ideas" ? "Ideas to get started" : "Review your draft"}</h2>
                <Button type="text" onClick={() => setSidePanel(null)} aria-label="Close side panel">Close</Button>
              </div>
              {sidePanel === "ideas" ? <>
                <p>Use a question if it helps. Your essay does not have to follow a template.</p>
                <ol className="applicant-writing-desk__ideas">
                  {(essay.essayType === "personal_statement"
                    ? ["What is one specific moment you keep thinking about?", "What did you choose to do?", "What did you learn or see differently afterward?"]
                    : ["What is this question really asking?", "Which specific example answers it best?", "What should the reader understand about you by the end?"]
                  ).map((idea) => <li key={idea}>{idea}</li>)}
                </ol>
                <small>These are writing prompts from TopCoach, not official admission requirements.</small>
              </> : <>
                <label className="applicant-writing-desk__stage-label" htmlFor="applicant-essay-stage">Stage</label>
                <Select
                  id="applicant-essay-stage"
                  value={status}
                  onChange={(value) => { setStatus(value); setDirty(true); }}
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "review", label: "Ready for review", disabled: !content.trim() },
                    { value: "revision", label: "Revising", disabled: !content.trim() },
                    { value: "final", label: "Final", disabled: !content.trim() },
                    ...(status === "submitted" ? [{ value: "submitted", label: "Submitted", disabled: true }] : []),
                  ]}
                />
                <p>Changing the stage organizes your writing. It does not submit an application.</p>
                <Button onClick={saveVersion} loading={createVersionState.isLoading} disabled={!content.trim()}>Save a version</Button>
                <h3>Saved versions</h3>
                <QueryState loading={versionsQuery.isLoading} error={versionsQuery.isError} retry={versionsQuery.refetch}>
                  {(versionsQuery.data?.data ?? []).length ? (
                    <ol className="applicant-writing-desk__versions">
                      {[...(versionsQuery.data?.data ?? [])].sort((a, b) => b.version - a.version).map((version) => (
                        <li key={version.id}><strong>Version {version.version}</strong><small>{displayDate(version.createdAt)}</small></li>
                      ))}
                    </ol>
                  ) : <p>No versions saved yet.</p>}
                </QueryState>
                {feedback && <><h3>Mentor feedback</h3><p style={{ whiteSpace: "pre-wrap" }}>{feedback}</p></>}
              </>}
            </aside>}
            </div>
          </div>
        )}
      </QueryState>
    </ApplicantPage>
  );
}
