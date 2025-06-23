import React from 'react';
import {
  Book1,
  Briefcase,
  Building,
  Cup,
  DollarCircle,
  Location,
  Profile2User,
  Teacher,
} from 'iconsax-react';
import { CustomCard } from 'src/components/cards';
import { CustomButton, CustomText } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import styles from './uniAiSearch.module.scss';
import { IUniversity } from 'src/pages/home/_components/university/useUniversity';
import { AIUnivDataDTO, MajorsSchema } from 'src/app/api/Api';
import { getTranslation } from 'src/lib/i18n/translationUtils';

interface Props extends IUniversity {
  aiSummary?: string;
  majors?: MajorsSchema[];
  aiData?: AIUnivDataDTO;
}

function UniverAiSearchCard({
  image,
  name,
  ranking,
  location,
  aiSummary,
  aiData,
  majors,
}: Props) {
  const colors = useColors();

  const admissionAiData = aiData?.admission;
  const academicAiData = aiData?.academics;
  const financeAiData = aiData?.finance;
  const majorAiData = aiData?.majors;
  return (
    <CustomCard padding={0} bordered>
      <div className={styles.university}>
        <div className={styles.top}>
          <div className={styles.img}>
            <img src={image} alt="img error" />
          </div>
          <div className={styles.topData}>
            <div className={styles.uniName}>
              <CustomText
                fontSize={24}
                fontWeight={600}
                color={colors.colorText}
              >
                {getTranslation(name) || ''}
              </CustomText>
              <div className={styles.ranking}>
                <Cup size="18" color={colors.colorBgBase} />
                <CustomText color={colors.colorBgBase}>
                  QS Rank #{ranking}
                </CustomText>
              </div>
            </div>
            <div className={styles.location}>
              {' '}
              <Location size="18" color={colors.colorTextDescription} />
              <CustomText fontSize={14} color={colors.colorTextDescription}>
                {getTranslation(location) || ''}
              </CustomText>
            </div>
            <CustomText fontSize={16} color={colors.colorTextSecondary} mt={8}>
              {aiSummary}
            </CustomText>
          </div>
        </div>
        <div className={styles.details}>
          <CustomCard
            padding={16}
            bgColor={colors.colorBgContainer}
            className={styles.detailCard}
          >
            <div className={styles.detailTitle}>
              <Profile2User size="18" color={colors.colorSecondary} />
              <CustomText color={colors.colorText}>Admission</CustomText>
            </div>
            <CustomText mt={12} fontSize={14} color={colors.colorTextSecondary}>
              Rate: {admissionAiData?.rate}
            </CustomText>
            <CustomText mt={8} fontSize={14} color={colors.colorTextSecondary}>
              SAT: {admissionAiData?.sat}
            </CustomText>
            <CustomText mt={8} fontSize={14} color={colors.colorTextSecondary}>
              ACT: {admissionAiData?.act}
            </CustomText>
          </CustomCard>
          <CustomCard
            padding={16}
            bgColor={colors.colorBgContainer}
            className={styles.detailCard}
          >
            <div className={styles.detailTitle}>
              <Teacher size="18" color={colors.colorSecondary} />
              <CustomText color={colors.colorText}>Academics</CustomText>
            </div>
            <CustomText mt={12} fontSize={14} color={colors.colorTextSecondary}>
              GPA: {academicAiData?.gpa}
            </CustomText>
            <CustomText mt={8} fontSize={14} color={colors.colorTextSecondary}>
              Retention: {academicAiData?.retention}%
            </CustomText>
            <CustomText mt={8} fontSize={14} color={colors.colorTextSecondary}>
              Graduation: {academicAiData?.graduation}%
            </CustomText>
          </CustomCard>
          <CustomCard
            padding={16}
            bgColor={colors.colorBgContainer}
            className={styles.detailCard}
          >
            <div className={styles.detailTitle}>
              <DollarCircle size="18" color={colors.colorSecondary} />
              <CustomText color={colors.colorText}>Costs & Aid</CustomText>
            </div>
            <CustomText mt={12} fontSize={14} color={colors.colorTextSecondary}>
              Cost: ${financeAiData?.cost}/year
            </CustomText>
            <CustomText mt={8} fontSize={14} color={colors.colorTextSecondary}>
              Aid: {financeAiData?.aid}% receive aid
            </CustomText>
            <CustomText mt={8} fontSize={14} color={colors.colorTextSecondary}>
              Size: {financeAiData?.size}
            </CustomText>
          </CustomCard>
        </div>
      </div>
      <div className={styles.major}>
        {majorAiData?.map((item, index) => (
          <>
            <div className={styles.majorTop}>
              <div>
                <div className={styles.majorTitle}>
                  <Book1 size="22" color={colors.colorSecondary} />
                  <CustomText
                    fontSize={20}
                    fontWeight={500}
                    color={colors.colorText}
                  >
                    {item.name}
                  </CustomText>
                </div>
                <CustomText mt={16} color={colors.colorTextDescription}>
                  {aiData?.summary}
                </CustomText>
                <div className={styles.tags}>
                  {majorAiData &&
                    item.rankings?.map((career, index) => (
                      <div key={index + career} className={styles.tag}>
                        {career}
                      </div>
                    ))}
                </div>
                <div className={styles.paths}>
                  <div className={styles.courses}>
                    <div style={{ display: 'flex', columnGap: 4 }}>
                      <Building size="18" color={colors.colorSecondary} />
                      <CustomText
                        fontSize={16}
                        fontWeight={500}
                        color={colors.colorText}
                      >
                        Key Courses
                      </CustomText>
                    </div>
                    <div className={styles.career}>
                      {item.keyCourses?.map((course, index) => (
                        <div key={index + course} className={styles.majorPaths}>
                          {course}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.courses}>
                    <div style={{ display: 'flex', columnGap: 4 }}>
                      <Briefcase size="18" color={colors.colorSecondary} />
                      <CustomText
                        fontSize={16}
                        fontWeight={500}
                        color={colors.colorText}
                      >
                        Career Paths
                      </CustomText>
                    </div>
                    <div className={styles.career}>
                      {item.careerPaths?.map((career, index) => (
                        <div key={index + career} className={styles.majorPaths}>
                          {career}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.match}>
                <Cup size="24" color={colors.colorBgBase} />
                <CustomText
                  mt={4}
                  fontSize={18}
                  fontWeight={500}
                  color={colors.colorBgBase}
                >
                  {item.match}%
                </CustomText>
                <CustomText mt={4} fontSize={14} color={colors.colorBgBase}>
                  Match
                </CustomText>
              </div>
            </div>
            <div
              className={styles.link}
              style={{
                textAlign: 'left', // Keep this for text alignment within the button
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              <a
                // href={(majorAiData && majorAiData[0].link) || ''}
                href={item.link || ''}
                target="_blank"
              >
                <CustomButton type="primary">View major details</CustomButton>
              </a>
            </div>
          </>
        ))}
      </div>
    </CustomCard>
  );
}

export default UniverAiSearchCard;
