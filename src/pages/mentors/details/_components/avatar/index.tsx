import { Flex, Image } from 'antd';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './mentor_avatar.module.scss';
import { UserIcon } from 'src/components/icons';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { useTypedSelector } from 'src/app/store';
import { getLatestCreatedImg } from 'src/utils';
import { useTranslation } from 'react-i18next';

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

  return (
    <Flex
      className={styles.mentor_avatar}
      vertical={screenSize < 1024}
      align="center"
      gap={16}
    >
      {!img ? (
        <UserIcon width={200} height={200} />
      ) : (
        <Image
          src={img}
          rootClassName={styles.image_wrapper}
          width={200}
          height={200}
          style={{ flexShrink: '0' }}
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
          {['en', 'ru'].includes(language)
            ? t('mentors.univer') + university
            : university + t('mentors.univer')}
        </CustomText>
      </div>
    </Flex>
  );
}
