import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
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

export default function DocumentReviewsPage() {
  const { data, isLoading, isError, refetch } = useGetSharedDocumentsQuery(
    undefined,
    { pollingInterval: 10000 },
  );
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
  const documents = data?.data ?? [];
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
    <div
      style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px 64px" }}
    >
      <Typography.Title level={2}>Document reviews</Typography.Title>
      <Typography.Paragraph>
        Files students have shared with you. Access ends when sharing is turned
        off.
      </Typography.Paragraph>
      {isLoading && <Spin />}
      {isError && (
        <Alert
          type="error"
          message="Could not load shared documents"
          action={<Button onClick={() => void refetch()}>Retry</Button>}
        />
      )}
      {!isLoading && !isError && !documents.length && (
        <Empty description="No documents shared for review." />
      )}
      {documents.map((document) => (
        <Card
          key={document.id}
          title={document.fileName}
          extra={document.studentName}
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
                  message="Review access is no longer available."
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
