import { MenuProps } from 'antd/lib';
import { useTypedSelector } from 'src/app/store';
import { MoonIcon, SunIcon } from 'src/components/icons';
import LanguageSelect from 'src/components/language_select';
import { useScreenSize } from 'src/hooks/useScreenSize';
import HamburgerMenu from '../../hamburger';
import ProfileDropdown from '../_components/ProfileDropdown';
import FontAwesomeIcon from 'src/components/common/icons/FontAwesomeIcon';
import { AI_MAJOR_MATCH_ICONS } from 'src/constants/icons';
import { AiSearchStarsSvg } from 'src/assets/svg';
import styles from '../actions.module.scss';
import { Link } from 'react-router-dom';
import { MailOutlined } from '@ant-design/icons';
import ChatIcon from 'src/components/chat/ChatIcon';

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
  const isDark = useTypedSelector((state) => state.layout.darkMode);
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.isAuthenticated
  );

  return (
    <div className={styles.actions_wrapper}>
      {/* AI Major Match Button - Commented out
      <Link to="/ai-major-match" className={styles.aiMajorMatchButton}>
        <div className={styles.aiIconWrapper}>
          <AiSearchStarsSvg 
            className={styles.aiIcon}
            style={{ width: '20px', height: '20px', fill: 'white' }}
          />
        </div>
        Major Match
      </Link>
      */}

      {/* Dark mode toggle disabled
      <button className={styles.mode_switch} onClick={handleDarkMode}>
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
      */}
      {screenSize > 560 && (
        <>
          <Link to="/contact" className={styles.contactIcon}>
            <MailOutlined style={{ fontSize: '20px', color: 'white' }} />
          </Link>
          {!isAuthLoading && isAuthenticated && <ChatIcon />}
          <LanguageSelect />
        </>
      )}
      {isAuthenticated ? (
        <ProfileDropdown profileMenuItems={profileMenuItems} />
      ) : (
        <></>
      )}
      <HamburgerMenu isOpen={isOpen} toggleMenu={toggleMenu} />
    </div>
  );
}
