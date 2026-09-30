import type { StudentEssay } from "src/app/services/student-hub/types";

export function getMentorFeedbackText(
  feedback: StudentEssay["mentorFeedback"],
): string {
  if (typeof feedback === "string") return feedback.trim();
  if (!feedback) return "";

  return [
    feedback.strengths?.join("\n"),
    feedback.areasForImprovement?.join("\n"),
    feedback.suggestions?.join("\n"),
    feedback.approvalNotes,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n\n");
}
