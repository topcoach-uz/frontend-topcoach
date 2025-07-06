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
      <button className={styles.mode_switch} onClick={handleDarkMode}>
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
      <LanguageSelect />
      {isAuthenticated ? (
        <ProfileDropdown profileMenuItems={profileMenuItems} />
      ) : (
        <AuthButtonGroup />
      )}
    </div>
  );
}
