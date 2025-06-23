import { MenuProps } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginCheck, logout } from 'src/app/slices/authSlice';
import { changeTheme } from 'src/app/slices/layoutSlice';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { EditIcon, LogoutIcon } from 'src/components/icons';
import useColors from 'src/hooks/useColors';
import styles from './actions.module.scss';
import { UserRole } from 'src/app/api/Api';
import { useTranslation } from 'react-i18next';

export default function useActions() {
  const navigate = useNavigate();
  const colors = useColors();
  const { t } = useTranslation();
  // Dark mode handling

  const isDark = useTypedSelector((state) => state.layout.darkMode);
  const dispatch = useAppDispatch();
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.isAuthenticated
  );
  const userData = useTypedSelector((state) => state.auth.profile);

  const handleDarkMode = () => {
    if (isDark) {
      dispatch(changeTheme('light'));
    } else {
      dispatch(changeTheme('dark'));
    }
  };

  useEffect(() => {
    // Check if the user is logged in
    if (!isAuthenticated) {
      dispatch(loginCheck());
    }
  }, []);

  // Hamburger menu
  const [isMenuOpen, setIsMenu] = useState<boolean>(false);

  const toggleMenu = () => {
    setIsMenu(!isMenuOpen);
  };

  // Edit profile modal

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  // Profile

  const profileMenuItems: MenuProps['items'] = [
    ...(userData?.profile?.role === UserRole.Mentor
      ? [
          {
            label: t('header.editProfile'),
            key: '1',
            icon: <EditIcon className={styles.dropdown_icon} />,
            onClick: () => {
              setIsModalVisible(true);
            },
          },
          {
            key: '3',
            type: 'divider' as const,
          },
        ]
      : []),
    {
      label: t('header.logout'),
      key: '2',
      icon: <LogoutIcon className={styles.dropdown_icon} />,
      onClick: () => {
        dispatch(logout());
      },
    },
  ];

  return {
    // Dark mode
    isDark,
    handleDarkMode,
    isAuthenticated,
    profileMenuItems,
    navigate,
    colors,

    // Hamburger menu
    isMenuOpen,
    toggleMenu,

    // Edit Profile Modal
    isModalVisible,
    setIsModalVisible,
  };
}
