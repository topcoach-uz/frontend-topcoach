import { DownOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Flex } from 'antd';
import { MenuProps } from 'antd/lib';
import { MEDIA_TAGS, UserRole } from 'src/app/api/Api';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { LogoutIcon, UserIcon, EditIcon } from 'src/components/icons';
import useColors from 'src/hooks/useColors';
import styles from './ProfileDropdown.module.scss';
import { CustomButton } from 'src/components/common';
import { t, use } from 'i18next';
import { logout } from 'src/app/slices/authSlice';
import { themeColors } from 'src/constants/theme';
import EditProfileModal from '../EditProfileModal';
import { useState, useEffect } from 'react';

interface Props {
  profileMenuItems?: MenuProps['items'];
}

export default function ProfileDropdown({ profileMenuItems }: Props) {
  const userData = useTypedSelector((state) => state.auth.profile);
  const dispatch = useAppDispatch();

  const profileImages = userData?.profile?.media
    .filter(
      (media) =>
        media?.tags?.includes(MEDIA_TAGS.ProfilePicture) || media?.tags === null
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const profileImage = profileImages?.[0]?.url;

  const handleLogout = () => {
    dispatch(logout());
  };

  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleEditProfile = () => setIsModalVisible(true);

  const role = userData?.profile?.role;

  const menuItems = [
    {
      key: 'edit-profile',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <EditIcon style={{ fontSize: 16 }} />
          {t('header.editProfile')}
        </span>
      ),
      onClick: handleEditProfile,
    },
    {
      key: 'logout',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoutIcon className={styles.logout_icon} style={{ fontSize: 16 }} />
          {t('header.logout')}
        </span>
      ),
      onClick: handleLogout,
    },
  ];

  useEffect(() => {
    // TODO: Remove type assertion once API types are regenerated with phone_number_missing field
    if (
      (userData?.phoneNumber === '' || (userData as any)?.phone_number_missing) &&
      (role === UserRole.Mentor || role === UserRole.Student)
    ) {
      setIsModalVisible(true);
    }
  }, [userData?.phoneNumber, (userData as any)?.phone_number_missing, role]);

  // Prevent closing modal if phone number is missing
  const canCloseModal =
    userData?.phoneNumber &&
    userData?.phoneNumber !== '' &&
    !(userData as any)?.phone_number_missing;

  return (
    <div>
      {(role === UserRole.Mentor || role === UserRole.Student) ? (
        <>
          <Dropdown menu={{ items: role === UserRole.Mentor ? profileMenuItems : menuItems }} trigger={['click']}>
            <Flex style={{ cursor: 'pointer' }} gap={4}>
              <div className={styles.avatar_wrapper}>
                {profileImage ? (
                  <img src={profileImage} alt="Img error" />
                ) : (
                  <Avatar
                    size="large"
                    className={styles.avatar}
                    icon={<UserIcon />}
                  />
                )}
              </div>
              <DownOutlined style={{ color: 'white', fontSize: 14 }} />
            </Flex>
          </Dropdown>
          <EditProfileModal
            isModalVisible={isModalVisible}
            setIsModalVisible={canCloseModal ? setIsModalVisible : () => {}}
            role={role}
          />
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
