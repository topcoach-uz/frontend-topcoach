import type { ProgramWorkInput } from "src/app/services/mentorProgramsApi";

export type ProgramWorkSubmission = { id: string; body: ProgramWorkInput };
const key = (mentorId: string) => `mentor-program-work-pending:${mentorId}`;

/** Keep the exact request across navigation/reload when the result is unknown. */
export function readPendingWork(
  mentorId: string,
): ProgramWorkSubmission | null {
  try {
    const pending = JSON.parse(sessionStorage.getItem(key(mentorId)) || "null");
    return pending?.id &&
      pending.body?.requestId &&
      pending.body.mentorUserId === mentorId
      ? pending
      : null;
  } catch {
    return null;
  }
}

export function storePendingWork(
  mentorId: string,
  submission: ProgramWorkSubmission | null,
) {
  try {
    if (submission)
      sessionStorage.setItem(key(mentorId), JSON.stringify(submission));
    else sessionStorage.removeItem(key(mentorId));
  } catch {
    // If browser storage is disabled, the mounted form still retains its draft.
  }
}
