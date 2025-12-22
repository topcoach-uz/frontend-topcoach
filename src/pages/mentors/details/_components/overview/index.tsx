import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './overview.module.scss';

interface MentorDetailsOverviewProps {
  overview?: string;
}

const MAX_PREVIEW_LENGTH = 480; // Characters to show before "Read more"

export default function MentorDetailsOverview({
  overview,
}: MentorDetailsOverviewProps) {
  const colors = useColors();
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = useTypedSelector(
    (state) => state.mentor?.lastMentorData?.mentorProfile?.summary
  );
  const mentoringExperience = useTypedSelector(
    (state) => state.mentor?.lastMentorData?.mentorProfile?.mentoringExperience
  );
  const mentorName = useTypedSelector(
    (state) => state.mentor?.lastMentorData?.profile?.name
  );
  const { t } = useTranslation();

  // Combine summary and mentoring experience
  const combinedContent = [
    summary,
    mentoringExperience
  ].filter(Boolean).join('\n\n');

  if (!combinedContent) return null;

  // Get first name from full name
  const firstName = mentorName?.split(' ')[0] || 'Mentor';
  const needsTruncation = combinedContent.length > MAX_PREVIEW_LENGTH;
  const displayText = isExpanded || !needsTruncation 
    ? combinedContent 
    : `${combinedContent.substring(0, MAX_PREVIEW_LENGTH)}...`;

  return (
    <div className={styles.section_wrapper}>
      <CustomText
        fontWeight={themeFontWeight.fontWeightSemibold}
        fontSize={themeFontSize.fontSizeTitle5}
        color={colors.colorText}
        mb={0}
        style={{ marginBottom: '10px' }}
      >
        {t('mentors.aboutMentor', { firstName }) || `About ${firstName}`}
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
