import { MenuProps } from 'antd/lib';
import { useTypedSelector } from 'src/app/store';
import { UserRole } from 'src/app/api/Api';
import { MoonIcon, SunIcon } from 'src/components/icons';
import LanguageSelect from 'src/components/language_select';
import { useScreenSize } from 'src/hooks/useScreenSize';
import HamburgerMenu from '../../hamburger';
import ProfileDropdown from '../_components/ProfileDropdown';
import styles from '../actions.module.scss';
import { Link, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import ChatIcon from 'src/components/chat/ChatIcon';
import NotificationBell from 'src/components/notifications/NotificationBell';

interface Props {
  handleDarkMode: () => void;
  profileMenuItems: MenuProps['items'];
  isOpen: boolean;
  toggleMenu: () => void;
  isAuthLoading?: boolean;
}

export default function ActionsMobileVersion({
  handleDarkMode,
  profileMenuItems,
  isOpen,
  toggleMenu,
  isAuthLoading,
}: Props) {
  const { screenSize } = useScreenSize();
  const { pathname } = useLocation();
  const isMentorPage = pathname === '/mentor' || pathname.startsWith('/mentor/');
  const isDark = useTypedSelector((state) => state.layout.darkMode);
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.isAuthenticated
  );
  const isMentor = useTypedSelector(
    (state) => state.auth.profile?.profile?.role === UserRole.Mentor
  );

  return (
    <div className={styles.actions_wrapper}>
      {/* Dark mode toggle disabled
      <button className={styles.mode_switch} onClick={handleDarkMode}>
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
      */}
      {screenSize > 560 && (
        <>
          {!isMentor && (
            <Link to="/contact" className={styles.contactIcon}>
              <Mail size={20} color="white" />
            </Link>
          )}
          <LanguageSelect />
        </>
      )}
      {screenSize > 360 && <ChatIcon />}
      {isAuthenticated && <NotificationBell />}
      {isAuthenticated ? (
        <ProfileDropdown profileMenuItems={profileMenuItems} />
      ) : (
        <></>
      )}
      {!isMentorPage && <HamburgerMenu isOpen={isOpen} toggleMenu={toggleMenu} />}
    </div>
  );
}
