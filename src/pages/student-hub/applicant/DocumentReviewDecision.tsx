import { Alert } from "antd";
import type { DocumentReview } from "src/app/services/student-hub/documentManagementApi";

const decisions = {
  private: { type: "info", label: "No review requested", description: "Share this document with your assigned mentor to request feedback." },
  pending: { type: "info", label: "Awaiting review", description: "Waiting for your mentor to review this version." },
  in_progress: { type: "info", label: "In review", description: "Your mentor is reviewing this version." },
  approved: { type: "success", label: "Approved", description: "Your mentor approved this document. Open Feedback to read their comments." },
  needs_revision: { type: "warning", label: "Revision requested", description: "Your mentor requested changes. Open Feedback before uploading a new version." },
} as const;

export function DocumentReviewDecision({ status }: { status: DocumentReview["status"] }) {
  const decision = decisions[status];
  if (!decision) return null;
  return <div role="status" aria-label="Mentor review decision" style={{ marginBottom: 16 }}>
    <Alert type={decision.type} showIcon message={`Mentor review: ${decision.label}`} description={decision.description} />
  </div>;
}
