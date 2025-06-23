import { Drawer, Flex } from 'antd';
import { logout } from 'src/app/slices/authSlice';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { CustomButton } from 'src/components/common';
import { LogoutIcon } from 'src/components/icons';
import LanguageSelect from 'src/components/language_select';
import AuthButtonGroup from '../actions/_components/AuthButtonGroup';
import Navigation from '../navigation';
import styles from './hamburgerMenu.module.scss'; // Import CSS Module
import { useTranslation } from 'react-i18next';

const HamburgerMenu: React.FC<{ isOpen: boolean; toggleMenu: () => void }> = ({
  isOpen,
  toggleMenu,
}) => {
  const dispatch = useAppDispatch();
  const handleLogout = () => {
    dispatch(logout());
  };
  const { t } = useTranslation();
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.isAuthenticated
  );

  return (
    <>
      <button
        className={styles.hamburger}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <div className={`${styles.bar} ${isOpen ? styles.topOpen : ''}`}></div>
        <div
          className={`${styles.bar} ${isOpen ? styles.middleOpen : ''}`}
        ></div>
        <div
          className={`${styles.bar} ${isOpen ? styles.bottomOpen : ''}`}
        ></div>
      </button>
      <Drawer
        destroyOnClose
        open={isOpen}
        onClose={toggleMenu}
        rootClassName={styles.drawer}
        title={
          !isAuthenticated && (
            <Flex gap={10} justify="end">
              <AuthButtonGroup />
            </Flex>
          )
        }
      >
        <Flex vertical gap={20}>
          <Navigation direction="vertical" />
          <LanguageSelect />
        </Flex>
        {isAuthenticated && (
          <CustomButton
            icon={<LogoutIcon className={styles.logout_icon} />}
            type="text"
            className={styles.logout_button}
            onClick={handleLogout}
          >
            {t('header.logout')}
          </CustomButton>
        )}
      </Drawer>
    </>
  );
};

export default HamburgerMenu;
