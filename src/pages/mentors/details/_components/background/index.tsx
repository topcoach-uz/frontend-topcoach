import { Divider } from 'antd';
import { CustomCard } from 'src/components/cards';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './mentor_background.module.scss';
import languageSelectOptions from '../../../../../../public/JSON/languageSelectOptions.json';
import { useTypedSelector } from 'src/app/store';
import { useTranslation } from 'react-i18next';
import { useScreenSize } from 'src/hooks/useScreenSize';

interface Props {}

export default function MentorDetailsBackground({}: Props) {
  const colors = useColors();
  const { screenSize } = useScreenSize();
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

  return (
    <div>
      <CustomText
        fontWeight={themeFontWeight.fontWeightSemibold}
        fontSize={themeFontSize.fontSizeTitle5}
        color={colors.colorText}
        mb={16}
      >
        {t('mentors.background')}
      </CustomText>
      <CustomCard shadowed={false} bordered>
        <div>
          <div className={styles.background_item_wrapper}>
            <CustomText
              color={colors.colorText}
              fontWeight={themeFontWeight.fontWeightMedium}
            >
              {t('mentors.language')}
            </CustomText>
            <ul className={styles.items_list}>
              {mappedLanguages?.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>

          <Divider />

          <div className={styles.background_item_wrapper}>
            <CustomText
              color={colors.colorText}
              fontWeight={themeFontWeight.fontWeightMedium}
            >
              {t('mentors.majors')}
            </CustomText>
            <ul className={styles.items_list}>{major && <li>{major}</li>}</ul>
          </div>
        </div>
      </CustomCard>
    </div>
  );
}
