/**
 * Decides what to show at / (home): MentorHome, redirect counselors to /school-counselor, or redirect mentees to /student-hub.
 * Used at index route when authenticated.
 *
 * Hook-order fix: We use only a fixed set of hooks (no useGetMeQuery with skip, no
 * conditional hook calls). Profile comes from Redux; MainLayout/RouterProvider fetch getMe.
 * Counselor check lives in HomeRouterContent, which mounts only after profile is ready.
 */

import { useLayoutEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useParamsHook from 'src/hooks/params';
import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import Loader from 'src/components/loader';
import { useGetMyOrganizationsQuery } from 'src/app/services/organizations';

const SUPER_ADMIN_EMAIL = 'sheraliozodov6@gmail.com';

export default function HomeRouter() {
  const navigate = useNavigate();
  const { searchParams } = useParamsHook();
  const verified = searchParams.get('verified') && !!searchParams.get('verified');

  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  // The profile is already fetched fresh by the app-bootstrap gate
  // (RouterProvider), so this just reads it from cache — no extra fetch and
  // no extra full-screen spinner.
  const { data: me } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const profile = me?.profile;
  const email = me?.email;

  useLayoutEffect(() => {
    if (verified) navigate('/auth/verification?verified=true');
  }, [verified, navigate]);

  // Safety net only — normally the bootstrap gate guarantees a profile here.
  if (!profile?.role) {
    return <Loader height="100vh" />;
  }

  return (
    <HomeRouterContent
      profile={profile}
      email={email ?? ''}
    />
  );
}

interface HomeRouterContentProps {
  profile: { role?: string };
  email: string;
}

function HomeRouterContent({ profile, email }: HomeRouterContentProps) {
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const { data: orgsData, isLoading: counselorLoading } = useGetMyOrganizationsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const isCounselor = Array.isArray(orgsData) && orgsData.length > 0;

  if (counselorLoading) {
    return <Loader height="100vh" />;
  }

  // Org staff → the console is home, whatever their personal profile role is.
  //
  // `/org/me` returns only owner/counselor memberships, so `isCounselor` means
  // "helps run an organization" — that outranks being a mentor. This previously
  // read `&& profile?.role !== 'Mentor'`, which sent any counselor/owner who
  // was also a mentor to the mentor dashboard and left them with no route to
  // their console. That is not an edge case: the invite flow puts new staff
  // through the ordinary signup, where they must pick Student or Mentor, so
  // staff carrying `role === 'Mentor'` is the norm, not the exception.
  //
  // SuperAdmin is still excluded — they reach any org via the admin console's
  // switcher and shouldn't have their own home hijacked.
  if (isCounselor && email !== SUPER_ADMIN_EMAIL) {
    return <Navigate to="/counselor-console" replace />;
  }

  if (profile?.role === 'Mentor') {
    return <Navigate to="/mentor/dashboard" replace />;
  }

  return <Navigate to="/student-hub" replace />;
}
