import { MenuProps } from 'antd/lib';
import { useTypedSelector } from 'src/app/store';
import { MoonIcon, SunIcon } from 'src/components/icons';
import LanguageSelect from 'src/components/language_select';
import { useScreenSize } from 'src/hooks/useScreenSize';
import HamburgerMenu from '../../hamburger';
import ProfileDropdown from '../_components/ProfileDropdown';
import styles from '../actions.module.scss';

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
      <button className={styles.mode_switch} onClick={handleDarkMode}>
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
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
