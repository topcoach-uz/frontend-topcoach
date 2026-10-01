import { Outlet, useLocation } from 'react-router-dom';
import { useGetMentorsQuery } from 'src/app/services/mentors';
import Footer from '../components/footer';
import Header from '../components/header';
import MentorPrefetch from 'src/components/MentorPrefetch';
import UniversityPrefetch from 'src/components/UniversityPrefetch';
import styles from './main.module.scss';
// Initialize global dayjs configuration
import 'src/lib/dayjs';

function Main() {
  const { pathname } = useLocation();
  // NOTE: the signed-in profile (getMe) is fetched ONCE at the app root
  // (RouterProvider) behind a single bootstrap loader, so this layout no
  // longer fetches it — that previously caused a second stacked spinner.

  // Prefetch mentor data for instant loading on mentors page
  useGetMentorsQuery(undefined, {
    // Prefetch in background, don't block UI
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  if (/^\/onboarding\/?$/.test(pathname)) return <Outlet />;
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
