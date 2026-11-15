import { useTypedSelector } from 'src/app/store';
import { useGetApplicantOverviewQuery } from 'src/app/services/student-hub/applicantOverviewApi';
import { applicantLinks } from 'src/lib/applicantWorkspace';
import { applicantDegree } from './applicantOverviewModel';

/**
 * Where "My learning" lands — the same page the workspace rail opens:
 * My progress for master's applicants, My sessions for everyone else.
 * Course pages use it for their Back control. Safe outside ApplicantShell
 * (reads the cached overview query directly, not the shell context).
 */
export function useMyLearningPath(): string {
  const userId = useTypedSelector((state) => state.auth.profile?.id);
  const { data } = useGetApplicantOverviewQuery(userId ?? '', { skip: !userId });
  return applicantDegree(data?.profile?.targetDegree) === 'master'
    ? applicantLinks.learning
    : applicantLinks.sessions;
}
