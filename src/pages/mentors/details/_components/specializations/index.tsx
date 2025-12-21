import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { CustomCard } from 'src/components/cards';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './specializations.module.scss';

// Tag ID to readable name mapping
const TAG_NAMES: Record<string, string> = {
  'business': 'Business & MBA',
  'computer-science': 'Computer Science & Engineering',
  'medicine': 'Medicine & Health Sciences',
  'law': 'Law',
  'humanities': 'Humanities & Social Sciences',
  'arts': 'Arts & Design',
  'natural-sciences': 'Natural Sciences',
  'mathematics': 'Mathematics & Statistics',
  'economics': 'Economics & Finance',
  'engineering': 'Engineering',
  'education': 'Education',
  'international-relations': 'International Relations',
  'architecture': 'Architecture',
  'psychology': 'Psychology',
  'journalism': 'Journalism & Media',
  'pharmacy': 'Pharmacy',
  'dentistry': 'Dentistry',
  'veterinary': 'Veterinary Science',
  'agriculture': 'Agriculture',
  'environmental': 'Environmental Science',
  'public-health': 'Public Health',
  'nursing': 'Nursing',
  'philosophy': 'Philosophy',
  'history': 'History',
  'literature': 'Literature',
  'linguistics': 'Linguistics',
  'political-science': 'Political Science',
  'sociology': 'Sociology',
  'anthropology': 'Anthropology',
  'geography': 'Geography',
  'physics': 'Physics',
  'chemistry': 'Chemistry',
  'biology': 'Biology',
  'biotechnology': 'Biotechnology',
  'data-science': 'Data Science',
  'cybersecurity': 'Cybersecurity',
  'artificial-intelligence': 'Artificial Intelligence',
  'mechanical-engineering': 'Mechanical Engineering',
  'electrical-engineering': 'Electrical Engineering',
  'civil-engineering': 'Civil Engineering',
  'chemical-engineering': 'Chemical Engineering',
  'aerospace': 'Aerospace Engineering',
  'biomedical-engineering': 'Biomedical Engineering',
  'industrial-engineering': 'Industrial Engineering',
  'materials-science': 'Materials Science',
  'accounting': 'Accounting',
  'marketing': 'Marketing',
  'management': 'Management',
  'entrepreneurship': 'Entrepreneurship',
  'finance': 'Finance',
  'banking': 'Banking',
  'insurance': 'Insurance',
  'real-estate': 'Real Estate',
  'hospitality': 'Hospitality & Tourism',
  'sports-science': 'Sports Science',
  'nutrition': 'Nutrition',
  'fashion': 'Fashion Design',
  'music': 'Music',
  'theater': 'Theater & Drama',
  'film': 'Film & Media Studies',
};

const getTagDisplayName = (tag: string): string => {
  return TAG_NAMES[tag] || tag;
};

export default function MentorDetailsSpecializations() {
  const colors = useColors();
  const tags = useTypedSelector(
    (state) => state.mentor?.lastMentorData?.mentorProfile?.tags
  );
  const { t } = useTranslation();

  if (!tags || tags.length === 0) {
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
        {t('mentors.specializations') || 'Specializations'}
      </CustomText>
      <div className={styles.tags_container}>
        {tags.map((tag, index) => (
          <span key={index} className={styles.tag}>
            {getTagDisplayName(tag)}
          </span>
        ))}
      </div>
    </div>
  );
}

