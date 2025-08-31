import { MoonIcon, SunIcon } from 'src/components/icons';
import LanguageSelect from 'src/components/language_select/index.tsx';
import { useScreenSize } from 'src/hooks/useScreenSize.ts';
import AuthButtonGroup from './_components/AuthButtonGroup/index.tsx';
import EditProfileModal from './_components/EditProfileModal/index.tsx';
import ProfileDropdown from './_components/ProfileDropdown/index.tsx';
import styles from './actions.module.scss';
import ActionsMobileVersion from './mobile/index.tsx';
import useActions from './useActions.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

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
      
      {/* AI Major Match Button */}
      <Link to="/ai-major-match" className={styles.aiMajorMatchButton}>
        <div className={styles.aiIconWrapper}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className={styles.aiIcon}>
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
