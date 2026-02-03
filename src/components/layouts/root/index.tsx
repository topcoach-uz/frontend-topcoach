import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { changeTheme, THEME_COLOR } from 'src/app/slices/layoutSlice';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { scrollToTop } from 'src/utils';
import ElevenLabsWidget from 'src/components/ElevenLabsWidget';
import ElevenLabsLoginPrompt from 'src/components/ElevenLabsLoginPrompt';

export default function RootLayout() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    scrollToTop();
    const theme = localStorage.getItem(THEME_COLOR) ?? 'light';
    dispatch(changeTheme(theme));
  }, [pathname]);

  return (
    <>
      <Outlet />
      {isAuthenticated ? <ElevenLabsWidget /> : <ElevenLabsLoginPrompt />}
    </>
  );
}
