import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { CustomCard } from 'src/components/cards';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import { Divider } from 'antd';
import styles from './education.module.scss';
import dayjs from 'dayjs';

export default function MentorDetailsEducation() {
  const colors = useColors();
  const mentorProfile = useTypedSelector(
    (state) => state.mentor?.lastMentorData?.mentorProfile
  );
  const { t } = useTranslation();

  // Get education history if available, otherwise fall back to primary university
  const educationHistory = mentorProfile?.educationHistory || [];
  const primaryUniversity = mentorProfile?.university;
  const primaryMajor = mentorProfile?.major;
  const startDate = mentorProfile?.universityStartDate;
  const endDate = mentorProfile?.universityEndDate;

  // If no education history and no primary university, don't show the section
  if (educationHistory.length === 0 && !primaryUniversity) {
    return null;
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      // Handle YYYY-MM format
      const date = dayjs(dateStr + '-01'); // Add day to make it a valid date
      return date.format('MMM YYYY');
    } catch {
      return dateStr;
    }
  };

  const formatDateRange = (start?: string, end?: string) => {
    // Ensure dates are in correct order (start should be before end)
    let actualStart = start;
    let actualEnd = end;
    
    if (start && end) {
      // Compare dates as strings (YYYY-MM format allows string comparison)
      if (start > end) {
        // Dates are swapped, fix them
        actualStart = end;
        actualEnd = start;
      }
    }
    
    const startFormatted = formatDate(actualStart);
    const endFormatted = actualEnd ? formatDate(actualEnd) : 'Present';
    if (!startFormatted) return '';
    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <div style={{ margin: '16px 0', paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
      <CustomText
        fontWeight={themeFontWeight.fontWeightSemibold}
        fontSize={themeFontSize.fontSizeTitle5}
        color={colors.colorText}
        mb={0}
        style={{ marginBottom: '10px' }}
      >
        {t('mentors.education') || 'Education'}
      </CustomText>
      {/* Display education history if available */}
      {educationHistory.length > 0 ? (
        educationHistory
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((edu, index) => (
            <div
              key={edu.id || index}
              className={styles.education_card}
              style={{ marginTop: index > 0 ? 20 : 0 }}
            >
              <div className={styles.education_item}>
                {edu.universityLogo && (
                  <img
                    src={edu.universityLogo}
                    alt={edu.university}
                    className={styles.university_logo}
                  />
                )}
                <div className={styles.university_info}>
                  <CustomText
                    color={colors.colorText}
                    fontWeight={themeFontWeight.fontWeightSemibold}
                    fontSize={themeFontSize.fontSizeTitle6}
                    mb={4}
                  >
                    {edu.university}
                  </CustomText>
                  <CustomText
                    color={colors.colorTextSecondary}
                    fontSize={themeFontSize.fontSizeTitle7}
                    mb={4}
                  >
                    {edu.degree ? `${edu.degree}, ` : ''}{edu.major}
                  </CustomText>
                  {(edu.startDate || edu.endDate || edu.isCurrent) && (
                    <CustomText
                      color={colors.colorTextSecondary}
                      fontSize={themeFontSize.fontSizeTitle8}
                    >
                      {formatDateRange(
                        edu.startDate,
                        edu.isCurrent ? undefined : (edu.endDate ?? undefined)
                      )}
                    </CustomText>
                  )}
                </div>
              </div>
            </div>
          ))
      ) : (
        /* Fallback to primary university if no education history */
        primaryUniversity && (
          <div className={styles.education_card}>
            <div className={styles.education_item}>
              <div className={styles.university_info}>
                <CustomText
                  color={colors.colorText}
                  fontWeight={themeFontWeight.fontWeightSemibold}
                  fontSize={themeFontSize.fontSizeTitle6}
                  mb={4}
                >
                  {primaryUniversity}
                </CustomText>
                {primaryMajor && (
                  <CustomText
                    color={colors.colorTextSecondary}
                    fontSize={themeFontSize.fontSizeTitle7}
                    mb={4}
                  >
                    {primaryMajor}
                  </CustomText>
                )}
                {(startDate || endDate) && (
                  <CustomText
                    color={colors.colorTextSecondary}
                    fontSize={themeFontSize.fontSizeTitle8}
                  >
                    {formatDateRange(startDate, endDate)}
                  </CustomText>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

