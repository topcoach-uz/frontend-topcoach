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
    const startFormatted = formatDate(start);
    const endFormatted = end ? formatDate(end) : 'Present';
    if (!startFormatted) return '';
    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <div style={{ margin: '24px 0' }}>
      <CustomText
        fontWeight={themeFontWeight.fontWeightSemibold}
        fontSize={themeFontSize.fontSizeTitle5}
        color={colors.colorText}
        mb={16}
      >
        {t('mentors.education') || 'Education'}
      </CustomText>
      {/* Display education history if available */}
      {educationHistory.length > 0 ? (
        educationHistory
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((edu, index) => (
            <CustomCard
              key={edu.id || index}
              shadowed={false}
              bordered
              style={{ marginTop: index > 0 ? 16 : 0 }}
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
            </CustomCard>
          ))
      ) : (
        /* Fallback to primary university if no education history */
        primaryUniversity && (
          <CustomCard shadowed={false} bordered>
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
          </CustomCard>
        )
      )}
    </div>
  );
}

