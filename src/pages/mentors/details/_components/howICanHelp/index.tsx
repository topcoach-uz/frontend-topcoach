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
    <div style={{ margin: '16px 0', paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
      <CustomText
        fontWeight={themeFontWeight.fontWeightSemibold}
        fontSize={themeFontSize.fontSizeTitle5}
        color={colors.colorText}
        mb={0}
        style={{ marginBottom: '10px' }}
      >
        {t('mentors.howICanHelp') || 'How I Can Help'}
      </CustomText>
      <CustomText 
        color={colors.colorTextSecondary} 
        lineHeight={'24px'}
        style={{ 
          marginBottom: 0,
          textAlign: 'left',
          maxWidth: '800px'
        }}
      >
        {mentorshipValue}
      </CustomText>
    </div>
  );
}

