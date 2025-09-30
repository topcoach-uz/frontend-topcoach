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
  giveawaySessionsCount?: number;
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
  giveawaySessionsCount = 0,
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
          {imgSrc ? (
            <img 
              src={imgSrc} 
              alt="mentor profile" 
              loading="lazy"
              onLoad={(e) => {
                // Fade in effect when image loads
                e.currentTarget.style.opacity = '1';
              }}
              style={{ 
                opacity: 0, 
                transition: 'opacity 0.3s ease-in-out' 
              }}
            />
          ) : (
            <Skeleton.Image active />
          )}
        </div>
        
        {/* Coach level badge */}
        <CustomCard
          bgColor={
            level === 'expert'
              ? '#FF8C42' // Vibrant orange for expert
              : level === 'senior'
                ? '#4A90E2' // Professional blue for senior
                : level === 'junior'
                  ? '#7ED321' // Fresh green for junior
                  : '#F4D03F' // Yellowish for probono
          }
          className={styles.coach}
        >
          <CustomText
            fontSize={12}
            fontWeight={500}
            color={level === 'probono' ? "#333333" : "#ffffff"}
            style={{ 
              letterSpacing: '0.2px'
            }}
          >
            {level} Coach
          </CustomText>
        </CustomCard>

        {/* Giveaway badge */}
        {isGiveaway && (
          <CustomCard
            bgColor="#FF8C42"
            className={styles.giveaway}
          >
            <CustomText
              fontSize={10}
              fontWeight={500}
              color="#ffffff"
              style={{ 
                letterSpacing: '0.2px'
              }}
            >
              Giveaway
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
          {isGiveaway && (
            <CustomText
              color={giveawaySessionsCount > 0 ? "#FF6B35" : "#999999"}
              fontSize={13}
              fontWeight={600}
              style={{ marginTop: '4px' }}
            >
              🎁 {giveawaySessionsCount} giveaway {giveawaySessionsCount === 1 ? 'session' : 'sessions'}
            </CustomText>
          )}
        </div>
      </div>
    </CustomCard>
  );
}