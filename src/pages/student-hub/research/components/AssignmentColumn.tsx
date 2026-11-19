/**
 * Step 3 of a week: the assignment.
 *   - Brief + drop-zone (drag & drop or browse) + optional text response
 *   - Once submitted: status, feedback when graded, and a "Book a mentor
 *     review" CTA for students outside Full Support
 */

import React, { useRef, useState } from "react";
import { message } from "antd";
import {
  Clock,
  Download,
  FileText,
  Lock,
  MessageSquare,
  RefreshCw,
  Send,
  UploadCloud,
  X,
} from "lucide-react";
import {
  useSubmitAssignmentMutation,
  researchPrepErrorMessage,
  type ResearchAssignment,
  type ResearchSubmission,
  type WeekLockState,
} from "src/app/services/research-prep";
import RpPanel from "./RpPanel";

interface AssignmentColumnProps {
  weekId: string;
  weekNumber: number;
  assignment: ResearchAssignment;
  lock: WeekLockState["assignment"];
  submissions: ResearchSubmission[];
  isFullSupport: boolean;
  onBookMentorReview?: (submissionId: string) => void;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** First paragraph of the instructions, trimmed for the card. */
const summarize = (md: string) => {
  const firstChunk = md.split("\n\n")[0] ?? md;
  return firstChunk.length > 240 ? firstChunk.slice(0, 235) + "…" : firstChunk;
};

const STATUS_COPY: Record<ResearchSubmission["status"], string> = {
  submitted: "Submitted",
  under_review: "Under review",
  graded: "Graded",
  returned_for_revision: "Returned for revision",
};

const AssignmentColumn: React.FC<AssignmentColumnProps> = ({
  weekId,
  weekNumber,
  assignment,
  lock,
  submissions,
  isFullSupport,
  onBookMentorReview,
}) => {
  const [submit, { isLoading }] = useSubmitAssignmentMutation();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const latest = submissions[submissions.length - 1];
  const isLocked = lock.locked;
  const canEdit =
    !isLocked &&
    (!latest || latest.status === "returned_for_revision" || isResubmitting);
  const isSubmitted =
    lock.submissionStatus !== "none" &&
    lock.submissionStatus !== "returned_for_revision";

  const types = assignment.acceptedFileTypes
    .map((t) => t.toUpperCase())
    .join(" or ");
  const acceptString = assignment.acceptedFileTypes
    .map((t) => `.${t}`)
    .join(",");

  const handleFile = (file: File) => {
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > assignment.maxFileSizeMb) {
      message.error(`File exceeds ${assignment.maxFileSizeMb} MB limit.`);
      return;
    }
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!assignment.acceptedFileTypes.includes(ext)) {
      message.error(
        `Only ${assignment.acceptedFileTypes.join(", ").toUpperCase()} allowed.`,
      );
      return;
    }
    setPendingFile(file);
  };

  const handleSubmit = async () => {
    if (!pendingFile && !text.trim()) {
      message.warning("Attach a file or write a text response.");
      return;
    }
    try {
      await submit({
        weekId,
        file: pendingFile ?? undefined,
        text: text.trim() || undefined,
      }).unwrap();
      setPendingFile(null);
      setText("");
      setIsResubmitting(false);
      message.success(`Week ${weekNumber} assignment submitted.`);
    } catch (err: any) {
      message.error(
        researchPrepErrorMessage(err, "Could not submit assignment."),
      );
    }
  };

  const requirements: string[] = [
    `${types} · up to ${assignment.maxFileSizeMb} MB`,
    "Original work only",
    assignment.allowText
      ? "A written response can go with or replace the file"
      : "A file is required",
    isFullSupport
      ? "Your teacher grades it and replies here"
      : "Submitting completes the week",
  ];

  return (
    <RpPanel
      step={3}
      title="Assignment"
      subtitle={assignment.title}
      done={isSubmitted}
      className="rp-assignment"
    >
      {/* Brief + requirements on the left, the submission on the right. */}
      <div className="rp-assignment__grid">
        <div className="rp-assignment__info">
          <p className="rp-assignment__brief">
            {summarize(assignment.instructionsMd)}
          </p>
          <h3 className="rp-subhead">Requirements</h3>
          <ul className="rp-reqs">
            {requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="rp-assignment__work">
          {isLocked && (
            <p className="rp-notice">
              <Lock size={14} aria-hidden />
              <span>
                {lock.lockReason === "quiz-not-passed"
                  ? "Score 100% on the knowledge check to unlock the assignment."
                  : lock.lockReason === "previous-week-not-submitted"
                    ? "Submit the previous week's assignment to unlock this one."
                    : "This assignment is locked."}
              </span>
            </p>
          )}

          {/* Submitted / graded — read-only summary */}
          {latest && !canEdit && !isLocked && (
            <div className="rp-submission">
              <div className="rp-submission__row">
                <span
                  className={`rp-pill rp-pill--${latest.status === "graded" ? "graded" : latest.status === "returned_for_revision" ? "revision" : "submitted"}`}
                >
                  {STATUS_COPY[latest.status]}
                </span>
                <small>
                  {fmtDate(latest.submittedAt)} · attempt {latest.attemptNumber}
                </small>
                {latest.status !== "graded" && (
                  <button
                    type="button"
                    className="rp-link-btn"
                    onClick={() => setIsResubmitting(true)}
                  >
                    <RefreshCw size={13} aria-hidden /> Replace
                  </button>
                )}
              </div>

              {(latest.fileName || latest.textBody) && (
                <div className="rp-file">
                  <span className="rp-file__icon" aria-hidden>
                    {latest.fileName ? (
                      <FileText size={15} />
                    ) : (
                      <MessageSquare size={15} />
                    )}
                  </span>
                  <strong>{latest.fileName ?? "Written response"}</strong>
                  {latest.fileUrl && latest.fileName && (
                    <a
                      href={latest.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rp-link-btn"
                    >
                      Open
                    </a>
                  )}
                </div>
              )}

              {latest.status === "graded" && (
                <div className="rp-feedback">
                  <div className="rp-feedback__head">
                    <span>Teacher feedback</span>
                    <strong>{latest.score} / 100</strong>
                  </div>
                  {latest.feedbackMd && <p>{latest.feedbackMd}</p>}
                  {latest.graderFileUrl && latest.graderFileName && (
                    <a
                      className="rp-file rp-file--link"
                      href={latest.graderFileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="rp-file__icon" aria-hidden>
                        <Download size={15} />
                      </span>
                      <strong>{latest.graderFileName}</strong>
                      <small>Graded copy</small>
                    </a>
                  )}
                </div>
              )}

              {latest.status === "submitted" && isFullSupport && (
                <p className="rp-notice">
                  <Clock size={14} aria-hidden /> Waiting for feedback from your
                  teacher.
                </p>
              )}

              {latest.status === "submitted" && !isFullSupport && (
                <div className="rp-mentor-cta">
                  <strong>Want a mentor to review this?</strong>
                  <p>
                    Your submission is saved. Outside Full Support it isn’t
                    graded automatically — you can book a 30-minute review with
                    a mentor.
                  </p>
                  <button
                    type="button"
                    className="rp-btn rp-btn--secondary rp-btn--block"
                    onClick={() => onBookMentorReview?.(latest.id)}
                  >
                    Book a mentor review
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Editable — fresh submission or revision */}
          {canEdit && (
            <>
              <div
                className={`rp-drop${isDragging ? " is-dragging" : ""}${pendingFile ? " has-file" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                role="button"
                tabIndex={0}
                aria-label="Upload assignment file"
              >
                <span className="rp-drop__icon" aria-hidden>
                  {pendingFile ? (
                    <FileText size={20} />
                  ) : (
                    <UploadCloud size={20} />
                  )}
                </span>
                <span className="rp-drop__text">
                  <strong>
                    {pendingFile
                      ? pendingFile.name
                      : "Drop your file here or browse"}
                  </strong>
                  <small>
                    {pendingFile
                      ? `${(pendingFile.size / (1024 * 1024)).toFixed(1)} MB · ready to submit`
                      : `${types} · up to ${assignment.maxFileSizeMb} MB`}
                  </small>
                </span>
                {pendingFile && (
                  <button
                    type="button"
                    className="rp-drop__clear"
                    aria-label="Remove file"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingFile(null);
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptString}
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
              </div>

              {assignment.allowText && (
                <textarea
                  className="rp-textarea"
                  placeholder="Add a written response (optional, Markdown supported)"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              )}

              <button
                type="button"
                className="rp-btn rp-btn--primary rp-btn--block"
                onClick={handleSubmit}
                disabled={isLoading || (!pendingFile && !text.trim())}
              >
                <Send size={15} aria-hidden />
                {isLoading
                  ? "Submitting…"
                  : latest && isResubmitting
                    ? `Resubmit (attempt ${latest.attemptNumber + 1})`
                    : "Submit assignment"}
              </button>
              {latest && isResubmitting && (
                <button
                  type="button"
                  className="rp-btn rp-btn--ghost rp-btn--block"
                  onClick={() => {
                    setIsResubmitting(false);
                    setPendingFile(null);
                    setText("");
                  }}
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </RpPanel>
  );
};

export default AssignmentColumn;
