/**
 * Assignment Submission column — right side of the module view.
 *
 * Matches the screenshot:
 *   - Title + brief instructions
 *   - Drop-zone (drag & drop a file OR click to browse)
 *   - Submission Requirements bullet list
 *   - Save as Draft / Submit Final Assignment buttons
 *   - Once submitted: status, feedback when graded, "Book a mentor review"
 *     CTA for non-Full-Support students
 */

import React, { useRef, useState } from 'react';
import { message } from 'antd';
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Lock,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  UploadCloud,
} from 'lucide-react';
import {
  useSubmitAssignmentMutation,
  researchPrepErrorMessage,
  type ResearchAssignment,
  type ResearchSubmission,
  type WeekLockState,
} from 'src/app/services/research-prep';

interface AssignmentColumnProps {
  weekId: string;
  weekNumber: number;
  assignment: ResearchAssignment;
  lock: WeekLockState['assignment'];
  submissions: ResearchSubmission[];
  isFullSupport: boolean;
  onBookMentorReview?: (submissionId: string) => void;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/** Pull the first sentence/line from instructions for the column intro. */
const summarize = (md: string) => {
  const firstChunk = md.split('\n\n')[0] ?? md;
  return firstChunk.length > 240 ? firstChunk.slice(0, 235) + '…' : firstChunk;
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
  const [text, setText] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const latest = submissions[submissions.length - 1];
  const isLocked = lock.locked;
  const canEdit =
    !isLocked &&
    (!latest || latest.status === 'returned_for_revision' || isResubmitting);

  const acceptString = assignment.acceptedFileTypes.map((t) => `.${t}`).join(',');

  const handleFile = (file: File) => {
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > assignment.maxFileSizeMb) {
      message.error(`File exceeds ${assignment.maxFileSizeMb} MB limit.`);
      return;
    }
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (!assignment.acceptedFileTypes.includes(ext)) {
      message.error(`Only ${assignment.acceptedFileTypes.join(', ').toUpperCase()} allowed.`);
      return;
    }
    setPendingFile(file);
  };

  const handleSaveDraft = () => {
    if (!pendingFile && !text.trim()) {
      message.warning('Add a file or text before saving a draft.');
      return;
    }
    setDraftSaved(true);
    message.success('Draft saved locally.');
  };

  const handleSubmit = async () => {
    if (!pendingFile && !text.trim()) {
      message.warning('Attach a file or write a text response.');
      return;
    }
    try {
      await submit({
        weekId,
        file: pendingFile ?? undefined,
        text: text.trim() || undefined,
      }).unwrap();
      setPendingFile(null);
      setText('');
      setIsResubmitting(false);
      setDraftSaved(false);
      message.success(`Week ${weekNumber} assignment submitted.`);
    } catch (err: any) {
      message.error(researchPrepErrorMessage(err, 'Could not submit assignment.'));
    }
  };

  // Standard submission requirements rendered as a list — derived from
  // the assignment's authored config (file types, max size, allow text).
  const requirements: string[] = [
    `${assignment.acceptedFileTypes.map((t) => t.toUpperCase()).join(' or ')} format · max ${assignment.maxFileSizeMb} MB`,
    'Original work only — no plagiarism',
    assignment.allowText
      ? 'You may include a text response in addition to or instead of a file'
      : 'File attachment required',
    'Submitting locks the week — your assigned teacher will grade and reply',
  ];

  return (
    <div className="rp-section rp-assignment-col">
      <div className="rp-section-head">
        <span className="icon">
          <FileText size={14} />
        </span>
        Assignment Submission
      </div>
      <div className="rp-section-body">
        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f1419', marginBottom: 4 }}>
          {assignment.title}
        </div>
        <div className="a-instructions">{summarize(assignment.instructionsMd)}</div>

        {/* LOCKED STATE */}
        {isLocked && (
          <div className="a-locked">
            <Lock size={13} />
            {lock.lockReason === 'quiz-not-passed'
              ? "Score 100% on this week's quiz to unlock the assignment."
              : lock.lockReason === 'previous-week-not-submitted'
                ? "Submit the previous week's assignment to unlock this one."
                : 'This assignment is locked.'}
          </div>
        )}

        {/* SUBMITTED / GRADED — read-only summary */}
        {latest && !canEdit && !isLocked && (
          <>
            <div
              style={{
                padding: '10px 12px',
                background: '#f8f9fb',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 12.5,
                color: '#5b6470',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span>
                {latest.status === 'graded' ? (
                  <strong style={{ color: '#1f7a3a' }}>Graded {latest.score}/100</strong>
                ) : latest.status === 'submitted' ? (
                  <strong style={{ color: '#7c1c1c' }}>Submitted</strong>
                ) : latest.status === 'under_review' ? (
                  <strong style={{ color: '#b25e09' }}>Under review</strong>
                ) : (
                  <strong>Returned for revision</strong>
                )}
                {' · '}
                {fmtDate(latest.submittedAt)} · attempt #{latest.attemptNumber}
              </span>
              {latest.status !== 'graded' && (
                <button
                  type="button"
                  onClick={() => setIsResubmitting(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#7c1c1c',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <RefreshCw size={11} /> Replace
                </button>
              )}
            </div>

            {(latest.fileName || latest.textBody) && (
              <div
                style={{
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 12.5,
                  color: '#0f1419',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {latest.fileName ? <FileText size={13} /> : <MessageSquare size={13} />}
                <strong>{latest.fileName ?? 'Text submission'}</strong>
                {latest.fileUrl && latest.fileName && (
                  <a
                    href={latest.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginLeft: 'auto', fontSize: 11.5 }}
                  >
                    Open
                  </a>
                )}
              </div>
            )}

            {latest.status === 'graded' && (
              <div className="a-feedback">
                <div className="h">
                  <span>Mentor feedback</span>
                  <span className="score">{latest.score} / 100</span>
                </div>
                <div className="body">{latest.feedbackMd}</div>
                {latest.graderFileUrl && latest.graderFileName && (
                  <a
                    className="a-grader-file"
                    href={latest.graderFileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download size={13} />
                    <span className="name">{latest.graderFileName}</span>
                    <span className="hint">Graded copy</span>
                  </a>
                )}
              </div>
            )}

            {latest.status === 'submitted' && isFullSupport && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  border: '1px dashed #d1d5db',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#5b6470',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <Clock size={12} /> Awaiting feedback from your assigned teacher.
              </div>
            )}

            {latest.status === 'submitted' && !isFullSupport && (
              <div className="a-mentor-cta">
                <div className="head">Want a mentor to review this?</div>
                <div>
                  You're not in Full Support — your submission is saved but isn't auto-graded.
                  Optionally book a 30-minute review session with one of our mentors.
                </div>
                <button type="button" onClick={() => onBookMentorReview?.(latest.id)}>
                  Book a mentor review
                </button>
              </div>
            )}
          </>
        )}

        {/* EDITABLE — fresh submit or revision */}
        {canEdit && !isLocked && (
          <>
            <div
              className={`a-dropzone ${isLocked ? 'is-locked' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              role="button"
              tabIndex={0}
            >
              <UploadCloud size={26} className="icon" />
              <div className="head">
                {pendingFile
                  ? pendingFile.name
                  : `Drag & drop your file here`}
              </div>
              <div>
                {pendingFile
                  ? `${(pendingFile.size / (1024 * 1024)).toFixed(1)} MB ready to submit`
                  : `or click to browse · ${assignment.acceptedFileTypes
                      .map((t) => t.toUpperCase())
                      .join(' or ')} only`}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptString}
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = '';
                }}
              />
            </div>

            {assignment.allowText && (
              <textarea
                className="a-textarea"
                placeholder="Optional text response (Markdown supported)"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            )}

            <div className="a-requirements-head">Submission Requirements</div>
            <ul className="a-requirements">
              {requirements.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

            <div className="a-actions">
              <button
                type="button"
                className="secondary"
                onClick={handleSaveDraft}
                disabled={isLoading || (!pendingFile && !text.trim())}
              >
                <Save size={13} />
                {draftSaved ? 'Draft saved' : 'Save as Draft'}
              </button>
              <button
                type="button"
                className="primary"
                onClick={handleSubmit}
                disabled={isLoading || (!pendingFile && !text.trim())}
              >
                <Send size={13} />
                {latest && isResubmitting
                  ? `Resubmit (#${latest.attemptNumber + 1})`
                  : 'Submit Final Assignment'}
              </button>
            </div>
            {latest && isResubmitting && (
              <button
                type="button"
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: 8,
                  border: 0,
                  background: 'transparent',
                  color: '#5b6470',
                  fontSize: 11.5,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setIsResubmitting(false);
                  setPendingFile(null);
                  setText('');
                }}
              >
                Cancel
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AssignmentColumn;
