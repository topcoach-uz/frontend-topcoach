import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { changeTheme, THEME_COLOR } from 'src/app/slices/layoutSlice';
import { useAppDispatch } from 'src/app/store';
import { scrollToTop } from 'src/utils';

export default function RootLayout() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();

  useEffect(() => {
    scrollToTop();
    const theme = localStorage.getItem(THEME_COLOR) ?? 'light';
    dispatch(changeTheme(theme));
  }, [pathname]);

  return (
    <>
      <Outlet />
    </>
  );
}
