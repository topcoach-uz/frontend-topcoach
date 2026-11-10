import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { isApplicantWorkspacePath } from 'src/lib/applicantWorkspace';
import ApplicantShell from 'src/pages/student-hub/applicant/ApplicantShell';
import './StudentHubLayout.scss';

/** Specialist prep pages own their chrome; every other hub page uses ApplicantShell. */
export default function StudentHubLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return isApplicantWorkspacePath(pathname)
    ? <ApplicantShell>{children}</ApplicantShell>
    : <>{children}</>;
}
