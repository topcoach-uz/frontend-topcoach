export function isApplicantWorkspacePath(pathname: string) {
  return (
    /^\/student-hub(?:\/|$)/.test(pathname) &&
    !/^\/student-hub\/(?:sat-prep|research-prep|ielts-prep)(?:\/|$)/.test(pathname)
  );
}

export const applicantLinks = {
  overview: '/student-hub/overview',
  applications: '/student-hub/applications',
  universities: '/student-hub/universities',
  tasks: '/student-hub/tasks',
  sessions: '/student-hub/sessions',
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

/** Keep bookmarks to retired workspace panes useful without mounting their UI. */
export function legacyWorkspaceRedirect(search: string): string | null {
  const params = new URLSearchParams(search);
  if (params.get('section') !== 'others') return null;
  const target = params.get('target');
  const tab = target === 'profile' ? params.get('tab') : target;
  if (tab === 'college-lists') {
    return params.get('applicationFlow') === 'new'
      ? applicantLinks.newApplication
      : applicantLinks.applications;
  }
  if (tab === 'documents') return applicantLinks.documents;
  if (target === 'essays') return applicantLinks.essays;
  return null;
}
