import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { changeTheme, THEME_COLOR } from 'src/app/slices/layoutSlice';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { scrollToTop } from 'src/utils';
import CustomChatAgent from 'src/components/CustomChatAgent';
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

  // Hide the AI chat FAB on admin pages and inside the SAT runner so it
  // doesn't overlap the test surface.
  const hideChatFab =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/student-hub/sat-prep/runner');

  return (
    <>
      <Outlet />
      {isAuthenticated && !hideChatFab ? <CustomChatAgent /> : null}
      {!isAuthenticated ? <ElevenLabsLoginPrompt /> : null}
    </>
  );
}
