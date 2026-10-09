/** Opt-in rollout; disabling it restores the existing hub and its saved URLs. */
export const APPLICANT_WORKSPACE_ENABLED =
  import.meta.env.VITE_APPLICANT_WORKSPACE_ENABLED === 'true';

export function isApplicantWorkspacePath(pathname: string) {
  return (
    APPLICANT_WORKSPACE_ENABLED &&
    /^\/student-hub(?:\/|$)/.test(pathname) &&
    !/^\/student-hub\/(?:sat-prep|research-prep|ielts-prep)(?:\/|$)/.test(pathname)
  );
}

export const applicantLinks = {
  overview: '/student-hub/overview',
  applications: '/student-hub/applications',
  universities: '/student-hub/universities',
  tasks: '/student-hub/tasks',
  satPrep: '/student-hub/sat-prep',
  newApplication: '/student-hub/applications/new',
  profile: '/student-hub?section=others&target=profile&tab=academic',
  personal: '/student-hub?section=others&target=profile&tab=personal',
  documents: '/student-hub/documents',
  essays: '/student-hub/essays',
  majorMatch: '/student-hub/psychometric-assessment',
  studyDirection: '/student-hub/study-direction',
  learning: '/student-hub?section=my-learning',
  admissions: '/student-hub?section=admissions-program',
  fullSupport: '/student-hub?section=others&target=full-support',
  feed: '/student-hub?section=feed',
  buddies: '/student-hub?section=buddies',
  messages: '/student-hub?section=messages',
  settings: '/student-hub?section=account&target=settings',
} as const;

export function applicationWorkspaceLink(id: string) {
  return `/student-hub/applications/${encodeURIComponent(id)}`;
}

export function isOverviewLocation(pathname: string, search: string) {
  if (
    pathname === '/student-hub/overview' ||
    pathname === '/student-hub/dashboard'
  )
    return true;
  if (!/^\/student-hub\/?$/.test(pathname)) return false;
  const section = new URLSearchParams(search).get('section');
  return !section || section === 'dashboard' || section === 'overview';
}
