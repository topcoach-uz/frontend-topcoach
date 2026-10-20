import { MenuProps } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginCheck, logout } from 'src/app/slices/authSlice';
import { changeTheme } from 'src/app/slices/layoutSlice';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { LogoutIcon, UserIcon } from 'src/components/icons';
import useColors from 'src/hooks/useColors';
import styles from './actions.module.scss';
import {
  ACCOUNT_SETTINGS_PATH,
  MEMBERSHIP_BILLING_PATH,
} from 'src/lib/accountNavigation';
import { CreditCard, Settings } from 'lucide-react';
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
    (state) => state.auth.isAuthenticated,
  );
  const userData = useTypedSelector((state) => state.auth.profile);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
    // Set loading to false immediately if already authenticated, or after auth check
    if (isAuthenticated !== undefined) {
      setIsAuthLoading(false);
    } else {
      const timer = setTimeout(() => {
        setIsAuthLoading(false);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Hamburger menu
  const [isMenuOpen, setIsMenu] = useState<boolean>(false);

  const toggleMenu = () => {
    setIsMenu(!isMenuOpen);
  };

  // Edit profile modal

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  // Profile

  const role = userData?.profile?.role;
  const isMentor = role === UserRole.Mentor;
  const isStudent = role === UserRole.Student;

  const profileMenuItems: MenuProps['items'] = [
    ...(isMentor || isStudent
      ? [
          {
            // Mentors open their profile page (view) and edit from there;
            // students keep the existing settings shortcut.
            label: isMentor
              ? t('header.viewProfile')
              : t('accountNav.settings', 'Account settings'),
            key: '1',
            icon: isMentor ? (
              <UserIcon size={16} className={styles.dropdown_icon} />
            ) : (
              <Settings size={16} aria-hidden />
            ),
            onClick: () => {
              if (isStudent) {
                navigate(ACCOUNT_SETTINGS_PATH);
              } else {
                navigate('/mentor/profile');
              }
            },
          },
          ...(isStudent
            ? [
                {
                  key: 'membership',
                  label: t('accountNav.membership', 'Membership & billing'),
                  icon: <CreditCard size={16} aria-hidden />,
                  onClick: () => navigate(MEMBERSHIP_BILLING_PATH),
                },
              ]
            : []),
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

    // Auth loading state
    isAuthLoading,
  };
}
