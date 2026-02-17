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
import { PageLoader } from 'src/components/loading';
import MentorHomePage from './mentor';
import { useGetMyOrganizationsQuery } from 'src/app/services/organizations';

const SUPER_ADMIN_EMAIL = 'sheraliozodov6@gmail.com';

export default function HomeRouter() {
  const navigate = useNavigate();
  const { searchParams } = useParamsHook();
  const verified = searchParams.get('verified') && !!searchParams.get('verified');

  const profile = useTypedSelector((s) => s.auth.profile?.profile);
  const email = useTypedSelector((s) => s.auth.profile?.email);

  useLayoutEffect(() => {
    if (verified) navigate('/auth/verification?verified=true');
  }, [verified, navigate]);

  if (!profile?.role) {
    return <PageLoader text="Loading..." />;
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
    return <PageLoader text="Loading..." />;
  }

  // Students with counselor access → school counselor as home. Mentors with counselor access → stay on mentor home.
  if (isCounselor && email !== SUPER_ADMIN_EMAIL && profile?.role !== 'Mentor') {
    return <Navigate to="/school-counselor" replace />;
  }

  if (profile?.role === 'Mentor') {
    return <MentorHomePage />;
  }

  return <Navigate to="/student-hub" replace />;
}
