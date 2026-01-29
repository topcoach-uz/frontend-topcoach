import { CustomCard } from 'src/components/cards';
import styles from './aiSearch.module.scss';
import AiSearchTextArea from 'src/components/aiSearchTextArea';
import { CustomButton, CustomText } from 'src/components/common';
import { AiSearchStarsSvg } from 'src/assets/svg';
import useColors from 'src/hooks/useColors';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { Flex } from 'antd';
import { useTypedSelector } from 'src/app/store';
import useParamsHook from 'src/hooks/params';
import { useState } from 'react';

export default function HomeAiSearchSection() {
  const { colors, darkMode } = useTypedSelector((state) => state.layout);

  const { handleMakeParams } = useParamsHook();
  const [universityName, setUniversityName] = useState('');

  const handleSearchUniversity = () => {
    handleMakeParams('name', universityName);
    console.log('clicked');
  };

  return (
    <section>
      <div className={'container ' + styles.container}>
        <CustomCard bgColor={colors.colorBgContainer} shadowed={false}>
          <CustomText
            color={colors.colorTextBase}
            fontSize={themeFontSize.fontSizeTitle5}
            fontWeight={themeFontWeight.fontWeightSemibold}
            mb={16}
          >
            <Flex align="center" gap={8}>
              <AiSearchStarsSvg />
              Find the right direction for you with artificial intelligence
            </Flex>
          </CustomText>
          <CustomText
            color={colors.colorText}
            fontSize={themeFontSize.fontSizeTitle8}
            lineHeight={1.57}
            mb={4}
          >
            Write about your interests and AI finds the right major for you.
          </CustomText>

          <AiSearchTextArea
            setSearchText={handleSearchUniversity}
            isDark={darkMode}
            universityName={universityName}
            setUniversityName={setUniversityName}
          />

          <CustomText
            color={colors.colorTextDescription}
            fontSize={themeFontSize.fontSizeTitle8}
            lineHeight={1.57}
            mt={6}
          >
            You can use AI search 3 times a day. You have 2 requests left.
          </CustomText>

          <CustomButton mt={16} type="primary">
            Find now
          </CustomButton>
        </CustomCard>
      </div>
    </section>
  );
}
