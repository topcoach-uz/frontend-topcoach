import { describe, expect, it } from 'vitest';
import {
  applicantDegree,
  applicantDegreeOrNull,
  assessmentState,
  displayName,
  hasAssessmentDraft,
  overviewVisit,
  safeMeetingLink,
} from './applicantOverviewModel';
import type { ApplicantOverview } from 'src/app/services/student-hub/applicantOverviewApi';
import type { MajorMatchStatusResponse } from 'src/app/services/student-hub/majorMatchApi';
import {
  applicationWorkspaceLink,
  isOverviewLocation,
  legacyWorkspaceRedirect,
} from 'src/lib/applicantWorkspace';

const status = {
  hasCompletedV2: false,
  hasCompletedLegacy: false,
  hasCompletedMm3: false,
} as MajorMatchStatusResponse;
const ready = { state: 'ready', data: { total: 0 } };
const empty = {
  profile: null,
  applications: ready,
  tasks: ready,
  documents: ready,
  sessions: ready,
} as ApplicantOverview;

describe('legacy applicant degree fallback', () => {
  it.each([undefined, null, '', 'unknown', 'bachelor'])('defaults %s to Bachelor’s', (degree) => {
    expect(applicantDegree(degree)).toBe('bachelor');
  });
  it('preserves an explicit Master’s selection', () => {
    expect(applicantDegree('master')).toBe('master');
  });
});

describe('strict applicant degree', () => {
  it.each([undefined, null, '', 'unknown', 'Master', 0, {}])(
    'keeps %s unknown instead of defaulting to Bachelor’s',
    (degree) => {
      expect(applicantDegreeOrNull(degree)).toBeNull();
    },
  );
  it('returns exact matches', () => {
    expect(applicantDegreeOrNull('bachelor')).toBe('bachelor');
    expect(applicantDegreeOrNull('master')).toBe('master');
  });
});

describe('applicant overview states', () => {
  it('never calls a partial failure a first visit', () => {
    expect(overviewVisit(empty)).toBe('new');
    expect(
      overviewVisit({ ...empty, documents: { state: 'error', data: null } }),
    ).toBe('unknown');
    expect(
      overviewVisit({
        ...empty,
        applications: { state: 'error', data: null },
        documents: { state: 'ready', data: { total: 3 } },
      }),
    ).toBe('returning');
  });
  it('does not prompt a legacy, v2 or MM3 completer to take a new assessment', () => {
    for (const key of [
      'hasCompletedLegacy',
      'hasCompletedV2',
      'hasCompletedMm3',
    ]) {
      expect(
        assessmentState({
          status: { ...status, [key]: true },
          loading: false,
          error: true,
          hasReport: false,
          hasDraft: true,
        }),
      ).toBe('complete');
    }
  });
  it('keeps unavailable and loading assessment status distinct from a new assessment', () => {
    const base = {
      loading: false,
      error: false,
      hasReport: false,
      hasDraft: false,
    };
    expect(assessmentState(base)).toBe('error');
    expect(assessmentState({ ...base, status })).toBe('new');
    expect(assessmentState({ ...base, status, hasDraft: true })).toBe('draft');
    expect(assessmentState({ ...base, status, loading: true })).toBe('loading');
    expect(assessmentState({ ...base, status, error: true })).toBe('error');
    expect(assessmentState({ ...base, error: true, hasReport: true })).toBe(
      'complete',
    );
  });
  it.each([
    null,
    '',
    'not-json',
    '{}',
    '{"answers":[]}',
    '{"answers":{"removed-question":1}}',
    '{"answers":{"countries":[]}}',
  ])('does not resume empty or invalid drafts: %s', (raw) => {
    expect(hasAssessmentDraft(raw)).toBe(false);
  });
  it('recognizes a real saved answer including option zero', () => {
    expect(hasAssessmentDraft('{"answers":{"countries":[0]}}')).toBe(true);
    expect(hasAssessmentDraft('{"answers":{"countries":0}}')).toBe(true);
  });
  it('does not manufacture a student name', () => {
    expect(displayName(' undefined  null ')).toBe('');
    expect(displayName(' Alex   Smith ')).toBe('Alex Smith');
  });
  it('retains old overview links without swallowing other hub sections', () => {
    for (const [path, query] of [
      ['/student-hub', ''],
      ['/student-hub/', '?section=dashboard'],
      ['/student-hub/overview', ''],
      ['/student-hub/dashboard', ''],
    ])
      expect(isOverviewLocation(path, query)).toBe(true);
    expect(isOverviewLocation('/student-hub', '?section=my-learning')).toBe(
      false,
    );
    expect(
      isOverviewLocation('/student-hub', '?section=others&target=profile'),
    ).toBe(false);
    expect(applicationWorkspaceLink('app-a')).toBe(
      '/student-hub/applications/app-a',
    );
  });
  it.each([
    'javascript:alert(1)',
    'http://meet.google.com/abc',
    'https://meet.google.com.evil.test/abc',
    'https://evil.test',
    'https://name:pass@meet.google.com/test',
  ])('rejects unsafe meeting links: %s', (url) => {
    expect(safeMeetingLink(url)).toBeNull();
  });
  it.each(['https://meet.google.com/abc', 'https://us02web.zoom.us/j/123'])(
    'keeps supported secure meetings: %s',
    (url) => {
      expect(safeMeetingLink(url)).toBe(url);
    },
  );
});

it('always uses the applicant shell while keeping specialist prep pages independent', async () => {
  const { isApplicantWorkspacePath } = await import('src/lib/applicantWorkspace');
  for (const path of ['/student-hub', '/student-hub/overview', '/student-hub/applications', '/student-hub/documents', '/student-hub/research-prep']) {
    expect(isApplicantWorkspacePath(path)).toBe(true);
  }
  for (const path of ['/student-hub/sat-prep/runner', '/student-hub/ielts-prep', '/counselor-console', '/student-hub-other']) {
    expect(isApplicantWorkspacePath(path)).toBe(false);
  }
});

it.each([
  ['?section=others&target=profile&tab=college-lists', '/student-hub/applications'],
  ['?section=others&target=college-lists&applicationFlow=new', '/student-hub/applications/new'],
  ['?section=others&target=profile&tab=documents', '/student-hub/documents'],
  ['?section=others&target=documents', '/student-hub/documents'],
  ['?section=others&target=essays', '/student-hub/essays'],
  ['?section=others&target=profile&tab=academic', null],
  ['?section=others&target=full-support', null],
  ['?section=messages', null],
])('routes retired workspace link %s to %s', (search, expected) => {
  expect(legacyWorkspaceRedirect(search)).toBe(expected);
});
