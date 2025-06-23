import { Outlet } from 'react-router-dom';
import { useGetMeQuery } from 'src/app/services/users';
import { useTypedSelector } from 'src/app/store';
import Footer from '../components/footer';
import Header from '../components/header';
import styles from './main.module.scss';
// Initialize global dayjs configuration
import 'src/lib/dayjs';

function Main() {
  // Scroll to top when route changes
  const state = useTypedSelector((state) => state);
  useGetMeQuery(undefined, {
    skip: !!state.auth.profile?.id || !state.auth.isAuthenticated,
  });

  console.log(state);

  return (
    <div className={styles.main}>
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

export default Main;
