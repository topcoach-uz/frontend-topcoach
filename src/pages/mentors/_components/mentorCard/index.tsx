import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { MentorStarIcon } from 'src/assets/svg/mentor';
import { CustomCard } from 'src/components/cards';
import { CustomText } from 'src/components/common';
import styles from './mentorCard.module.scss';
import { themeColors } from 'src/constants/theme';
import { UserIcon } from 'src/components/icons';
import { Skeleton } from 'antd';
import { useTranslation } from 'react-i18next';
import { getUniversityFlag } from 'src/utils/countryFlags';

interface MentorCardProps {
  id: string;
  imgSrc: string;
  major: string;
  university: string;
  rating: number;
  sessionNumber: number;
  name: string;
  level?: string;
  classname?: string;
  availableSessions?: number;
  isGiveaway?: boolean;
}

export default function MentorCard({
  name,
  imgSrc,
  rating,
  sessionNumber,
  major,
  university,
  id,
  level,
  classname,
  availableSessions = 0,
  isGiveaway = false,
}: MentorCardProps) {
  const { colors } = useTypedSelector((state) => state.layout);
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/mentors/${id}`);
  };

  const { t } = useTranslation();

  return (
    <CustomCard
      padding={0}
      shadowed={false}
      className={styles.card}
      onClick={handleCardClick}
      bordered
    >
      <div className={styles.imgContainer}>
        <div className={styles.img}>
          {imgSrc ? <img src={imgSrc} alt="img error" loading="lazy" /> : <Skeleton.Image />}
        </div>
        
        {/* Coach level badge */}
        <CustomCard
          bgColor={
            level === 'expert'
              ? themeColors.light.red2
              : level === 'senior'
                ? themeColors.light.blue2
                : level == 'junior'
                  ? themeColors.light.green2
                  : themeColors.light.gold2
          }
          padding={8}
          className={styles.coach}
        >
          <CustomText
            fontSize={14}
            fontWeight={500}
            color={
              level === 'expert'
                ? themeColors.light.red8
                : level === 'senior'
                  ? themeColors.light.blue8
                  : level === 'junior'
                    ? themeColors.light.green8
                    : themeColors.light.gold8
            }
          >
            {level} coach
          </CustomText>
        </CustomCard>

        {/* Giveaway badge */}
        {isGiveaway && (
          <CustomCard
            bgColor="#FF6B35"
            padding={8}
            className={styles.giveaway}
          >
            <CustomText
              fontSize={14}
              fontWeight={600}
              color="#ffffff"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              🎁 Giveaway
            </CustomText>
          </CustomCard>
        )}

        {/* Name overlay on image */}
        <div className={styles.nameOverlay}>
          <CustomText
            fontSize={18}
            fontWeight={700}
            color="#ffffff"
            style={{ 
              lineHeight: '1.2',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            {name.toUpperCase()}
          </CustomText>
        </div>
      </div>

      {/* Text details section */}
      <div className={styles.textSection}>
        <div className={styles.universitySection}>
          <CustomText
            fontSize={16}
            fontWeight={600}
            color={colors.colorTextBase}
            mb={8}
            style={{ lineHeight: '1.3', display: 'flex', alignItems: 'center' }}
          >
            <span style={{ marginRight: '8px', fontSize: '18px' }}>
              {getUniversityFlag(university)}
            </span>
            {university}
          </CustomText>
          {major && (
            <CustomText
              fontSize={14}
              fontWeight={400}
              color={colors.colorTextDescription}
              lineHeight="1.4"
              mb={12}
            >
              {major}
            </CustomText>
          )}
        </div>

        {/* Available sessions */}
        <div className={styles.sessionsSection}>
          <CustomText
            color={colors.colorTextSecondary}
            fontSize={15}
            fontWeight={500}
          >
            {availableSessions} {availableSessions === 1 ? t('mentors.availableSession') : t('mentors.availableSessions')}
          </CustomText>
        </div>
      </div>
    </CustomCard>
  );
}
