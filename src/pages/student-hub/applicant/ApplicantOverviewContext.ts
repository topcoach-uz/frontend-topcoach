import { createContext, useContext } from 'react';
import type { ApplicantOverview } from 'src/app/services/student-hub/applicantOverviewApi';

export type OverviewQuery = {
  currentData?: ApplicantOverview;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => unknown;
};
export const ApplicantOverviewContext = createContext<OverviewQuery | null>(
  null,
);
export function useApplicantOverview() {
  const value = useContext(ApplicantOverviewContext);
  if (!value) throw new Error('Applicant overview requires ApplicantShell');
  return value;
}
