import { Outlet } from 'react-router-dom';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetMentorsQuery } from 'src/app/services/mentors';
import { useTypedSelector } from 'src/app/store';
import Footer from '../components/footer';
import Header from '../components/header';
import MentorPrefetch from 'src/components/MentorPrefetch';
import UniversityPrefetch from 'src/components/UniversityPrefetch';
import styles from './main.module.scss';
// Initialize global dayjs configuration
import 'src/lib/dayjs';

function Main() {
  // Scroll to top when route changes
  const state = useTypedSelector((state) => state);
  useGetMeQuery(undefined, {
    skip: !!state.auth.profile?.id || !state.auth.isAuthenticated,
  });

  // Prefetch mentor data for instant loading on mentors page
  useGetMentorsQuery(undefined, {
    // Prefetch in background, don't block UI
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  console.log(state);

  return (
    <div className={styles.main}>
      <Header />
      <MentorPrefetch />
      <UniversityPrefetch />
      <Outlet />
      <Footer />
    </div>
  );
}

export default Main;
