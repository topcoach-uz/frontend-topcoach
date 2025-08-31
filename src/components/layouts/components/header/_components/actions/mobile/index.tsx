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
        <div className={styles.aiIconWrapper}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={styles.aiIcon}>
            <defs>
              <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f0f0f0" />
              </linearGradient>
            </defs>
            {/* Diamond shape */}
            <path 
              d="M12 2L22 12L12 22L2 12L12 2Z" 
              fill="url(#aiGradient)" 
              stroke="#ffffff" 
              strokeWidth="1"
            />
            {/* AI text */}
            <text x="12" y="15" textAnchor="middle" fill="#333333" fontSize="10" fontWeight="bold">
              AI
            </text>
          </svg>
        </div>
        Major Match
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
