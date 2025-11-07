import { Breadcrumb, Flex, Skeleton } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import React, { useMemo } from 'react';
import {
  CurrenciesSchema,
  TranslationDto,
  UniversitiesSchema,
} from 'src/app/api/Api';
import { useTypedSelector } from 'src/app/store';
import { CustomButton, CustomText } from 'src/components/common';
import styles from './overview.module.scss';
import RichTextRenderer from '../detail/richText';
import { LikeIcon } from 'src/components/icons';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { useTranslation } from 'react-i18next';

interface Props extends Partial<UniversitiesSchema> {
  isLoading: boolean;
  firstTwoBlocks: any[];
  remainingBlocks: any[];
  handleLike: () => void;
  isLiked: boolean;
}

const UnivercityDetailOverview = React.memo(function UnivercityDetailOverview({
  acceptanceRates,
  applicationFees,
  scholarships,
  deadlines,
  tuitionFees,
  isLoading,
  firstTwoBlocks,
  rankings,
  handleLike,
  isLiked,
  id,
  remainingBlocks,
  contacts,
  content,
  createdAt,
  degrees,
  deletedAt,
  description,
  establishedIn,
  links,
  location,
  majors,
  media,
  name,
  notes,
  requiredExams,
  selectedBy,
  summary,
  universityTypes,
  updatedAt,
  users,
}: Props) {
  const { colors } = useTypedSelector((state) => state.layout);
  const navigate = useNavigate();
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();

  const formattedApplicationDeadline = dayjs(deadlines?.[0]?.date).format(
    'MMMM Do, YYYY'
  );

  if (isLoading) {
    return (
      <div className={styles.overview}>
        <Skeleton.Button 
          active 
          size="default" 
          style={{ 
            width: 80, 
            height: 32, 
            marginBottom: 24,
            border: 'none',
            borderRadius: '8px'
          }} 
        />
        <Flex gap={16} vertical>
          <Skeleton.Input 
            active 
            size="default" 
            style={{ 
              width: 200, 
              height: 24, 
              marginBottom: 8,
              border: 'none',
              borderRadius: '4px'
            }} 
          />
          <Skeleton 
            active 
            paragraph={{ rows: 2, width: ['100%', '80%'] }} 
            title={false}
            className={styles.skeletonNoBorder}
          />
          
          <Skeleton.Input 
            active 
            size="default" 
            style={{ 
              width: 200, 
              height: 24, 
              marginTop: 16, 
              marginBottom: 8,
              border: 'none',
              borderRadius: '4px'
            }} 
          />
          <Skeleton 
            active 
            paragraph={{ rows: 1, width: '60%' }} 
            title={false}
            className={styles.skeletonNoBorder}
          />
          
          <Skeleton.Input 
            active 
            size="default" 
            style={{ 
              width: 200, 
              height: 24, 
              marginTop: 16, 
              marginBottom: 8,
              border: 'none',
              borderRadius: '4px'
            }} 
          />
          <Skeleton 
            active 
            paragraph={{ rows: 1, width: '40%' }} 
            title={false}
            className={styles.skeletonNoBorder}
          />
          
          <Skeleton.Input 
            active 
            size="default" 
            style={{ 
              width: 200, 
              height: 24, 
              marginTop: 16, 
              marginBottom: 8,
              border: 'none',
              borderRadius: '4px'
            }} 
          />
          <Skeleton 
            active 
            paragraph={{ rows: 1, width: '30%' }} 
            title={false}
            className={styles.skeletonNoBorder}
          />
          
          <Skeleton.Input 
            active 
            size="default" 
            style={{ 
              width: 200, 
              height: 24, 
              marginTop: 16, 
              marginBottom: 8,
              border: 'none',
              borderRadius: '4px'
            }} 
          />
          <Skeleton 
            active 
            paragraph={{ rows: 3, width: ['100%', '90%', '70%'] }} 
            title={false}
            className={styles.skeletonNoBorder}
          />
          
          <Skeleton.Input 
            active 
            size="default" 
            style={{ 
              width: 200, 
              height: 24, 
              marginTop: 16, 
              marginBottom: 8,
              border: 'none',
              borderRadius: '4px'
            }} 
          />
          <Skeleton 
            active 
            paragraph={{ rows: 2, width: ['100%', '80%'] }} 
            title={false}
            className={styles.skeletonNoBorder}
          />
        </Flex>
      </div>
    );
  }

  return (
    <div className={styles.overview}>
      <CustomButton
        type="default"
        onClick={() => {
          navigate(-1);
        }}
      >
        {t('btn.back')}
      </CustomButton>
      {screenSize < 768 && (
        <Flex justify="space-between" style={{ marginTop: 20 }}>
          <RichTextRenderer
            id={id || ''}
            blocks={Array.isArray(firstTwoBlocks) ? firstTwoBlocks : []}
            ranking={rankings && rankings[0]?.rank}
            isUniversityDetail={true}
          />
          <div>
            <div className={styles.like} onClick={handleLike}>
              <LikeIcon stroke={'#F5222D'} fill={isLiked ? '#F5222D' : ''} />
            </div>
          </div>
        </Flex>
      )}
      <CustomText
        color={colors.colorTextBase}
        fontSize={24}
        fontWeight={600}
        as="p"
        mt={24}
        mb={24}
      >
        {t('universities.overview')}
      </CustomText>
      <div>
        <CustomText
          color={colors.colorTextBase}
          fontSize={16}
          fontWeight={500}
          lineHeight="24px"
        >
          {t('universities.deadline')}
        </CustomText>
        {deadlines?.map((deadline, index) => (
          <CustomText
            color={colors.colorTextSecondary}
            fontSize={14}
            fontWeight={400}
            lineHeight="140%"
            key={index}
            style={{ whiteSpace: 'pre-line' }}
          >
            {deadline?.name as any}
          </CustomText>
        ))}
      </div>
      <div>
        <CustomText
          color={colors.colorTextBase}
          fontSize={16}
          fontWeight={500}
          lineHeight="24px"
          mt={24}
        >
          {t('universities.tuitionFee')}:
        </CustomText>
        <CustomText
          color={colors.colorTextSecondary}
          fontSize={14}
          fontWeight={400}
          lineHeight="140%"
          // width={320}
        >
          {tuitionFees &&
            tuitionFees.map((fee, index) => (
              <div key={index}>
                {(fee.currency as CurrenciesSchema).symbol}
                {fee.fee.toLocaleString()}
              </div>
            ))}
        </CustomText>
      </div>
      <div>
        <CustomText
          color={colors.colorTextBase}
          fontSize={16}
          fontWeight={500}
          lineHeight="24px"
          mt={24}
        >
          {t('universities.applicationFee')}:
        </CustomText>
        <CustomText
          color={colors.colorTextSecondary}
          fontSize={14}
          fontWeight={400}
          lineHeight="140%"
          // width={320}
        >
          {applicationFees &&
            applicationFees.map((fee, index) => (
              <div key={index}>
                {(fee.currency as CurrenciesSchema).symbol}
                {fee.fee?.toLocaleString()}{' '}
              </div>
            ))}
        </CustomText>
      </div>
      <div>
        <CustomText
          color={colors.colorTextBase}
          fontSize={16}
          fontWeight={500}
          lineHeight="24px"
          mt={24}
        >
          {t('universities.acceptanceRate')}:
        </CustomText>
        <CustomText
          color={colors.colorTextSecondary}
          fontSize={14}
          fontWeight={400}
          lineHeight="140%"
          // width={320}
        >
          {acceptanceRates &&
            acceptanceRates.map((rate, index) => (
              <div key={index}>{rate?.rate}%</div>
            ))}
        </CustomText>
      </div>
      <div>
        <CustomText
          color={colors.colorTextBase}
          fontSize={16}
          fontWeight={500}
          lineHeight="24px"
          mt={24}
        >
          {t('universities.scholarship')}:
        </CustomText>
        {scholarships &&
          scholarships.map((scholarship, index) => (
            <>
              <CustomText
                key={index}
                color={colors.colorTextSecondary}
                fontSize={14}
                fontWeight={400}
                lineHeight="140%"
                style={{ display: 'block', whiteSpace: 'pre-line' }}
              >
                {scholarship?.name as string}
              </CustomText>
              {scholarship?.url && (
                <CustomButton
                  className={styles.linkButton}
                  type="link"
                  target="_blank"
                  href={scholarship.url}
                  p={0}
                >
                  {scholarship.url}
                </CustomButton>
              )}
            </>
          ))}

        <CustomText
          color={colors.colorTextBase}
          fontSize={16}
          fontWeight={500}
          lineHeight="24px"
          mt={24}
        >
          {t('universities.links')}:
        </CustomText>
        {links &&
          links.map((link, index) => (
            <Flex key={index} vertical>
              <CustomText fontSize={16} style={{ whiteSpace: 'nowrap' }}>
                {link?.name}:
              </CustomText>
              <CustomButton
                className={styles.linkButton}
                type="link"
                target="_blank"
                href={link?.url as string}
                p={0}
              >
                {link?.url as string}
              </CustomButton>
            </Flex>
          ))}
      </div>
      <div>
        <CustomText
          color={colors.colorTextBase}
          fontSize={16}
          fontWeight={500}
          lineHeight="24px"
          mt={24}
        >
          {t('universities.requirements')}:
        </CustomText>
        {requiredExams?.map((exam, index) => (
          <CustomText
            key={index}
            color={colors.colorTextSecondary}
            fontSize={14}
            fontWeight={400}
            lineHeight="140%"
          >
            {exam.certification?.name}
          </CustomText>
        ))}
      </div>
    </div>
  );
});

export default UnivercityDetailOverview;
