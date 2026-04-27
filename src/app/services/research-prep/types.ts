/**
 * Research Prep — shared types.
 *
 * Mirrors the data shapes the future backend endpoints will return. Frontend
 * consumes these via mock RTK slice today; the same hooks switch to live
 * `/api/...` endpoints once backend lands.
 */

export type ResearchAttachmentKind = 'file' | 'link';

export interface ResearchAttachment {
  id: string;
  kind: ResearchAttachmentKind;
  title: string;
  /** For files: stored URL. For links: external URL. */
  url: string;
  fileName?: string;
  fileSizeBytes?: number;
}

export interface ResearchVideoLesson {
  id: string;
  title: string;
  description?: string;
  /** Total seconds — used for the progress display. */
  durationSeconds: number;
  /** VdoCipher video id. Frontend renders a stub player when no OTP backend yet. */
  vdocipherVideoId?: string;
  /** Optional public preview URL — frontend uses this in mock mode. */
  previewUrl?: string;
  attachments: ResearchAttachment[];
}

export interface ResearchQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** Index of the correct option. */
  correctIndex: number;
  /** Hint shown on demand. Optional. */
  hint?: string;
  /** Explanation shown after submission, regardless of correctness. */
  explanation: string;
}

export interface ResearchQuiz {
  id: string;
  title: string;
  questions: ResearchQuizQuestion[];
}

export interface ResearchAssignment {
  id: string;
  title: string;
  /** Markdown instructions. */
  instructionsMd: string;
  acceptedFileTypes: string[];
  maxFileSizeMb: number;
  allowText: boolean;
}

export interface ResearchWeek {
  id: string;
  /** 1..8 */
  weekNumber: number;
  title: string;
  tagline: string;
  videoLessons: ResearchVideoLesson[];
  quiz: ResearchQuiz;
  assignment: ResearchAssignment;
}

export type WeekLockReason =
  | 'previous-week-not-submitted'
  | 'video-lessons-incomplete'
  | 'quiz-not-passed'
  | 'module-locked';

export interface WeekLockState {
  weekId: string;
  weekNumber: number;
  weekLocked: boolean;
  weekLockReason?: WeekLockReason;
  /** Per-video completion */
  videos: Record<string, { completed: boolean; progressPercent: number }>;
  quiz: {
    locked: boolean;
    passed: boolean;
    bestScorePercent: number;
    attempts: number;
    lockReason?: WeekLockReason;
  };
  assignment: {
    locked: boolean;
    submissionStatus: ResearchSubmissionStatus | 'none';
    lockReason?: WeekLockReason;
  };
}

export interface ResearchProgressSummary {
  weeksCompleted: number; // 0..8 (a week is "complete" when assignment is submitted)
  overallPercent: number; // 0..100
  currentWeekNumber: number; // first week not yet complete; clamps to 8
  totalAssignmentsGraded: number;
  totalAssignmentsPending: number;
}

export type ResearchSubmissionStatus =
  | 'submitted'
  | 'under_review'
  | 'graded'
  | 'returned_for_revision';

export interface ResearchSubmission {
  id: string;
  assignmentId: string;
  weekNumber: number;
  weekTitle: string;
  studentId: string;
  studentName: string;
  /** Whether this student is in Full Support — drives grader routing. */
  isFullSupport: boolean;
  attemptNumber: number;
  fileUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  textBody?: string;
  status: ResearchSubmissionStatus;
  submittedAt: string;
  /** Set when a grader has claimed it. */
  gradedByUserId?: string;
  gradedByName?: string;
  gradedAt?: string;
  feedbackMd?: string;
  score?: number;
  /** Optional graded copy the mentor uploaded with their feedback. */
  graderFileUrl?: string;
  graderFileName?: string;
  graderFileSizeBytes?: number;
}

export interface QuizAttemptResult {
  weekId: string;
  attemptNumber: number;
  /** Per-question correctness. */
  perQuestion: Array<{
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean;
  }>;
  scorePercent: number;
  passed: boolean;
  submittedAt: string;
}

export interface ResearchAdminStudent {
  id: string;
  name: string;
  avatarUrl?: string;
  isFullSupport: boolean;
  weeksCompleted: number;
  overallPercent: number;
  pendingSubmissions: number;
}

/**
 * Coerce an RTK Query error (or a thrown native error) into a plain string
 * suitable for `message.error(...)`. Nest's `HttpException`s come through
 * as `{ data: { message, error, statusCode } }`, which crashes when passed
 * directly to React. Use this helper everywhere we surface an API error.
 */
export function researchPrepErrorMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;
  const e = err as { data?: unknown; error?: unknown; message?: unknown };
  const data = e.data;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const m = (data as { message?: unknown }).message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m) && typeof m[0] === 'string') return m[0];
  }
  if (typeof e.message === 'string') return e.message;
  if (typeof e.error === 'string') return e.error;
  return fallback;
}
