import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './whyICoach.module.scss';

const MAX_PREVIEW_LENGTH = 450; // Characters to show before "Read more"

export default function MentorDetailsWhyICoach() {
  const colors = useColors();
  const [isExpanded, setIsExpanded] = useState(false);
  const whyDoICoach = useTypedSelector(
    (state) => state.mentor?.lastMentorData?.mentorProfile?.whyDoICoach
  );
  const { t } = useTranslation();

  if (!whyDoICoach) {
    return null;
  }

  const needsTruncation = whyDoICoach.length > MAX_PREVIEW_LENGTH;
  const displayText = isExpanded || !needsTruncation 
    ? whyDoICoach 
    : `${whyDoICoach.substring(0, MAX_PREVIEW_LENGTH)}...`;

  return (
    <div className={styles.section_wrapper}>
      <CustomText
        fontWeight={themeFontWeight.fontWeightSemibold}
        fontSize={themeFontSize.fontSizeTitle5}
        color={colors.colorText}
        mb={0}
        style={{ marginBottom: '10px' }}
      >
        {t('mentors.whyICoach') || 'Why do I coach?'}
      </CustomText>
      <div className={styles.content_wrapper}>
        <CustomText 
          color={colors.colorTextSecondary} 
          lineHeight={'24px'}
          className={styles.description_text}
        >
          {displayText}
        </CustomText>
        {needsTruncation && (
          <button
            className={styles.read_more_button}
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ color: colors.colorPrimary }}
          >
            {isExpanded ? t('mentors.readLess') || 'Read less' : t('mentors.readMore') || 'Read more'}
          </button>
        )}
      </div>
    </div>
  );
}

