import { applicantLinks } from 'src/lib/applicantWorkspace';

/**
 * Where "My learning" lands — the dashboard the workspace rail opens, for
 * every applicant. Course pages use it for their Back control.
 */
export function useMyLearningPath(): string {
  return applicantLinks.learning;
}
