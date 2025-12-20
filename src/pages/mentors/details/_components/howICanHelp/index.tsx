import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';

export default function MentorDetailsHowICanHelp() {
  const colors = useColors();
  const mentorshipValue = useTypedSelector(
    (state) => state.mentor?.lastMentorData?.mentorProfile?.mentorshipValue
  );
  const { t } = useTranslation();

  if (!mentorshipValue) {
    return null;
  }

  return (
    <div style={{ margin: '24px 0' }}>
      <CustomText
        fontWeight={themeFontWeight.fontWeightSemibold}
        fontSize={themeFontSize.fontSizeTitle5}
        color={colors.colorText}
        mb={16}
      >
        {t('mentors.howICanHelp') || 'How I Can Help'}
      </CustomText>
      <CustomText 
        color={colors.colorTextSecondary} 
        lineHeight={'25px'}
        style={{ 
          marginBottom: '16px',
          textAlign: 'left',
          maxWidth: '800px'
        }}
      >
        {mentorshipValue}
      </CustomText>
    </div>
  );
}

