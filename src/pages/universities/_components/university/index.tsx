import useUniversity from 'src/pages/home/_components/university/useUniversity';

import { Drawer, Flex, Pagination, Spin, Switch } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { AiSearchStarsSvg } from 'src/assets/svg';
import AiSearchTextArea from 'src/components/aiSearchTextArea';
import { CustomCard } from 'src/components/cards';
import { CustomButton, CustomText } from 'src/components/common';
import CardSkeletons from 'src/components/common/cardSkeletons';
import MultiAiSearchTextArea from 'src/components/multiAiSeach';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useParamsHook from 'src/hooks/params';
import { useScreenSize } from 'src/hooks/useScreenSize';
import UniversityCard from 'src/pages/home/_components/university/card';
import { scrollToTop } from 'src/utils';
import UniversityFilter from '../filter';
import styles from './university.module.scss';
import UniverAiSearchCard from '../univerAiSearchCard';
import Loader from 'src/components/loader';

interface Props {
  isDark?: boolean;
  checked?: boolean;
  aiLimit?: number;
  handleSwitch?: (checked: boolean) => void;
}

export default function UniversitySection({
  isDark = false,
  checked,
  aiLimit,
  handleSwitch,
}: Props) {
  const {
    formattedLocationData,
    aiSearchSummary,
    aiUni,
    aiSearchLoading,
    isLoading,
    page,
    totalCount,
    pageSize,
    handleAiSearch,
    handleAiSeachClear,
    setPage,
    setSearchText,
  } = useUniversity();
  const [drawer, setDrawer] = useState(false);
  const { darkMode, colors } = useTypedSelector((state) => state.layout);
  const { screenSize } = useScreenSize();
  const { profile: meData } = useTypedSelector((state) => state.auth);
  const likedUnis = meData?.likedUniversities;
  const { t } = useTranslation();
  const { handleMakeParams } = useParamsHook();
  const [universityName, setUniversityName] = useState('');

  const handleSearchUniversity = () => {
    handleMakeParams('name', universityName);
  };

  return (
    <div className={styles.university}>
      <CustomText
        color={colors.colorTextBase}
        fontSize={themeFontSize.fontSizeTitle5}
        fontWeight={themeFontWeight.fontWeightSemibold}
        mb={8}
      >
        <Flex gap={8} align="center">
          <AiSearchStarsSvg />
          {checked
            ? t('universities.aiSearchTitle')
            : t('universities.findYourSpecialty')}
        </Flex>
      </CustomText>

      <CustomText
        color={colors.colorText}
        lineHeight={1.57}
        fontSize={themeFontSize.fontSizeTitle8}
        mb={4}
      >
        {checked
          ? t('universities.aiSearchText')
          : t('universities.filterText')}
      </CustomText>

      {checked ? (
        <div>
          <ul className={styles.list}>
            <li>
              What degree do you want to pursue?{' '}
              <i>(Undergraduate or Graduate)</i>
            </li>
            <li>
              What are your interests and passions?{' '}
              <i>(Civil engineering; Physics)</i>
            </li>
            <li>
              In which field do you see yourself working in the future?{' '}
              <i>(Environmental Engineering)</i>
            </li>
          </ul>
          <div className={styles.search}>
            <MultiAiSearchTextArea
              setText={setSearchText}
              placeholderText="Discover your path with Artificial Intelligence."
              isInUniversityPage={true}
            />
          </div>

          {aiSearchSummary && (
            <CustomCard
              bordered
              bgColor={colors.colorBgContainer}
              mt={24}
              paddingVertical={20}
              className={styles.aiSummary}
            >
              <div className={styles.aiFlex}>
                <AiSearchStarsSvg />
                <CustomText fontSize={20} fontWeight={500}>
                  AI Search Summary
                </CustomText>
              </div>
              <CustomText
                fontSize={14}
                color={colors.colorText}
                mt={12}
                p={16}
                lineHeight="18px"
                className={styles.aiSearchSummary}
              >
                {aiSearchSummary}
              </CustomText>
            </CustomCard>
          )}
        </div>
      ) : (
        <div>
          <AiSearchTextArea
            isInUniversityPage={true}
            isDark={darkMode}
            filterButton={screenSize < 1024}
            filterButtonProps={{ onClick: () => setDrawer(true) }}
            universityName={universityName}
            setUniversityName={setUniversityName}
            setSearchText={setSearchText}
          />
        </div>
      )}

      <div className={styles.switch}>
        {checked ? (
          <>
            <CustomButton type="primary" onClick={() => handleAiSearch()}>
              {t('landing.submit')}{' '}
            </CustomButton>
            <CustomButton onClick={() => handleAiSeachClear()}>
              Clear
            </CustomButton>
          </>
        ) : (
          <CustomButton type="primary" onClick={handleSearchUniversity}>
            {t('landing.submit')}
          </CustomButton>
        )}

        <div className={styles.switchInside}>
          <Switch
            checked={checked}
            className={styles.switch}
            onChange={handleSwitch}
          />
          <CustomText
            fontSize={14}
            fontWeight={400}
            mt={8}
            style={{ whiteSpace: 'nowrap' }}
            color={colors.colorTextPlaceholder}
            onClick={() => handleSwitch && handleSwitch(true)}
          >
            {t('landing.aiSearch')}
          </CustomText>
        </div>
      </div>

      <Drawer
        destroyOnClose
        title="Filters"
        open={drawer}
        onClose={() => setDrawer(false)}
      >
        <UniversityFilter />
      </Drawer>

      <CustomText
        mt={4}
        color={colors.colorTextDescription}
        fontSize={themeFontSize.fontSizeTitle8}
        lineHeight={1.57}
      >
        {checked === false
          ? ''
          : `You can use AI major finder ${aiLimit} times`}
      </CustomText>

      {aiSearchLoading && <Loader height={80} />}
      {/* ai search results */}

      {aiUni.length === 0 && formattedLocationData.length > 0 ? (
        <ul className={styles.card_list}>
          {!isLoading ? (
            formattedLocationData?.map((university, index) => (
              // @ts-ignore
              <UniversityCard
                key={index}
                {...university}
                location={university.location}
                name={university.name}
                image={university.media[0]?.url}
                // @ts-ignore
                tuition={`${university.tuitionFees[0].currency?.symbol}${(university.tuitionFees[0].fee * 1000).toLocaleString()}`}
                isLiked={likedUnis?.some((uni) => uni.id === university.id)}
                aiSummary={university.aiSummary}
              />
            ))
          ) : (
            <CardSkeletons />
          )}
        </ul>
      ) : (
        <div className={styles.newAiSearch}>
          {formattedLocationData?.map((university, index) => (
            <UniverAiSearchCard
              key={index}
              name={university.name}
              ranking={university.ranking}
              location={university.location}
              aiSummary={university.aiSummary}
              image={university.media[0]?.url}
              majors={university.majors}
              aiData={university.aiData}
            />
          ))}
        </div>
      )}

      {aiUni.length === 0 && formattedLocationData.length > 0 ? (
        <Pagination
          style={{ marginTop: 16 }}
          current={page}
          pageSize={pageSize}
          onChange={(page) => {
            setPage(page);
            scrollToTop();
          }}
          total={totalCount}
        />
      ) : (
        ''
      )}
    </div>
  );
}
