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
    <div style={{ margin: '24px 0' }}>
      <CustomText
        fontWeight={themeFontWeight.fontWeightSemibold}
        fontSize={themeFontSize.fontSizeTitle5}
        color={colors.colorText}
        mb={16}
      >
        {t('mentors.specializations') || 'Specializations'}
      </CustomText>
      <CustomCard shadowed={false} bordered>
        <div className={styles.tags_container}>
          {tags.map((tag, index) => (
            <Tag
              key={index}
              color={colors.colorPrimary}
              className={styles.tag}
            >
              {tag}
            </Tag>
          ))}
        </div>
      </CustomCard>
    </div>
  );
}

