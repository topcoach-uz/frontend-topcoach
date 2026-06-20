// ISC 2026 Admissions — preview types.
// Self-contained for the clickable mock; these mirror the planned
// backend shapes (isc_applications, isc_reviews, isc_ai_evaluations…)
// so the components lift cleanly onto the real API later.

export type IscProgram = 'bachelor' | 'master';
export type IscApplicantType = 'local' | 'international';

export type IscRegion =
  | 'Central Asia'
  | 'South Asia'
  | 'East Asia'
  | 'Europe'
  | 'Middle East'
  | 'Africa'
  | 'Latin America';

export type IscStatus =
  | 'submitted'
  | 'under_review'
  | 'reviewed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'accepted'
  | 'waitlisted'
  | 'rejected'
  | 'withdrawn';

export type IscRecommendation =
  | 'strong_recommend'
  | 'recommend'
  | 'neutral'
  | 'not_recommend';

/** The five scoring dimensions, 0–10 each (total /50). */
export interface IscScores {
  academicPotential: number;
  leadership: number;
  extracurricular: number;
  motivation: number;
  communication: number;
}

export interface IscAiFlag {
  type: string;
  severity: 'info' | 'warn' | 'high';
  detail: string;
}

export interface IscAiEvaluation {
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  scores: IscScores;
  total: number;
  summary: string;
  flags: IscAiFlag[];
  model: string;
}

export interface IscReview {
  reviewerId: string;
  reviewerName: string;
  scores: IscScores;
  total: number;
  recommendation: IscRecommendation;
  notes: string;
}

export interface IscInterview {
  scheduledAt: string; // ISO
  interviewer: string;
  meetingLink: string;
  status: 'scheduled' | 'completed' | 'no_show' | 'cancelled';
  scores?: {
    communication: number;
    leadership: number;
    criticalThinking: number;
    motivation: number;
    campFit: number;
  };
  notes?: string;
}

export interface IscDocument {
  label: string;
  kind: 'cv' | 'passport' | 'english' | 'transcript' | 'other';
}

export interface IscApplication {
  id: string;
  fullName: string;
  initials: string;
  program: IscProgram;
  applicantType: IscApplicantType;
  region: IscRegion;
  grade: number; // 9–12
  school: string;
  email: string;
  passportNumber: string;
  gpa: string;
  englishCert: string;
  submittedAt: string; // ISO date
  status: IscStatus;
  extracurriculars: string[];
  essays: { whyCamp: string; reflection: string };
  documents: IscDocument[];
  ai: IscAiEvaluation;
  reviews: IscReview[];
  assignedReviewerIds: string[];
  interview?: IscInterview;
  decision?: 'accepted' | 'waitlisted' | 'rejected';
}

export interface IscReviewer {
  id: string;
  name: string;
}

export const SCORE_DIMENSIONS: { key: keyof IscScores; label: string }[] = [
  { key: 'academicPotential', label: 'Academic potential' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'extracurricular', label: 'Extracurricular activities' },
  { key: 'motivation', label: 'Motivation' },
  { key: 'communication', label: 'Communication & writing' },
];

export const STATUS_LABEL: Record<IscStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  reviewed: 'Reviewed',
  withdrawn: 'Withdrawn',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  accepted: 'Accepted',
  waitlisted: 'Waitlisted',
  rejected: 'Rejected',
};

export const RECOMMENDATION_LABEL: Record<IscRecommendation, string> = {
  strong_recommend: 'Strong Recommend',
  recommend: 'Recommend',
  neutral: 'Neutral',
  not_recommend: 'Not Recommend',
};

export function scoreTotal(s: IscScores): number {
  return (
    s.academicPotential +
    s.leadership +
    s.extracurricular +
    s.motivation +
    s.communication
  );
}
