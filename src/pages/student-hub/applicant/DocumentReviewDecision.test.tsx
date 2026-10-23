import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentReviewDecision } from "./DocumentReviewDecision";
import type { DocumentReview } from "src/app/services/student-hub/documentManagementApi";

describe("student document review decision", () => {
  it.each([
    ["private", "No review requested"],
    ["pending", "Awaiting review"],
    ["in_progress", "In review"],
    ["approved", "Approved"],
    ["needs_revision", "Revision requested"],
  ] as const)("shows an accessible, readable decision for %s", (status, label) => {
    const html = renderToStaticMarkup(<DocumentReviewDecision status={status} />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Mentor review decision"');
    expect(html).toContain(`Mentor review: ${label}`);
    if (status === "needs_revision") expect(html).not.toContain("Mentor review: Approved");
  });

  it("does not invent approval for an unrecognized server state", () => {
    expect(renderToStaticMarkup(<DocumentReviewDecision status={"unknown" as DocumentReview["status"]} />)).toBe("");
  });
});
