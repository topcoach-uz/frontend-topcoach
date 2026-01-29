/**
 * Decides what to show at / (home): MentorHome, CounselorHome, or redirect to /student-hub.
 * Used at index route when authenticated.
 */

import { useLayoutEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useParamsHook from 'src/hooks/params';
import { useGetMeQuery } from 'src/app/services/users';
import { useCounselorStatus } from 'src/hooks/useCounselorStatus';
import { useTypedSelector } from 'src/app/store';
import { PageLoader } from 'src/components/loading';
import MentorHomePage from './mentor';
import CounselorHome from './counselor/CounselorHome';

const SUPER_ADMIN_EMAIL = 'sheraliozodov6@gmail.com';

export default function HomeRouter() {
  const navigate = useNavigate();
  const { searchParams } = useParamsHook();
  const verified = searchParams.get('verified') && !!searchParams.get('verified');
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);

  const { data: userData, isLoading: profileLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const profile = userData?.profile ?? useTypedSelector((s) => s.auth.profile?.profile);
  const email = userData?.email ?? useTypedSelector((s) => s.auth.profile?.email);

  const { isCounselor, isLoading: counselorLoading } = useCounselorStatus(
    !isAuthenticated || profileLoading || !profile?.role
  );

  useLayoutEffect(() => {
    if (verified) navigate('/auth/verification?verified=true');
  }, [verified, navigate]);

  if (profileLoading || !profile?.role) {
    return <PageLoader text="Loading..." />;
  }

  if (counselorLoading) {
    return <PageLoader text="Loading..." />;
  }

  if (isCounselor && email !== SUPER_ADMIN_EMAIL) {
    return <CounselorHome />;
  }

  if (profile?.role === 'Mentor') {
    return <MentorHomePage />;
  }

  return <Navigate to="/student-hub" replace />;
}
