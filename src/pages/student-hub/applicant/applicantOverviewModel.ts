import type { ApplicantOverview } from 'src/app/services/student-hub/applicantOverviewApi';
import type { MajorMatchStatusResponse } from 'src/app/services/student-hub/majorMatchApi';
import { isKnownMm3Slug } from '../major-match-v2/mm3-payload';

export type AssessmentState =
  | 'loading'
  | 'error'
  | 'new'
  | 'draft'
  | 'complete';

/** Legacy accounts without a saved degree use the Bachelor’s workspace. */
export function applicantDegree(value: unknown): 'bachelor' | 'master' {
  return value === 'master' ? 'master' : 'bachelor';
}

/** Strict variant: an unset or unrecognised degree stays unknown (null). */
export function applicantDegreeOrNull(
  value: unknown,
): 'bachelor' | 'master' | null {
  return value === 'master' || value === 'bachelor' ? value : null;
}

export function hasAssessmentDraft(raw: string | null): boolean {
  try {
    const answers: unknown = JSON.parse(raw ?? 'null')?.answers;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers))
      return false;
    return Object.entries(answers).some(
      ([slug, answer]) =>
        isKnownMm3Slug(slug) &&
        (typeof answer === 'number' ||
          (typeof answer === 'string' && answer.trim().length > 0) ||
          (Array.isArray(answer) && answer.length > 0)),
    );
  } catch {
    return false;
  }
}

export function assessmentState(input: {
  loading: boolean;
  error: boolean;
  status?: MajorMatchStatusResponse;
  hasReport: boolean;
  hasDraft: boolean;
}): AssessmentState {
  if (
    input.hasReport ||
    input.status?.hasCompletedMm3 ||
    input.status?.hasCompletedV2 ||
    input.status?.hasCompletedLegacy
  )
    return 'complete';
  if (input.loading) return 'loading';
  if (input.error || !input.status) return 'error';
  return input.hasDraft ? 'draft' : 'new';
}

export function overviewVisit(
  data: ApplicantOverview,
): 'new' | 'returning' | 'unknown' {
  const sections = [
    data.applications,
    data.tasks,
    data.documents,
    data.sessions,
  ];
  if (
    sections.some(
      (section) => section.state === 'ready' && section.data.total > 0,
    )
  )
    return 'returning';
  return sections.some((section) => section.state === 'error')
    ? 'unknown'
    : 'new';
}

export function displayName(value?: string | null): string {
  return (value ?? '')
    .trim()
    .split(/\s+/)
    .filter(
      (part) => !['undefined', 'null', 'unknown'].includes(part.toLowerCase()),
    )
    .join(' ');
}

export function safeMeetingLink(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      (url.hostname === 'meet.google.com' ||
        url.hostname === 'zoom.us' ||
        url.hostname.endsWith('.zoom.us'))
      ? url.href
      : null;
  } catch {
    return null;
  }
}
