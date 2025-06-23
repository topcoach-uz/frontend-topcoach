import { Flex } from 'antd';
import { AiSearchStartsWhiteSvg } from 'src/assets/svg';
import AiSearchTextArea from 'src/components/aiSearchTextArea';
import { CustomButton, CustomText } from 'src/components/common';
import { SearchIcon } from 'src/components/icons';
import {
  themeColors,
  themeFontSize,
  themeFontWeight,
} from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './aiSearch.module.scss';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { useTranslation } from 'react-i18next';
import useParamsHook from 'src/hooks/params';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingAISearchSection() {
  const colors = useColors();
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();

  const { handleMakeParams } = useParamsHook();
  const navigate = useNavigate();
  const [universityName, setUniversityName] = useState('');

  const handleSearchUniversity = () => {
    navigate('/universities');
    handleMakeParams('name', universityName);
    console.log('clicked');
  };

  return (
    <section className={styles.section}>
      <img
        className={styles.backgroundImage}
        src="/img/some-university.png"
        alt=""
      />
      <div className={'container ' + styles.container}>
        <div className={styles.action}>
          <CustomText
            fontSize={
              screenSize > 768
                ? themeFontSize.fontSizeTitle2
                : themeFontSize.fontSizeTitle5
            }
            fontWeight={themeFontWeight.fontWeightSemibold}
            lineHeight={1.25}
            color={colors.colorTextLight}
            mb={32}
          >
            {t('landing.aiSearchTitle')}
          </CustomText>
          <CustomText
            mb={16}
            color={colors.colorTextLight}
            lineHeight={1.57}
            fontSize={themeFontSize.fontSizeTitle8}
          >
            <Flex align="center" gap={8}>
              <AiSearchStartsWhiteSvg style={{ minWidth: 32 }} />
              {t('landing.aiSearchSubtitle')}
            </Flex>
          </CustomText>

          <AiSearchTextArea
            setSearchText={handleSearchUniversity}
            universityName={universityName}
            setUniversityName={setUniversityName}
          />

          <CustomButton
            mt={32}
            size="middle"
            icon={<SearchIcon color="inherit" />}
            darkMode={false}
            textColor={themeColors.light.colorText}
            onClick={() => {
              navigate(`/universities?name=${universityName}`),
                handleSearchUniversity;
            }}
          >
            {t('landing.searchBtn')}
          </CustomButton>
        </div>
      </div>
    </section>
  );
}
