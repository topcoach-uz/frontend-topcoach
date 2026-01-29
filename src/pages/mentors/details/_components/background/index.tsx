import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './mentor_background.module.scss';
import languageSelectOptions from '../../../../../../public/JSON/languageSelectOptions.json';
import { useTypedSelector } from 'src/app/store';
import { useTranslation } from 'react-i18next';

interface Props {}

export default function MentorDetailsBackground({}: Props) {
  const colors = useColors();
  const { lastMentorData: mentorData } = useTypedSelector(
    (state) => state.mentor
  );
  const { t } = useTranslation();
  const languages = mentorData?.mentorProfile?.languages;
  const major = mentorData?.mentorProfile?.major;

  const mappedLanguages = languages?.map(
    (lang) =>
      languageSelectOptions.find((val) => lang.includes(val.value))?.label
  );

  // Don't show if no languages or major
  if (!languages?.length && !major) {
    return null;
  }

  return (
    <div className={styles.section_wrapper}>
      <CustomText
        fontWeight={themeFontWeight.fontWeightSemibold}
        fontSize={themeFontSize.fontSizeTitle5}
        color={colors.colorText}
        mb={0}
        style={{ marginBottom: '10px' }}
      >
        {t('mentors.background')}
      </CustomText>
      
      {languages && languages.length > 0 && (
        <div className={styles.background_item}>
          <CustomText
            color={colors.colorText}
            fontWeight={themeFontWeight.fontWeightMedium}
            fontSize={themeFontSize.fontSizeTitle7}
            className={styles.item_label}
          >
            {t('mentors.language')}
          </CustomText>
          <div className={styles.items_list}>
            {mappedLanguages?.map((item, index) => (
              <span key={index} className={styles.item_tag}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {major && (
        <div className={styles.background_item}>
          <CustomText
            color={colors.colorText}
            fontWeight={themeFontWeight.fontWeightMedium}
            fontSize={themeFontSize.fontSizeTitle7}
            className={styles.item_label}
          >
            {t('mentors.majors')}
          </CustomText>
          <div className={styles.items_list}>
            <span className={styles.item_tag}>{major}</span>
          </div>
        </div>
      )}
    </div>
  );
}
