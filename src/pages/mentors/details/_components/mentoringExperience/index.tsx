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
    <div style={{ margin: '16px 0', paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
      <CustomText
        fontWeight={themeFontWeight.fontWeightSemibold}
        fontSize={themeFontSize.fontSizeTitle5}
        color={colors.colorText}
        mb={0}
        style={{ marginBottom: '10px' }}
      >
        {t('mentors.mentoringExperience') || 'Mentoring Experience'}
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
        {mentoringExperience}
      </CustomText>
    </div>
  );
}

