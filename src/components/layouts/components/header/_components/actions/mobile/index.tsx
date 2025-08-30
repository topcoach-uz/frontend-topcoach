import { MenuProps } from 'antd/lib';
import { useTypedSelector } from 'src/app/store';
import { MoonIcon, SunIcon } from 'src/components/icons';
import LanguageSelect from 'src/components/language_select';
import { useScreenSize } from 'src/hooks/useScreenSize';
import HamburgerMenu from '../../hamburger';
import ProfileDropdown from '../_components/ProfileDropdown';
import styles from '../actions.module.scss';
import { Link } from 'react-router-dom';

interface Props {
  handleDarkMode: () => void;
  profileMenuItems: MenuProps['items'];
  isOpen: boolean;
  toggleMenu: () => void;
}

export default function ActionsMobileVersion({
  handleDarkMode,
  profileMenuItems,
  isOpen,
  toggleMenu,
}: Props) {
  const { screenSize } = useScreenSize();
  const isDark = useTypedSelector((state) => state.layout.darkMode);
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.isAuthenticated
  );

  return (
    <div className={styles.actions_wrapper}>
      {/* AI Major Match Button */}
      <Link to="/ai-major-match" className={styles.aiMajorMatchButton}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={styles.aiIcon}>
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        AI
      </Link>

      {/* Dark mode toggle disabled
      <button className={styles.mode_switch} onClick={handleDarkMode}>
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
      */}
      {screenSize > 560 && <LanguageSelect />}
      {isAuthenticated ? (
        <ProfileDropdown profileMenuItems={profileMenuItems} />
      ) : (
        <></>
      )}
      <HamburgerMenu isOpen={isOpen} toggleMenu={toggleMenu} />
    </div>
  );
}
