import type { CollegeApplication } from "src/app/services/student-hub/types";
import { parseApplicantDate } from "./applicantDate";

/** A submission date is entered by the student, never inferred from saving a plan. */
export function submissionDateFields(
  status: CollegeApplication["status"] | undefined,
  enteredDate?: string | null,
  original?: string | null,
): { submittedAt?: string | null } {
  if (status !== "submitted" && status !== "under_review") return {};
  if (!enteredDate) return { submittedAt: null };
  if (original) {
    const date = parseApplicantDate(original);
    const calendarDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (calendarDate === enteredDate) return { submittedAt: original };
  }
  return { submittedAt: enteredDate };
}

export function planningDeadlineState(
  deadline?: string | null,
  now = new Date(),
) {
  if (!deadline) return null;
  const date = parseApplicantDate(deadline);
  if (!Number.isFinite(date.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((day.getTime() - today.getTime()) / 86400000);
  return days < 0
    ? {
        tone: "overdue",
        label: `Overdue by ${Math.abs(days)} ${days === -1 ? "day" : "days"}`,
      }
    : days === 0
      ? { tone: "today", label: "Due today" }
      : days <= 7
        ? { tone: "soon", label: `${days} ${days === 1 ? "day" : "days"} left` }
        : null;
}
