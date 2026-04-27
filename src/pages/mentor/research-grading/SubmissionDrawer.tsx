/**
 * SubmissionDrawer
 *
 * Side drawer the mentor opens from the inbox row. Shows the student's
 * submission (file + text), lets the mentor claim if unassigned, and writes
 * feedback + score.
 */

import React, { useEffect, useState } from 'react';
import {
  Button,
  Drawer,
  Input,
  InputNumber,
  Space,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import {
  CalendarClock,
  Download,
  FileText,
  GraduationCap,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Send,
  Undo2,
} from 'lucide-react';
import {
  useClaimSubmissionMutation,
  useGradeSubmissionMutation,
  researchPrepErrorMessage,
  type ResearchSubmission,
} from 'src/app/services/research-prep';

const { TextArea } = Input;

const STATUS_PILL: Record<ResearchSubmission['status'], { label: string; cls: string }> = {
  submitted: { label: 'Submitted', cls: 'rg-status-pill--submitted' },
  under_review: { label: 'Under review', cls: 'rg-status-pill--review' },
  graded: { label: 'Graded', cls: 'rg-status-pill--graded' },
  returned_for_revision: { label: 'Returned for revision', cls: 'rg-status-pill--returned' },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const fmtBytes = (b?: number) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

interface SubmissionDrawerProps {
  open: boolean;
  submission: ResearchSubmission | null;
  onClose: () => void;
}

const MAX_GRADER_FILE_MB = 5;

const SubmissionDrawer: React.FC<SubmissionDrawerProps> = ({ open, submission, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [graderFile, setGraderFile] = useState<UploadFile | null>(null);
  const [claim, { isLoading: claiming }] = useClaimSubmissionMutation();
  const [grade, { isLoading: grading }] = useGradeSubmissionMutation();

  useEffect(() => {
    if (open && submission) {
      setFeedback(submission.feedbackMd ?? '');
      setScore(submission.score ?? null);
      setGraderFile(null);
    } else if (!open) {
      setFeedback('');
      setScore(null);
      setGraderFile(null);
    }
  }, [open, submission?.id]);

  if (!submission) return null;

  const isClaimed = submission.gradedByUserId === 'me';
  const isUnclaimed = !submission.gradedByUserId;
  const canEdit = isClaimed && submission.status !== 'graded';
  const isGraded = submission.status === 'graded';

  const handleClaim = async () => {
    try {
      await claim(submission.id).unwrap();
      message.success('Submission claimed.');
    } catch (e: any) {
      message.error(researchPrepErrorMessage(e, 'Could not claim submission.'));
    }
  };

  const handleGrade = async (action: 'mark-graded' | 'return-for-revision') => {
    if (!feedback.trim()) {
      message.warning('Write some feedback before saving.');
      return;
    }
    if (action === 'mark-graded' && (score == null || score < 0 || score > 100)) {
      message.warning('Set a score between 0 and 100 before marking graded.');
      return;
    }
    try {
      await grade({
        submissionId: submission.id,
        feedbackMd: feedback.trim(),
        score: score ?? 0,
        action,
        file: (graderFile?.originFileObj as File | undefined) ?? undefined,
      }).unwrap();
      message.success(
        action === 'mark-graded' ? 'Saved feedback and marked graded.' : 'Returned for revision.',
      );
      onClose();
    } catch (e: any) {
      message.error(researchPrepErrorMessage(e, 'Could not save grade.'));
    }
  };

  const uploadProps: UploadProps = {
    accept: '.pdf,.doc,.docx',
    maxCount: 1,
    fileList: graderFile ? [graderFile] : [],
    beforeUpload: (file) => {
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > MAX_GRADER_FILE_MB) {
        message.error(`Graded copy must be under ${MAX_GRADER_FILE_MB} MB.`);
        return Upload.LIST_IGNORE;
      }
      // Stash the File on the AntD UploadFile so RTK can pick it up.
      setGraderFile({
        uid: file.uid,
        name: file.name,
        status: 'done',
        size: file.size,
        originFileObj: file as unknown as UploadFile['originFileObj'],
      });
      return false; // prevent auto-upload; we send via the mutation
    },
    onRemove: () => {
      setGraderFile(null);
      return true;
    },
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700 }}>
            Week {submission.weekNumber} · {submission.weekTitle}
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
            {submission.studentName}
          </span>
        </div>
      }
      width={640}
      className="research-grading-drawer"
      destroyOnClose
      extra={
        <span className={`rg-status-pill ${STATUS_PILL[submission.status].cls}`}>
          {STATUS_PILL[submission.status].label}
        </span>
      }
    >
      <div className="rgd-meta-row">
        <span className="meta">
          <CalendarClock size={11} style={{ verticalAlign: -2, marginRight: 4 }} />
          {fmtDate(submission.submittedAt)}
        </span>
        <span className="meta">Attempt #{submission.attemptNumber}</span>
        <span className="meta">
          {submission.isFullSupport ? 'Full Support' : 'Non-FS (opt-in review)'}
        </span>
        {submission.gradedByName && (
          <span className="meta">
            <GraduationCap size={11} style={{ verticalAlign: -2, marginRight: 4 }} />
            Grader: {submission.gradedByName}
          </span>
        )}
      </div>

      {/* File submission */}
      {submission.fileName && (
        <div className="rgd-section">
          <div className="head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <FileText size={12} /> File submission
            </span>
            {submission.fileUrl && (
              <Button
                size="small"
                icon={<Download size={13} />}
                href={submission.fileUrl}
                target="_blank"
              >
                Download
              </Button>
            )}
          </div>
          <div className="body">
            <strong>{submission.fileName}</strong>
            {submission.fileSizeBytes ? (
              <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 8 }}>
                {fmtBytes(submission.fileSizeBytes)}
              </span>
            ) : null}
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12.5 }}>
              The actual file would render in a PDF viewer here once the storage backend is wired.
            </Typography.Paragraph>
          </div>
        </div>
      )}

      {/* Text body */}
      {submission.textBody && (
        <div className="rgd-section">
          <div className="head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={12} /> Text submission
            </span>
          </div>
          <div className="body">{submission.textBody}</div>
        </div>
      )}

      {/* Existing feedback (if graded) — read-only summary block */}
      {isGraded && (
        <div className="rgd-section">
          <div className="head">
            <span>Previous feedback</span>
            <span style={{ color: '#1f2937' }}>{submission.score} / 100</span>
          </div>
          <div className="body">{submission.feedbackMd}</div>
          {submission.graderFileName && submission.graderFileUrl && (
            <div className="body" style={{ paddingTop: 0 }}>
              <Button
                size="small"
                icon={<Download size={13} />}
                href={submission.graderFileUrl}
                target="_blank"
              >
                {submission.graderFileName}
              </Button>
              {submission.graderFileSizeBytes ? (
                <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 8 }}>
                  {fmtBytes(submission.graderFileSizeBytes)}
                </span>
              ) : null}
            </div>
          )}
          {submission.gradedAt && (
            <div className="body" style={{ paddingTop: 0, color: '#6b7280', fontSize: 11.5 }}>
              Graded {fmtDate(submission.gradedAt)}
              {submission.gradedByName ? ` by ${submission.gradedByName}` : ''}
            </div>
          )}
        </div>
      )}

      {/* Grade / return controls */}
      <div className="rgd-section">
        <div className="head">
          <span>{isGraded ? 'Re-grade (resubmissions)' : 'Write feedback'}</span>
          {isUnclaimed && (
            <Button size="small" type="primary" loading={claiming} onClick={handleClaim}
                    style={{ background: '#8b0000', borderColor: '#8b0000' }}>
              Claim to grade
            </Button>
          )}
        </div>
        <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextArea
            rows={6}
            placeholder="Write feedback for the student. Supports plain text or Markdown."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={!canEdit && !isGraded}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12.5, color: '#6b7280' }}>Score</span>
            <InputNumber
              min={0}
              max={100}
              value={score ?? undefined}
              onChange={(v) => setScore(v as number | null)}
              addonAfter="/100"
              disabled={!canEdit && !isGraded}
              style={{ width: 140 }}
            />
            <Tag color="default" style={{ marginLeft: 'auto' }}>
              0–100
            </Tag>
          </div>
          {(canEdit || isGraded) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12.5, color: '#6b7280' }}>
                Optional graded copy (PDF / DOCX, max {MAX_GRADER_FILE_MB} MB)
              </span>
              <Upload {...uploadProps}>
                <Button icon={<Paperclip size={14} />}>
                  {graderFile ? 'Replace file' : 'Attach file'}
                </Button>
              </Upload>
            </div>
          )}
          {(canEdit || isGraded) && (
            <Space>
              <Button
                type="primary"
                icon={<Send size={14} />}
                loading={grading}
                onClick={() => handleGrade('mark-graded')}
                disabled={!isClaimed && !isGraded}
                style={{ background: '#8b0000', borderColor: '#8b0000' }}
              >
                {isGraded ? 'Update grade' : 'Save & mark graded'}
              </Button>
              <Button
                icon={<Undo2 size={14} />}
                loading={grading}
                onClick={() => handleGrade('return-for-revision')}
                disabled={!isClaimed && !isGraded}
              >
                Return for revision
              </Button>
              {!isClaimed && !isGraded && (
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  <RefreshCw size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                  Claim first to enable grading.
                </span>
              )}
            </Space>
          )}
        </div>
      </div>
    </Drawer>
  );
};

export default SubmissionDrawer;
