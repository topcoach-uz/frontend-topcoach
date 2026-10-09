import { Navigate } from 'react-router-dom';
import { UserRole } from 'src/app/api/Api';
import { useTypedSelector } from 'src/app/store';
import { useGetMyStudentProfileQuery } from 'src/app/services/student-hub/studentProfileApi';
import Loader from 'src/components/loader';
import { usesJuniorCommunity } from 'src/lib/onboarding';
import OnboardingPreview from 'src/pages/onboarding-preview/OnboardingPreview';

/** The server-backed onboarding flow is the default for every account version. */
export default function OnboardingWizardPage() {
  const profile = useTypedSelector((state) => state.auth.profile);
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const { data: studentProfile, isLoading } = useGetMyStudentProfileQuery(undefined, {
    skip: !isAuthenticated || profile?.profile?.role === UserRole.Mentor,
  });

  if (isLoading) return <Loader height="100vh" />;
  if (usesJuniorCommunity(studentProfile?.academicProfile)) {
    return <Navigate to="/student-hub?section=feed" replace />;
  }
  return <OnboardingPreview mode="production" />;
}
