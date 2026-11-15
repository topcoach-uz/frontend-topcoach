import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Drawer,
  Dropdown,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Tooltip,
  message,
} from "antd";
import { MoreHorizontal, History, Lightbulb, MessageSquareText, Plus, Save, Trash2 } from "lucide-react";
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
  useGetEnhancedFeedbackQuery,
  useCreateEssayVersionMutation,
  useDeleteStudentEssayMutation,
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
import {
  useGetEligibleEssayMentorsQuery,
  useGetStudentEssayReviewsQuery,
  useSubmitEssayReviewMutation,
  useWithdrawEssayReviewMutation,
} from "src/app/services/student-hub/essayReviewApi";
import { getMentorFeedbackText } from "./essayFeedbackModel";
import { EssayPromptBox } from "./EssayPromptBox";
import { EssayAnglesPanel } from "./EssayAnglesPanel";
import type { EssayIdeasResponse } from "src/app/services/student-hub/essayManagementApi";
import { countWords, ideasForEssay, essayWordLimit, formatSavedTime, limitLevel, limitMessage, saveState } from "./essayWriting";

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

function useIsMobile() {
  const query = "(max-width: 767px)";
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMobile(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return mobile;
}

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
  const [deleteEssay] = useDeleteStudentEssayMutation();
  const [deletingId, setDeletingId] = useState<string>();
  const removeEssay = async (essay: StudentEssay) => {
    setDeletingId(essay.id);
    try {
      await deleteEssay(essay.id).unwrap();
      try {
        Object.keys(localStorage)
          .filter((key) => key.startsWith("topcoach:essay-draft:") && key.endsWith(`:${essay.id}`))
          .forEach((key) => localStorage.removeItem(key));
      } catch { /* Local autosave cleanup is best effort. */ }
      message.success("Draft deleted.");
    } catch {
      message.error("Could not delete this draft. Try again.");
    } finally {
      setDeletingId(undefined);
    }
  };
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
              <div className="applicant-writing-card-wrap" key={essay.id}>
                <Link
                  className="applicant-writing-card"
                  to={`/student-hub/essays/${essay.id}`}
                >
                  {(() => {
                    const typeLabel = writingTypes.find((type) => type.value === essay.essayType)?.label ?? "Essay";
                    const limit = essayWordLimit(essay.essayType);
                    const words = essay.wordCount ?? 0;
                    const level = limitLevel(words, limit);
                    return (
                      <>
                        {/* Skip the type label when the title already says it ("Personal statement" twice). */}
                        {typeLabel.trim().toLowerCase() !== (essay.title || "").trim().toLowerCase() && (
                          <span className="applicant-writing-card__type">{typeLabel}</span>
                        )}
                        <h2>{essay.title}</h2>
                        {essay.prompt?.trim() && <p className="applicant-writing-card__prompt">{essay.prompt.trim()}</p>}
                        <small className={`applicant-writing-card__meta is-${level}`}>
                          {limit ? `${words} / ${limit} words` : `${words} words`} · Edited {displayDate(essay.updatedAt)}
                        </small>
                      </>
                    );
                  })()}
                  {getMentorFeedbackText(essay.mentorFeedback) && (
                    <span className="applicant-feedback-badge">
                      <MessageSquareText size={14} /> Mentor feedback available
                    </span>
                  )}
                </Link>
                <Popconfirm
                  title="Delete this draft?"
                  description="This removes the draft from your writing list."
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => removeEssay(essay)}
                >
                  <Button
                    className="applicant-writing-card__delete"
                    danger
                    type="text"
                    aria-label={`Delete ${essay.title}`}
                    icon={<Trash2 size={16} />}
                    loading={deletingId === essay.id}
                  />
                </Popconfirm>
              </div>
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
  const { data: eligibleMentors = [], isError: eligibilityError, isLoading: eligibilityLoading, refetch: refetchEligibleMentors } = useGetEligibleEssayMentorsQuery(undefined, { pollingInterval: 30000, refetchOnMountOrArgChange: true });
  const { data: reviewRequests = [] } = useGetStudentEssayReviewsQuery(essayId, { skip: !essayId, pollingInterval: 30000 });
  const [submitReview, submitReviewState] = useSubmitEssayReviewMutation();
  const [withdrawReview, withdrawReviewState] = useWithdrawEssayReviewMutation();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<string>();
  const [reviewNote, setReviewNote] = useState("");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<StudentEssay["status"]>("draft");
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date>();
  const [saveFailed, setSaveFailed] = useState(false);
  const snapshotRef = useRef("");
  const savingRef = useRef(false);
  const [params, setParams] = useSearchParams();
  const [reviewTab, setReviewTab] = useState<"preview" | "feedback" | "versions">("preview");
  const [sidePanel, setSidePanel] = useState<"ideas" | "review" | null>(null);
  // Keeps the last panel mounted while it slides out.
  const [panelExited, setPanelExited] = useState(true);
  const lastPanelRef = useRef<"ideas" | "review" | null>(null);
  if (sidePanel) lastPanelRef.current = sidePanel;
  if (sidePanel && panelExited) setPanelExited(false);
  const shownPanel = sidePanel ?? (panelExited ? null : lastPanelRef.current);
  useEffect(() => { if (params.get('helper') === 'ai') setSidePanel('review'); }, [params.get('helper')]);
  const isMobile = useIsMobile();
  const [previewVersion, setPreviewVersion] = useState<{ label: string; content: string; date?: string } | null>(null);
  const [aiFeedbackRequested, setAiFeedbackRequested] = useState(false);
  const [anglesByEssay, setAnglesByEssay] = useState<Record<string, EssayIdeasResponse>>({});
  const essay = query.data?.data;
  const aiFeedbackQuery = useGetEnhancedFeedbackQuery(essayId, {
    skip: !essayId || !aiFeedbackRequested,
  });
  const aiFeedback = aiFeedbackQuery.data?.data;
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
  const words = useMemo(() => countWords(content), [content]);
  const wordLimit = essay ? essayWordLimit(essay.essayType) : undefined;
  const level = limitLevel(words, wordLimit);
  const status_ = saveState({ saving: updateState.isLoading, failed: saveFailed, dirty, lastSavedAt });
  const openReview = reviewRequests.find((request) => ["pending", "in_review"].includes(request.status));
  const openReviews = reviewRequests.filter((request) => ["pending", "in_review"].includes(request.status));
  const availableMentors = eligibleMentors.filter((mentor) => !openReviews.some((request) => request.mentorUserId === mentor.id));
  const submitBlockedReason = eligibilityLoading
    ? "Checking mentor availability…"
    : eligibilityError
      ? "We couldn’t check mentor availability. Try again in a moment."
      : eligibleMentors.length === 0
        ? "Mentor review opens after you’re assigned a mentor or complete a 1:1 meeting."
        : availableMentors.length === 0
          ? `Your draft is already with ${openReviews[0]?.mentorName || "your mentor"} for review.`
          : !content.trim()
            ? "Write something first, then send it to your mentor."
            : "";
  const submitLabel = availableMentors.length === 1 ? `Submit to ${availableMentors[0].name}` : "Submit to mentor";
  const submitToMentorButton = (
    <Tooltip title={submitBlockedReason || undefined}>
      <span className="applicant-writing-desk__submit">
        <Button
          type="primary"
          disabled={Boolean(submitBlockedReason)}
          onClick={() => {
            setSelectedMentor(availableMentors[0]?.id);
            setReviewModalOpen(true);
          }}
        >{submitLabel}</Button>
      </span>
    </Tooltip>
  );
  const reviewedRequests = reviewRequests.filter((request) => request.status === "feedback_ready");
  const requestMentorReview = async () => {
    if (!essay || !selectedMentor || !content.trim() || updateState.isLoading || savingRef.current) return;
    const submitted = JSON.stringify({ content, title, status });
    try {
      await update({ id: essay.id, data: { content, title, status } }).unwrap();
      await submitReview({ essayId: essay.id, mentorUserId: selectedMentor, note: reviewNote.trim() || undefined }).unwrap();
      if (snapshotRef.current === submitted) {
        setDirty(false);
        try { localStorage.removeItem(localDraftKey); } catch { /* Server copy remains saved. */ }
      }
      setReviewModalOpen(false);
      setReviewNote("");
      setSidePanel("review");
      message.success("Your saved draft was sent to your mentor.");
    } catch (error: any) {
      if (error?.status === 403) {
        void refetchEligibleMentors();
        setReviewModalOpen(false);
        message.error("This mentor is no longer available for review. Your draft was saved; choose an eligible mentor if one appears.");
      } else {
        message.error("Could not send this draft for review. Your text remains in the editor.");
      }
    }
  };
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
  const save = async (manual = false) => {
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
      setLastSavedAt(new Date());
      setSaveFailed(false);
      if (manual) message.success("Draft saved.");
    } catch {
      setSaveFailed(true);
      if (manual) message.error("Could not save your draft. Your text remains in the editor.");
    } finally {
      savingRef.current = false;
    }
  };
  useEffect(() => {
    if (!essay || !dirty || updateState.isLoading) return;
    const timer = window.setTimeout(() => { void save(); }, 2500);
    return () => window.clearTimeout(timer);
  }, [essay?.id, content, title, status, dirty, updateState.isLoading]);
  const restoreContent = (label: string, restored: string) => {
    setContent(restored);
    setDirty(true);
    setPreviewVersion(null);
    message.success(`${label} restored to the editor. Your newer versions are kept.`);
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
      try { localStorage.removeItem(localDraftKey); } catch { /* Server copy remains saved. */ }
      setReviewTab("versions");
      message.success("New statement version saved.");
    } catch {
      message.error("Could not save a new version. Your text remains in the editor.");
    }
  };
  const feedback = getMentorFeedbackText(essay?.mentorFeedback);
  const latestFeedback = reviewedRequests[0]?.feedback || feedback;
  useEffect(() => {
    if (params.get("feedback") === "mentor" && latestFeedback) setSidePanel("review");
  }, [params.get("feedback"), latestFeedback]);
  const sidePanelBody = shownPanel ? (<>
              {shownPanel === "ideas" ? <>
                {essay && <EssayAnglesPanel essayId={essay.id} result={anglesByEssay[essay.id]} onResult={(id, r) => setAnglesByEssay((prev) => ({ ...prev, [id]: r }))} />}
                {essay.prompt?.trim() && <blockquote className="applicant-writing-desk__prompt-quote"><strong>Your prompt</strong>{essay.prompt.trim()}</blockquote>}
                <h4 className="essay-angles__quick">Quick questions</h4>
                <ol className="applicant-writing-desk__ideas">
                  {ideasForEssay(essay.essayType, essay.prompt).map((idea) => <li key={idea}>{idea}</li>)}
                </ol>
                <small>These are writing prompts from TopCoach, not official admission requirements.</small>
              </> : <>
                <h3>Writing helper</h3>
                <p>Get suggestions for your saved draft. This is automated guidance, not mentor feedback.</p>
                <Button
                  onClick={() => {
                    if (aiFeedbackRequested) void aiFeedbackQuery.refetch();
                    else setAiFeedbackRequested(true);
                  }}
                  loading={aiFeedbackQuery.isFetching}
                  disabled={!content.trim() || dirty}
                >
                  {aiFeedbackRequested ? 'Refresh suggestions' : 'Review saved draft'}
                </Button>
                {dirty && <p>Save your latest changes before requesting suggestions.</p>}
                {aiFeedbackQuery.isError && <Alert type="warning" message="Could not review this draft. Please try again." />}
                {aiFeedback && <div className="applicant-panel" style={{ marginTop: 16, padding: 16 }}>
                  {aiFeedback.analysisVersion === 'checklist' && <Alert type="info" message="AI is unavailable. This is a general writing checklist, not an analysis of your draft." />}
                  {aiFeedback.strengths?.length ? <><strong>What works</strong><ul>{aiFeedback.strengths.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
                  {aiFeedback.weaknesses?.length ? <><strong>What to improve</strong><ul>{aiFeedback.weaknesses.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
                  {aiFeedback.suggestions?.length ? <><strong>Suggestions</strong><ul>{aiFeedback.suggestions.map((item, index) => <li key={index}>{item.text}</li>)}</ul></> : null}
                </div>}
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
                {eligibilityError ? <Alert type="warning" message="Could not check mentor review availability" action={<Button size="small" onClick={() => void refetchEligibleMentors()}>Retry</Button>} />
                  : !eligibilityLoading && eligibleMentors.length === 0 && <p>Keep writing and saving versions. Mentor review becomes available after you are assigned a mentor or complete a 1:1 meeting.</p>}
                {openReviews.map((request) => <div key={request.id} role="status" className="applicant-panel" style={{ marginTop: 16, padding: 16 }}>
                  <strong>{request.status === "in_review" ? "Being reviewed by" : "Awaiting"} {request.mentorName || "mentor"}{request.status === "pending" ? "’s review" : ""}</strong>
                  <p>Version {request.snapshotVersion} was sent on {displayDate(request.createdAt)}. You can keep editing your draft.</p>
                  {request.status === "pending" && <Button loading={withdrawReviewState.isLoading} onClick={async () => {
                    try { await withdrawReview(request.id).unwrap(); message.success("Review request withdrawn."); }
                    catch { message.error("Could not withdraw the request."); }
                  }}>Withdraw request</Button>}
                </div>)}
                {reviewedRequests.map((request) => {
                  const reviewed = (versionsQuery.data?.data ?? []).find((v) => v.version === request.snapshotVersion);
                  return <article key={request.id} className="applicant-feedback-card">
                    <header>
                      <strong>{request.mentorName || "Your mentor"}</strong>
                      <small>on Version {request.snapshotVersion} · {displayDate(request.feedbackAt || request.createdAt)}</small>
                    </header>
                    <p>{request.feedback}</p>
                    <Button size="small" onClick={() => setPreviewVersion({
                      label: `Version ${request.snapshotVersion}`,
                      content: reviewed?.content ?? request.snapshotContent,
                      date: displayDate(reviewed?.createdAt ?? request.createdAt),
                    })}>View that version</Button>
                  </article>;
                })}
                <h3>Saved versions</h3>
                <QueryState loading={versionsQuery.isLoading} error={versionsQuery.isError} retry={versionsQuery.refetch}>
                  {(versionsQuery.data?.data ?? []).length ? (
                    <ol className="applicant-writing-desk__versions">
                      {[...(versionsQuery.data?.data ?? [])].sort((a, b) => b.version - a.version).map((version) => (
                        <li key={version.id}>
                          <strong>Version {version.version}</strong>
                          <small>{displayDate(version.createdAt)} · {countWords(version.content)} words</small>
                          <div className="applicant-writing-desk__version-actions">
                            <Button size="small" onClick={() => setPreviewVersion({ label: `Version ${version.version}`, content: version.content, date: displayDate(version.createdAt) })}>Preview</Button>
                            <Popconfirm
                              title={`Replace the editor text with Version ${version.version}?`}
                              description="Your current text is replaced; save a version first if you want to keep it."
                              okText="Restore"
                              onConfirm={() => restoreContent(`Version ${version.version}`, version.content)}
                            ><Button size="small">Restore</Button></Popconfirm>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : <p>No versions saved yet.</p>}
                </QueryState>
                {feedback && reviewedRequests.length === 0 && <><h3>Mentor feedback</h3><p style={{ whiteSpace: "pre-wrap" }}>{feedback}</p></>}
              </>}
  </>) : null;
  const sidePanelTitle = sidePanel === "ideas" ? "Ideas to get started" : "Review your draft";
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
              onClick={() => { void save(true); }}
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
                  {view === "feedback" && latestFeedback && " · Available"}
                </button>
              ))}
            </div>
            {reviewTab === "preview" && <div className="applicant-panel applicant-statement-review__preview">
              <h2>{essay.title}</h2>
              <p>{essay.content || "This statement has no saved content yet. Open the editor to start writing."}</p>
            </div>}
            {reviewTab === "feedback" && <div className="applicant-panel applicant-statement-review__preview">
              <h2>Reviewer feedback</h2>
              {latestFeedback ? <p style={{ whiteSpace: "pre-wrap" }}>{latestFeedback}</p> : <p>No reviewer feedback has been shared yet.</p>}
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
              {submitToMentorButton}
            </div>
            {openReview && <p role="status">Version {openReview.snapshotVersion} is awaiting {openReview.mentorName || "mentor"}’s feedback.</p>}
          </div>
        ) : essay && (
          <div className="applicant-writing-desk">
            <div className="applicant-writing-desk__bar">
              <span>{essay.essayType === "personal_statement" ? "PERSONAL STATEMENT" : "ESSAY DRAFT"}</span>
              <div className="applicant-actions applicant-writing-desk__actions">
                {isMobile ? (
                  <Dropdown
                    trigger={["click"]}
                    menu={{
                      items: [
                        { key: "ideas", label: "Ideas", icon: <Lightbulb size={15} /> },
                        { key: "review", label: "Review & versions", icon: <History size={15} /> },
                        ...((dirty || updateState.isLoading) ? [{ key: "save", label: "Save draft", icon: <Save size={15} /> }] : []),
                      ],
                      onClick: ({ key }) => {
                        if (key === "save") void save(true);
                        else setSidePanel(key as "ideas" | "review");
                      },
                    }}
                  >
                    <Button icon={<MoreHorizontal size={17} />} aria-label="More writing tools">More</Button>
                  </Dropdown>
                ) : (<>
                {(dirty || updateState.isLoading) && (
                  <Button
                    icon={<Save size={15} />}
                    loading={updateState.isLoading}
                    onClick={() => { void save(true); }}
                  >Save draft</Button>
                )}
                <Button
                  className="applicant-desk-toggle"
                  icon={<Lightbulb size={16} />}
                  aria-pressed={sidePanel === "ideas"}
                  onClick={() => setSidePanel(sidePanel === "ideas" ? null : "ideas")}
                >Ideas</Button>
                <Button
                  className="applicant-desk-toggle"
                  icon={<History size={16} />}
                  aria-pressed={sidePanel === "review"}
                  onClick={() => setSidePanel(sidePanel === "review" ? null : "review")}
                >Review & versions</Button>
                </>)}
                {submitToMentorButton}
              </div>
            </div>
            {submitBlockedReason && <p className="applicant-writing-desk__hint" id="essay-submit-hint">{submitBlockedReason}</p>}
            <div className={`applicant-editor-layout has-side-column${sidePanel && !isMobile ? " is-side-open" : ""}`}>
            <div className="applicant-panel applicant-editor">
              {essay.prompt?.trim() && <EssayPromptBox prompt={essay.prompt.trim()} />}
              <label className="applicant-editor__title-label" htmlFor="applicant-essay-title">Draft title</label>
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
              <Input.TextArea
                className="applicant-writing"
                autoSize={{ minRows: 16 }}
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  setDirty(true);
                }}
                onBlur={() => { void save(); }}
                placeholder="Begin your draft…"
                aria-label="Draft text"
              />
              <div className={`applicant-editor__status is-${level}`}>
                <div className="applicant-editor__status-row">
                  <span className="applicant-editor__status-words">
                    {wordLimit ? `${words} / ${wordLimit} words` : `${words} words`}
                    {limitMessage(words, wordLimit) && ` · ${limitMessage(words, wordLimit)}`}
                  </span>
                  <span className="applicant-editor__status-save">
                    <span role="status" aria-live="polite">
                      {status_ === "saving" && "Saving…"}
                      {status_ === "unsaved" && "Unsaved changes"}
                      {status_ === "saved" && lastSavedAt && `Saved ${formatSavedTime(lastSavedAt)}`}
                      {status_ === "idle" && "Private draft"}
                    </span>
                    <span role="alert">
                      {status_ === "error" && <>Couldn’t save · <button type="button" className="applicant-editor__retry" onClick={() => { void save(true); }}>Retry</button></>}
                    </span>
                  </span>
                </div>
                {wordLimit && <div className="applicant-editor__bar" aria-hidden><span style={{ width: `${Math.min(100, (words / wordLimit) * 100)}%` }} /></div>}
              </div>
            </div>
            {shownPanel && !isMobile && <aside
              className="applicant-panel applicant-writing-desk__side"
              data-open={sidePanel ? "true" : "false"}
              onAnimationEnd={(event) => { if (event.target === event.currentTarget && !sidePanel) setPanelExited(true); }}
            >
              <div className="applicant-page__heading">
                <h2>{shownPanel === "ideas" ? "Ideas to get started" : "Review your draft"}</h2>
                <Button type="text" onClick={() => setSidePanel(null)} aria-label="Close side panel">Close</Button>
              </div>
              {sidePanelBody}
            </aside>}
            </div>
          </div>
        )}
      </QueryState>
      <Drawer
        open={isMobile && Boolean(sidePanel)}
        onClose={() => setSidePanel(null)}
        placement="bottom"
        height="75vh"
        title={sidePanelTitle}
        rootClassName="applicant-essay-drawer"
        styles={{ wrapper: { borderRadius: "16px 16px 0 0", overflow: "hidden" }, body: { padding: "16px 18px 28px", background: "#fbf9f6" } }}
        destroyOnClose
      >
        <div className="applicant-writing-desk__side applicant-writing-desk__side--drawer">{sidePanelBody}</div>
      </Drawer>
      <Modal
        title={previewVersion ? `${previewVersion.label}${previewVersion.date ? ` · ${previewVersion.date}` : ""}` : ""}
        open={Boolean(previewVersion)}
        onCancel={() => setPreviewVersion(null)}
        footer={previewVersion ? [
          <Button key="close" onClick={() => setPreviewVersion(null)}>Close</Button>,
          <Popconfirm key="restore" title="Replace the editor text with this version?" okText="Restore" onConfirm={() => restoreContent(previewVersion.label, previewVersion.content)}>
            <Button type="primary">Restore this version</Button>
          </Popconfirm>,
        ] : null}
      >
        {previewVersion && <>
          <p className="applicant-version-preview__meta">{countWords(previewVersion.content)} words · read-only</p>
          <div className="applicant-version-preview">{previewVersion.content || "This version is empty."}</div>
        </>}
      </Modal>
      <Modal
        title="Submit this draft for mentor review"
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        onOk={() => { void requestMentorReview(); }}
        okText="Send saved version"
        okButtonProps={{ disabled: !selectedMentor || !content.trim() || updateState.isLoading }}
        confirmLoading={submitReviewState.isLoading || updateState.isLoading}
      >
        <p>Your current draft will be saved as a version. Your mentor will review that version while you can keep writing.</p>
        <label htmlFor="essay-review-mentor">Mentor</label>
        <Select
          id="essay-review-mentor"
          style={{ width: "100%", marginTop: 8 }}
          value={selectedMentor}
          onChange={setSelectedMentor}
          options={availableMentors.map((mentor) => ({
            value: mentor.id,
            label: `${mentor.name} · ${mentor.source !== "one_to_one" ? "Assigned mentor" : "1:1 mentor"}`,
          }))}
        />
        <label htmlFor="essay-review-note" style={{ display: "block", marginTop: 16 }}>Note for your mentor (optional)</label>
        <Input.TextArea id="essay-review-note" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} maxLength={2000} rows={3} />
      </Modal>
    </ApplicantPage>
  );
}
