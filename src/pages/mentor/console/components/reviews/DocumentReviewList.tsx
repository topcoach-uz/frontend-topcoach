import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Segmented,
  Select,
  Spin,
  Typography,
  message,
} from "antd";
import {
  useDownloadDocumentMutation,
  useGetDocumentReviewQuery,
  useGetSharedDocumentsQuery,
  useSubmitMentorDocumentReviewMutation,
} from "src/app/services/student-hub/documentManagementApi";

import { isDocumentAccessDenied } from 'src/app/services/student-hub/documentReadRecovery';
import { isAwaitingDocumentReview } from "./documentReviewStatus";

export type DocumentReviewListProps = {
  /**
   * Only show documents uploaded by this student (user id). Shared documents
   * carry `studentProfileId` (not the user id), so the match is made on
   * `uploadedBy`, which is the student's user id for self-uploaded files.
   */
  studentUserId?: string;
  /** Compact layout for use inside a student workspace tab. */
  embedded?: boolean;
};

export function DocumentReviewList({ studentUserId, embedded = false }: DocumentReviewListProps) {
  const { data, isLoading, isError, error, refetch } = useGetSharedDocumentsQuery(
    undefined,
    { pollingInterval: 10000 },
  );
  const [filter, setFilter] = useState<"Awaiting review" | "Reviewed">("Awaiting review");
  const [selectedId, setSelectedId] = useState<string>();
  const [versionId, setVersionId] = useState<string>();
  const [versionNumber, setVersionNumber] = useState<number>();
  const [staleSubmission, setStaleSubmission] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<"approved" | "needs_revision">(
    "approved",
  );
  const review = useGetDocumentReviewQuery(selectedId ?? "", {
    skip: !selectedId,
    pollingInterval: 10000,
  });
  const [submit, submitState] = useSubmitMentorDocumentReviewMutation();
  const [download] = useDownloadDocumentMutation();
  const scoped = (data?.data ?? []).filter(
    (document) => !studentUserId || document.uploadedBy === studentUserId,
  );
  const documents = scoped.filter((document) =>
    isAwaitingDocumentReview(document.reviewStatus) === (filter === "Awaiting review"),
  );
  const stale = staleSubmission || Boolean(review.data?.data.currentVersionId && versionId !== review.data.data.currentVersionId);
  const save = async () => {
    if (!selectedId || !versionId || stale || !feedback.trim()) return;
    try {
      await submit({
        id: selectedId,
        versionId,
        status,
        feedback: feedback.trim(),
      }).unwrap();
      setFeedback("");
      setSelectedId(undefined);
      message.success("Document feedback sent.");
    } catch (error) {
      if ((error as { status?: number }).status === 409) {
        setStaleSubmission(true);
        void review.refetch();
      }
      message.error(
        "Could not send feedback. Check for a new version or removed access; your text remains here.",
      );
      void refetch();
    }
  };
  return (
    <div>
      {!embedded && (
        <Typography.Paragraph>
          Files students have shared with you. Access ends when sharing is turned
          off.
        </Typography.Paragraph>
      )}
      <Segmented
        value={filter}
        onChange={(value) => { setFilter(value as typeof filter); setSelectedId(undefined); }}
        options={["Awaiting review", "Reviewed"]}
        style={{ marginBottom: 24 }}
      />
      {isLoading && <Spin />}
      {isError && (
        <Alert
          type={data ? "warning" : "error"}
          message={data ? "Document list could not refresh" : "Could not load shared documents"}
          description={isDocumentAccessDenied(error)
            ? "You do not have access to this document queue."
            : data ? "Showing the last loaded documents. We will retry automatically; your feedback draft is saved here."
              : "Check your connection and try again. We will also retry automatically."}
          action={<Button onClick={() => void refetch()}>Retry</Button>}
        />
      )}
      {!isLoading && !isError && !documents.length && (
        <Empty description={filter === "Reviewed" ? "No reviewed documents." : "No documents shared for review."} />
      )}
      {documents.map((document) => (
        <Card
          key={document.id}
          title={document.fileName}
          extra={studentUserId ? undefined : document.studentName}
          style={{ marginBottom: 16 }}
        >
          <p>Version {document.currentVersion ?? 1} · {document.reviewStatus?.replaceAll("_", " ") || "Pending"}</p>
          <Button
            onClick={async () => {
              try {
                const blob = await download(document.id).unwrap();
                const url = URL.createObjectURL(blob);
                const link = window.document.createElement("a");
                link.href = url;
                link.download = document.fileName;
                link.click();
                window.setTimeout(() => URL.revokeObjectURL(url), 30000);
              } catch {
                message.error(
                  "This file is unavailable. Access may have been removed.",
                );
                void refetch();
              }
            }}
          >
            Download {document.fileName}
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => {
              setSelectedId(document.id);
              setVersionId(document.currentVersionId);
              setVersionNumber(document.currentVersion);
              setStaleSubmission(false);
              setFeedback("");
            }}
          >
            Review document
          </Button>
          {selectedId === document.id && (
            <div style={{ marginTop: 20 }}>
              <p>Reviewing version {versionNumber ?? 1}</p>
              {stale && <Alert type="warning" message="The student uploaded a newer version. Reload it before reviewing." description="Your existing draft describes the earlier file. Reloading clears this draft." action={<Button onClick={() => {
                if (!review.data?.data.currentVersionId) return;
                setVersionId(review.data.data.currentVersionId);
                setVersionNumber(review.data.data.currentVersion);
                setFeedback(""); setStaleSubmission(false);
              }}>Reload current version</Button>} />}

              {review.isError && (
                <Alert
                  type="error"
                  message={isDocumentAccessDenied(review.error)
                    ? "Review access is no longer available."
                    : "Could not refresh this review."}
                  description={isDocumentAccessDenied(review.error)
                    ? "The student may have removed sharing or changed their mentor."
                    : "Your draft is saved here. Retry to check the latest version before sending."}
                  action={<Button onClick={() => void review.refetch()}>Retry review</Button>}
                />
              )}
              {review.data?.data.feedback.map((item) => (
                <Typography.Paragraph key={item.id}>
                  <small>{item.documentVersion ? `Version ${item.documentVersion}` : "Earlier feedback (version not recorded)"}{item.reviewDecision ? ` · ${item.reviewDecision.replaceAll("_", " ")}` : ""}</small><br />{item.content}
                </Typography.Paragraph>
              ))}
              <label htmlFor="document-review-decision">Decision</label>
              <Select
                id="document-review-decision"
                value={status}
                onChange={setStatus}
                style={{ display: "block", margin: "8px 0 16px" }}
                options={[
                  { value: "approved", label: "Approve document" },
                  { value: "needs_revision", label: "Request revision" },
                ]}
              />
              <label htmlFor="document-review-feedback">Your feedback</label>
              <Input.TextArea
                id="document-review-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
                maxLength={10000}
              />
              <Button
                type="primary"
                style={{ marginTop: 12 }}
                loading={submitState.isLoading}
                disabled={
                  !versionId || stale || !feedback.trim() ||
                  review.isError ||
                  !documents.some((item) => item.id === selectedId)
                }
                onClick={() => void save()}
              >
                Send document feedback
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
