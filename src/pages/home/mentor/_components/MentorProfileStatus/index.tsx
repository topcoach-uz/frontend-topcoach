import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { ClockIcon, CloseIcon } from 'src/components/icons';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './MentorProfileStatus.module.scss';
import { useTranslation } from 'react-i18next';

export default function MentorProfileStatus() {
  const colors = useColors();
  const userData = useTypedSelector((state) => state.auth.profile);
  const { t } = useTranslation();

  return (
    <>
      {userData?.mentorProfile?.status === 'pending' ? (
        <div>
          <div className={styles.clock_icon_wrapper}>
            <ClockIcon />
          </div>
          <CustomText
            fontSize={themeFontSize.fontSizeTitle5}
            fontWeight={themeFontWeight.fontWeightSemibold}
            color={colors.colorTextBase}
            mb={4}
            lineHeight="24px"
          >
            {t('homeMentor.underReview')}
          </CustomText>
          <CustomText
            fontSize={themeFontSize.fontSizeTitle8}
            color={colors.colorTextSecondary}
            lineHeight="19px"
          >
            {t('homeMentor.underReviewDescription')}
          </CustomText>
        </div>
      ) : userData?.mentorProfile?.status === 'rejected' ? (
        <div>
          <div className={styles.clock_icon_wrapper}>
            <CloseIcon />
          </div>
          <CustomText
            fontSize={themeFontSize.fontSizeTitle5}
            fontWeight={themeFontWeight.fontWeightSemibold}
            color={colors.colorTextBase}
            mb={4}
            lineHeight="24px"
          >
            {t('homeMentor.rejected')}
          </CustomText>
          <CustomText
            fontSize={themeFontSize.fontSizeTitle8}
            color={colors.colorTextSecondary}
            lineHeight="19px"
          >
            {t('homeMentor.rejectedDescription')}
          </CustomText>
        </div>
      ) : (
        ''
      )}
    </>
  );
}
