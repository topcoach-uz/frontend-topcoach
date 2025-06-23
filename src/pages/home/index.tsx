import { useTypedSelector } from 'src/app/store';
import MenteeHomePage from './mentee';
import MentorHomePage from './mentor';
import Loader from 'src/components/loader';
import { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useParamsHook from 'src/hooks/params';
import { UserRole } from 'src/app/api/Api';

export default function HomePage() {
  const profile = useTypedSelector((state) => state.auth.profile?.profile);

  const { searchParams } = useParamsHook();

  const verified =
    searchParams.get('verified') && !!searchParams.get('verified');

  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (verified) {
      navigate('/auth/verification?verified=true');
    }
  }, []);

  if (!profile?.role) {
    return <Loader />;
  }

  return (
    <div>
      {profile?.role == UserRole.Mentor ? (
        <MentorHomePage />
      ) : (
        <MenteeHomePage />
      )}
    </div>
  );
}
