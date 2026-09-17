import { Navigate, Outlet } from 'react-router-dom';
import Loader from 'src/components/loader';
import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import { isOnboardingComplete, OnboardingStatus, usesJuniorCommunity } from 'src/lib/onboarding';
import { useGetMyStudentProfileQuery } from 'src/app/services/student-hub/studentProfileApi';

/**
 * Centralized post-login onboarding gate (see ONBOARDING_DESIGN.md §5).
 *
 * `HomeRouterContent` only decides what to render at exactly `/` — a direct
 * deep link to /student-hub, /mentor or /school-counselor bypasses it
 * entirely. Rather than pasting the same onboarding check into each of
 * those gates, this one component is mounted as a layout route wrapping
 * all of them (see src/lib/router/index.tsx), so there is a single place
 * that decides whether a signed-in user still needs to see /onboarding.
 *
 * Must NOT wrap /onboarding itself (self-redirect loop) or any /auth/*
 * route (would block sign-in/sign-up/verification).
 *
 * Fails open: `isOnboardingComplete` treats a missing `onboardingCompletedAt`
 * field (today's `getMe` shape) as already-complete, so this never
 * redirects anyone until the backend companion PR ships that field.
 */
export default function OnboardingGate() {
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const storeProfile = useTypedSelector((s) => s.auth.profile);
  const { data: userData, isLoading: profileLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const currentUser = userData || storeProfile;
  const incomplete = !isOnboardingComplete(currentUser as OnboardingStatus | undefined);
  const { data: studentProfile, isLoading: studentLoading } = useGetMyStudentProfileQuery(undefined, {
    skip: !isAuthenticated || !incomplete || currentUser?.profile?.role === 'Mentor',
  });

  if (!isAuthenticated) {
    return <Outlet />;
  }

  // Don't redirect while getMe is still in flight — mirrors the loading
  // guard in StudentHubGate/MentorConsoleGate. Usually cache-warm already
  // (RouterProvider fetches getMe at bootstrap), so this rarely renders.
  if (profileLoading && !currentUser?.id) {
    return <Loader height="100vh" />;
  }

  // `onboardingCompletedAt` isn't on the generated UsersSchema yet (backend
  // companion PR ships after the client was regenerated) — cast through the
  // OnboardingStatus shape, same as the wizard shell does.
  if (incomplete && studentLoading) return <Loader height="100vh" />;
  if (incomplete && !usesJuniorCommunity(studentProfile?.academicProfile)) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
