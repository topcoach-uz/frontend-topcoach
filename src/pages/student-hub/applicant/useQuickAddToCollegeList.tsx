import { useCallback, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useCreateCollegeApplicationMutation } from "src/app/services/student-hub/applicationTrackingApi";
import type { CollegeApplication, CreateCollegeApplicationRequest } from "src/app/services/student-hub/types";
import { applicantLinks, applicationWorkspaceLink } from "src/lib/applicantWorkspace";

/** Full add form for a university, used when a one-tap add is not possible. */
export const fullApplicationFormLink = (universityId: string) => `${applicantLinks.newApplication}?university=${encodeURIComponent(universityId)}`;

/**
 * One-tap "Add to College List": creates the application with defaults, confirms with a toast that links to
 * the deadline form, and falls back to the full form when the server rejects the defaults.
 */
export function useQuickAddToCollegeList() {
  const navigate = useNavigate();
  const [create] = useCreateCollegeApplicationMutation();
  const [pendingId, setPendingId] = useState<string>();
  const add = useCallback(async (universityId: string, major?: string, options?: { undergraduateDegreeId?: string; fallbackHref?: string }) => {
    if (pendingId) return;
    setPendingId(universityId);
    const payload: CreateCollegeApplicationRequest = {
      universityId,
      degreeLevel: "bachelor",
      status: "researching",
      // 'common-app' is the backend enum value; the frontend union type is stale (same workaround as the full form).
      applicationType: "common-app" as CreateCollegeApplicationRequest["applicationType"],
      ...(options?.undergraduateDegreeId ? { undergraduateDegreeId: options.undergraduateDegreeId } : {}),
      ...(major?.trim() ? { major: major.trim().slice(0, 255) } : {}),
    };
    try {
      const result = await create(payload).unwrap();
      const entity = result && typeof result === "object" && "data" in result ? result.data : (result as unknown as CollegeApplication);
      const key = `college-list-added-${universityId}`;
      message.success({
        key,
        duration: 6,
        content: <span>Added to College List.{entity?.id && <> <button type="button" className="applicant-toast-link" onClick={() => { message.destroy(key); navigate(`${applicationWorkspaceLink(entity.id)}/edit`); }}>Add a deadline</button></>}</span>,
      });
    } catch {
      message.info("We couldn’t add this in one tap. Fill in the details to add it.");
      navigate(options?.fallbackHref ?? fullApplicationFormLink(universityId));
    } finally {
      setPendingId(undefined);
    }
  }, [create, navigate, pendingId]);
  return { add, pendingId };
}
