import { ChevronDown } from 'lucide-react';
import { Avatar, Dropdown } from 'antd';
import { MenuProps } from 'antd/lib';
import { useState } from 'react';
import { MEDIA_TAGS, UserRole } from 'src/app/api/Api';
import { useTypedSelector } from 'src/app/store';
import { UserIcon } from 'src/components/icons';
import styles from './ProfileDropdown.module.scss';
import { useTranslation } from 'react-i18next';
import useOrgStaff from 'src/hooks/useOrgStaff';

interface Props {
  profileMenuItems?: MenuProps['items'];
}

export default function ProfileDropdown({ profileMenuItems }: Props) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const userData = useTypedSelector((state) => state.auth.profile);

  const profileImages = userData?.profile?.media
    .filter(
      (media) =>
        media?.tags?.includes(MEDIA_TAGS.ProfilePicture) ||
        media?.tags === null,
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const profileImage = profileImages?.[0]?.url;

  // If the media URL points at a file that no longer exists on disk
  // (stale DB rows, host-volume drift) the request 404s. Fall back to
  // the placeholder avatar instead of leaving a broken-image circle.
  const [imageBroken, setImageBroken] = useState(false);
  const showImage = !!profileImage && !imageBroken;

  const role = userData?.profile?.role;

  // Invited org staff may carry NEITHER Mentor nor Student as their profile
  // role, which left them with no avatar menu and therefore no way to log out.
  const { isOrgStaff } = useOrgStaff();

  return (
    <div>
      {role === UserRole.Mentor || role === UserRole.Student || isOrgStaff ? (
        <Dropdown
          menu={{ items: profileMenuItems }}
          trigger={['click']}
          open={menuOpen}
          onOpenChange={setMenuOpen}
        >
          <button
            type="button"
            className={styles.trigger}
            aria-label={t('accountNav.menu', 'Open account menu')}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className={styles.avatar_wrapper}>
              {showImage ? (
                <img
                  src={profileImage}
                  alt=""
                  onError={() => setImageBroken(true)}
                />
              ) : (
                <Avatar
                  size="large"
                  className={styles.avatar}
                  icon={<UserIcon />}
                />
              )}
            </div>
            <ChevronDown size={14} style={{ color: 'white' }} />
          </button>
        </Dropdown>
      ) : (
        <></>
      )}
    </div>
  );
}
