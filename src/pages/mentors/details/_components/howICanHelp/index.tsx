import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';

const MAX_PREVIEW_LENGTH = 450; // Characters to show before "Read more"

export default function MentorDetailsHowICanHelp() {
  const colors = useColors();
  const [isExpanded, setIsExpanded] = useState(false);
  const mentorshipValue = useTypedSelector(
    (state) => state.mentor?.lastMentorData?.mentorProfile?.mentorshipValue
  );
  const whyDoICoach = useTypedSelector(
    (state) => state.mentor?.lastMentorData?.mentorProfile?.whyDoICoach
  );
  const { t } = useTranslation();

  // Combine whyDoICoach and mentorshipValue
  const combinedContent = [
    whyDoICoach,
    mentorshipValue
  ].filter(Boolean).join('\n\n');

  if (!combinedContent) {
    return null;
  }

  const needsTruncation = combinedContent.length > MAX_PREVIEW_LENGTH;
  const displayText = isExpanded || !needsTruncation 
    ? combinedContent 
    : `${combinedContent.substring(0, MAX_PREVIEW_LENGTH)}...`;

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
      <div style={{ maxWidth: '800px', marginTop: '10px' }}>
        <CustomText 
          color={colors.colorTextSecondary} 
          lineHeight={'24px'}
          style={{ 
            marginBottom: 0,
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}
        >
          {displayText}
        </CustomText>
        {needsTruncation && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              marginTop: '10px',
              padding: 0,
              textDecoration: 'none',
              color: colors.colorPrimary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            {isExpanded ? t('mentors.readLess') || 'Read less' : t('mentors.readMore') || 'Read more'}
          </button>
        )}
      </div>
    </div>
  );
}

