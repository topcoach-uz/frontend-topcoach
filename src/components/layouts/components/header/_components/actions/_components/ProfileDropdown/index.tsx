import { DownOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Flex } from 'antd';
import { MenuProps } from 'antd/lib';
import { MEDIA_TAGS, UserRole } from 'src/app/api/Api';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { LogoutIcon, UserIcon } from 'src/components/icons';
import useColors from 'src/hooks/useColors';
import styles from './ProfileDropdown.module.scss';
import { CustomButton } from 'src/components/common';
import { t, use } from 'i18next';
import { logout } from 'src/app/slices/authSlice';
import { themeColors } from 'src/constants/theme';

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

  const role = userData?.profile?.role;

  return (
    <div>
      {role === UserRole.Mentor ? (
        <Dropdown menu={{ items: profileMenuItems }} trigger={['click']}>
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
            {/* <DownOutlined style={{ color: colors.colorTextBase, fontSize: 14 }} /> */}
            <DownOutlined style={{ color: 'white', fontSize: 14 }} />
          </Flex>
        </Dropdown>
      ) : role === UserRole.Student ? (
        <CustomButton
          icon={<LogoutIcon className={styles.logout_icon} />}
          type="text"
          className={styles.logout_button}
          onClick={handleLogout}
        >
          {t('header.logout')}
        </CustomButton>
      ) : (
        <></>
      )}
    </div>
  );
}
