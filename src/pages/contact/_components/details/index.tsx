import { Button, Flex } from 'antd';
import { CustomButton, CustomText } from 'src/components/common';
import {
  MailIcon,
  PhoneIcon,
  SocialsFaceBook,
  SocialsInstagram,
  SocialsLinkedin,
  SocialsTelegram,
  SocialsYoutube,
} from 'src/components/icons';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './contactDetails.module.scss';
import { useTranslation } from 'react-i18next';
import { YouTubeSvg } from 'src/assets/svg';

export default function ContactDetails() {
  const colors = useColors();
  const { t } = useTranslation();

  const links = [
    {
      icon: <SocialsTelegram color={colors.colorPrimary} />,
      link: 'https://t.me/Top100_Uni',
    },
    {
      icon: (
        <SocialsYoutube fill={colors.colorPrimary} width={24} height={24} />
      ),
      link: 'https://youtube.com/@top100uni?si=VcJXZa3zWttqsZUo',
    },
    {
      icon: <SocialsLinkedin color={colors.colorPrimary} />,
      link: 'https://www.linkedin.com/company/top100uni-project/',
    },
    {
      icon: (
        <SocialsInstagram
          color={colors.colorTextLight}
          fill={colors.colorPrimary}
          width={24}
          height={24}
        />
      ),
      link: 'https://www.instagram.com/top100.uni?igsh=MXdkMm9tMjRvZW1jNw==',
    },
  ];

  return (
    <div>
      <CustomText
        fontSize={themeFontSize.fontSizeTitle5}
        fontWeight={themeFontWeight.fontWeightSemibold}
        color={colors.colorTextBase}
        mb={4}
      >
        {t('contact.title')}
      </CustomText>
      <CustomText
        fontSize={themeFontSize.fontSizeTitle8}
        color={colors.colorTextTertiary}
        lineHeight={1.4}
        mb={16}
      >
        {t('contact.description')}
      </CustomText>
      <Flex style={{ padding: 24 }} vertical align="start" gap={24}>
        <CustomButton
          type="link"
          // href="tel:+998998427979"
          className={styles.phone}
          icon={<PhoneIcon color={colors.colorPrimary} />}
          p={0}
        >
          +998 71 209 01 04
        </CustomButton>
        <CustomButton
          type="link"
          href="mailto:support@topcoach.uz"
          className={styles.phone}
          icon={<MailIcon color={colors.colorPrimary} />}
          p={0}
        >
          support@topcoach.uz
        </CustomButton>
        <Flex gap={24}>
          {links.map(({ icon, link }, i) => (
            <Button
              className={styles.socialsLink}
              key={i}
              type="link"
              icon={icon}
              href={link}
            />
          ))}
        </Flex>
      </Flex>
    </div>
  );
}
