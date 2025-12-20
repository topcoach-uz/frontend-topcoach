import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';

export default function MentorDetailsMentoringExperience() {
  const colors = useColors();
  const mentoringExperience = useTypedSelector(
    (state) => state.mentor?.lastMentorData?.mentorProfile?.mentoringExperience
  );
  const { t } = useTranslation();

  if (!mentoringExperience) {
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
        {t('mentors.mentoringExperience') || 'Mentoring Experience'}
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
        {mentoringExperience}
      </CustomText>
    </div>
  );
}

