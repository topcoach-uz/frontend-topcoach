import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { CustomCard } from 'src/components/cards';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './specializations.module.scss';

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
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

