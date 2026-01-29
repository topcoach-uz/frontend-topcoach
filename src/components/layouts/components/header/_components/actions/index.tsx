import { MoonIcon, SunIcon } from 'src/components/icons';
import LanguageSelect from 'src/components/language_select/index.tsx';
import { useScreenSize } from 'src/hooks/useScreenSize.ts';
import AuthButtonGroup from './_components/AuthButtonGroup/index.tsx';
import EditProfileModal from './_components/EditProfileModal/index.tsx';
import ProfileDropdown from './_components/ProfileDropdown/index.tsx';
import FontAwesomeIcon from 'src/components/common/icons/FontAwesomeIcon';
import { AI_MAJOR_MATCH_ICONS } from 'src/constants/icons';
import { AiSearchStarsSvg } from 'src/assets/svg';
import styles from './actions.module.scss';
import ActionsMobileVersion from './mobile/index.tsx';
import useActions from './useActions.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MailOutlined } from '@ant-design/icons';
import ChatIcon from 'src/components/chat/ChatIcon';

export default function Actions() {
  const {
    handleDarkMode,
    isDark,
    isAuthenticated,
    profileMenuItems,

    // Hamburger menu
    isMenuOpen,
    toggleMenu,

    // Edit profile modal
    isModalVisible,
    setIsModalVisible,
    
    // Auth loading state
    isAuthLoading,
  } = useActions();
  const { screenSize } = useScreenSize();
  const { i18n } = useTranslation();

  const isMobileVersion =
    i18n.language === 'en' ? screenSize < 1200 : screenSize < 1400;

  useEffect(() => {
    const handler = () => setIsModalVisible(true);
    window.addEventListener('openEditProfileModal', handler);
    return () => window.removeEventListener('openEditProfileModal', handler);
  }, [setIsModalVisible]);

  // Mobile version
  if (isMobileVersion) {
    return (
      <>
        <EditProfileModal
          isModalVisible={isModalVisible}
          setIsModalVisible={setIsModalVisible}
        />
        <ActionsMobileVersion
          handleDarkMode={handleDarkMode}
          isOpen={isMenuOpen}
          profileMenuItems={profileMenuItems}
          toggleMenu={toggleMenu}
          isAuthLoading={isAuthLoading}
        />
      </>
    );
  }

  return (
    <div className={styles.actions_wrapper}>
      <EditProfileModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
      />
      
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
      <Link to="/contact" className={styles.contactIcon}>
        <MailOutlined style={{ fontSize: '20px', color: 'white' }} />
      </Link>
      {isAuthenticated && <ChatIcon />}
      <LanguageSelect />
      <div className={styles.authContainer}>
        {!isAuthLoading && (
          <>
            {isAuthenticated ? (
              <ProfileDropdown profileMenuItems={profileMenuItems} />
            ) : (
              <AuthButtonGroup />
            )}
          </>
        )}
      </div>
    </div>
  );
}
