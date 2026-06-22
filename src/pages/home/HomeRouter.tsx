/**
 * Decides what to show at / (home): MentorHome, redirect counselors to /school-counselor, or redirect mentees to /student-hub.
 * Used at index route when authenticated.
 *
 * Hook-order fix: all hooks are called unconditionally at the top (no
 * useGetMeQuery-with-skip toggling, no conditional hook calls). Profile comes
 * from Redux; MainLayout/RouterProvider fetch getMe. The counselor check
 * (getMyOrganizations) runs in parallel with the profile load so we render a
 * single loader and redirect once — instead of "profile loader → orgs loader
 * → redirect".
 */

import { useLayoutEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useParamsHook from 'src/hooks/params';
import { useTypedSelector } from 'src/app/store';
import { PageLoader } from 'src/components/loading';
import { useGetMyOrganizationsQuery } from 'src/app/services/organizations';

const SUPER_ADMIN_EMAIL = 'sheraliozodov6@gmail.com';

export default function HomeRouter() {
  const navigate = useNavigate();
  const { searchParams } = useParamsHook();
  const verified = searchParams.get('verified') && !!searchParams.get('verified');

  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const profile = useTypedSelector((s) => s.auth.profile?.profile);
  const email = useTypedSelector((s) => s.auth.profile?.email);

  // Counselor check runs in parallel with the profile load (not gated behind
  // profile.role), so both resolve under one loader instead of two sequential
  // ones. RTK Query caches the result, so StudentHubGate's later read is free.
  const { data: orgsData, isLoading: counselorLoading } = useGetMyOrganizationsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const isCounselor = Array.isArray(orgsData) && orgsData.length > 0;

  useLayoutEffect(() => {
    if (verified) navigate('/auth/verification?verified=true');
  }, [verified, navigate]);

  // Single loader until both the role and the counselor check are known.
  if (!profile?.role || counselorLoading) {
    return <PageLoader text="Loading..." />;
  }

  // Students with counselor access → school counselor as home. Mentors with counselor access → stay on mentor home.
  if (isCounselor && email !== SUPER_ADMIN_EMAIL && profile.role !== 'Mentor') {
    return <Navigate to="/school-counselor" replace />;
  }

  if (profile.role === 'Mentor') {
    return <Navigate to="/mentor/dashboard" replace />;
  }

  return <Navigate to="/student-hub" replace />;
}
