import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';

interface MentorDetailsOverviewProps {
  overview?: string;
}

export default function MentorDetailsOverview({
  overview,
}: MentorDetailsOverviewProps) {
  const colors = useColors();
  const summary = useTypedSelector(
    (state) => state.mentor?.lastMentorData?.mentorProfile?.summary
  );
  const { t } = useTranslation();

  return (
    summary && (
      <div style={{ margin: '24px 0' }}>
        <CustomText
          fontWeight={themeFontWeight.fontWeightSemibold}
          fontSize={themeFontSize.fontSizeTitle5}
          color={colors.colorText}
          mb={16}
        >
          {t('mentors.overview')}
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
          {summary && summary.length > 1900 
            ? `${summary.substring(0, 1900)}...` 
            : summary}
        </CustomText>
      </div>
    )
  );
}
