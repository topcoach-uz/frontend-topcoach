import { Flex, Button, message } from 'antd';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './mentor_avatar.module.scss';
import { UserIcon } from 'src/components/icons';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { useTypedSelector } from 'src/app/store';
import { getLatestCreatedImg } from 'src/utils';
import { useTranslation } from 'react-i18next';
import { Link } from 'lucide-react';
import MentorDetailsSocials from '../socials';
import { mentorDisplay } from 'src/pages/mentors/_components/mentorCard/mentorDisplay';

interface Props {}

export default function MentorDetailsAvatar({}: Props) {
  const colors = useColors();
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();

  const mentorData = useTypedSelector((state) => state.mentor.lastMentorData);
  const language = useTypedSelector((state) => state.layout.language);

  const media = mentorData?.profile?.media;
  // @ts-ignore
  const selectedUniversities = mentorData?.selectedUniversities;
  const lastOne = selectedUniversities?.[0]?.name;
  const university = mentorData?.mentorProfile.university
    ? mentorData?.mentorProfile?.university
    : // @ts-ignore
      lastOne;

  const name = mentorData?.profile?.name;

  const img = getLatestCreatedImg(media ?? []);

  // Copy mentor profile URL functionality
  const handleCopyUrl = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      message.success('Mentor profile URL copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      message.success('Mentor profile URL copied to clipboard!');
    }
  };

  return (
    <div className={styles.mentor_profile_container}>
      <CustomText fontSize={14} mb={12}>{mentorDisplay(mentorData?.mentorProfile ?? {}, mentorData?.email).label}</CustomText>
      <Flex
        className={styles.mentor_avatar}
        vertical={screenSize < 1024}
        align="center"
        gap={16}
      >
        {!img ? (
          <UserIcon width={200} height={200} />
        ) : (
          <img
            src={img}
            alt={name ? `${name} — mentor profile` : 'mentor profile'}
            width={200}
            height={200}
            loading="eager"
            decoding="async"
            // @ts-expect-error fetchpriority is valid HTML, React types catch up later
            fetchpriority="high"
            className={styles.image_wrapper}
            style={{ flexShrink: 0, objectFit: 'cover', borderRadius: 12 }}
          />
        )}
        <div className={styles.title_wrapper}>
          <CustomText
            color={colors.colorTextBase}
            fontSize={32}
            fontWeight={themeFontWeight.fontWeightSemibold}
            lineHeight={'38px'}
            mb={4}
          >
            {name}
          </CustomText>
          <CustomText
            color={colors.colorTextSecondary}
            fontSize={themeFontSize.fontSizeTitle5}
            fontWeight={themeFontWeight.fontWeightSemibold}
          >
            {university}
          </CustomText>
        </div>
      </Flex>
      
      {/* Action Buttons - Positioned to the right of profile image */}
      <div className={styles.action_buttons_right}>
        <Button
          type="text"
          icon={<Link size={16} />}
          onClick={handleCopyUrl}
          className={styles.copy_url_button}
          style={{
            color: colors.colorPrimary,
            border: `1px solid ${colors.colorPrimary}`,
            borderRadius: '8px',
            height: '40px',
            width: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}
          title="Copy mentor profile URL"
        />
        
        <div className={styles.social_buttons_wrapper}>
          <MentorDetailsSocials />
        </div>
      </div>
    </div>
  );
}
