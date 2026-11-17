import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { changeTheme, THEME_COLOR } from 'src/app/slices/layoutSlice';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { scrollToTop } from 'src/utils';
import CustomChatAgent from 'src/components/CustomChatAgent';
import ElevenLabsLoginPrompt from 'src/components/ElevenLabsLoginPrompt';
import { isApplicantWorkspacePath } from 'src/lib/applicantWorkspace';

export default function RootLayout() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    scrollToTop();
    const theme = localStorage.getItem(THEME_COLOR) ?? 'light';
    dispatch(changeTheme(theme));
  }, [pathname]);

  // Hide the AI chat FAB on admin pages, in the mentor console (the student
  // AI assistant isn't for mentors) and inside the SAT runner so it doesn't
  // overlap the test surface.
  const hideChatFab =
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/admin') ||
    pathname === '/mentor' ||
    pathname.startsWith('/mentor/') ||
    pathname === '/counselor-console' ||
    pathname.startsWith('/counselor-console/') ||
    pathname.startsWith('/student-hub/sat-prep/runner') ||
    pathname.startsWith('/student-hub/ielts-prep') ||
    isApplicantWorkspacePath(pathname);

  return (
    <>
      <Outlet />
      {isAuthenticated && !hideChatFab ? <CustomChatAgent /> : null}
      {!isAuthenticated && !hideChatFab ? <ElevenLabsLoginPrompt /> : null}
    </>
  );
}
