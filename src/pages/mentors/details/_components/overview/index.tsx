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
      <div>
        <CustomText
          fontWeight={themeFontWeight.fontWeightSemibold}
          fontSize={themeFontSize.fontSizeTitle5}
          color={colors.colorText}
          mb={8}
        >
          {t('mentors.overview')}
        </CustomText>
        <CustomText color={colors.colorTextSecondary} lineHeight={'22px'}>
          {summary}
        </CustomText>
      </div>
    )
  );
}
