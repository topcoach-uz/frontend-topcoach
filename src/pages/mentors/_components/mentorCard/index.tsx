import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { CustomCard } from 'src/components/cards';
import { CustomText } from 'src/components/common';
import styles from './mentorCard.module.scss';
import { useTranslation } from 'react-i18next';
import { getUniversityFlag } from 'src/utils/countryFlags';
import { isMasterProgramMentorEmail } from './masterProgramMentors';

function initialsFromName(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function hashHue(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}

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
  /** Shorter card (e.g. hub / embedded grids): smaller image area, no forced min-height */
  compact?: boolean;
  availableSessions?: number;
  isGiveaway?: boolean;
  giveawaySessionsCount?: number;
  email?: string;
  /** Index in the grid — the first ~6 cards are above-the-fold and should load eagerly. */
  cardIndex?: number;
}

function MentorCard({
  name,
  imgSrc,
  major,
  university,
  id,
  level,
  classname,
  compact = false,
  isGiveaway = false,
  giveawaySessionsCount = 0,
  email,
  cardIndex = 99,
}: MentorCardProps) {
  const { colors } = useTypedSelector((state) => state.layout);
  const navigate = useNavigate();
  const isMasterProgramMentor = isMasterProgramMentorEmail(email);

  const handleCardClick = () => {
    navigate(`/mentors/${id}`);
  };

  const { t } = useTranslation();
  const [imgFailed, setImgFailed] = useState(false);

  const showImage = Boolean(imgSrc) && !imgFailed;
  const avatarHue = hashHue(id || email || name || 'mentor');
  const avatarBg = `linear-gradient(135deg, hsl(${avatarHue}, 70%, 55%) 0%, hsl(${(avatarHue + 35) % 360}, 70%, 45%) 100%)`;

  return (
    <CustomCard
      padding={0}
      shadowed={false}
      className={`${styles.card}${compact ? ` ${styles.cardCompact}` : ''}${classname ? ` ${classname}` : ''}`}
      onClick={handleCardClick}
      bordered
    >
      <div className={styles.imgContainer}>
        <div className={styles.img}>
          {showImage ? (
            <img
              src={imgSrc}
              alt={name ? `${name} — mentor profile` : 'mentor profile'}
              width={compact ? 200 : 320}
              height={compact ? 200 : 320}
              loading={cardIndex < 6 ? 'eager' : 'lazy'}
              decoding="async"
              // @ts-expect-error — fetchpriority is a valid HTML attr React has not typed yet.
              fetchpriority={cardIndex < 3 ? 'high' : 'auto'}
              onError={() => setImgFailed(true)}
            />
          ) : (
            // When the image record is missing or returns 404, render a
            // deterministic initials avatar instead of the broken-image icon.
            // The hue is derived from the mentor id, so each mentor gets a
            // stable color across renders.
            <div
              className={styles.imgFallback}
              style={{ background: avatarBg }}
              aria-label={name ? `${name} initials placeholder` : 'mentor placeholder'}
            >
              {initialsFromName(name)}
            </div>
          )}
        </div>
        
        {/* Coach level badge */}
        <CustomCard
          bgColor={
            isMasterProgramMentor
              ? '#0D9488' // Teal for Master Program (distinct from UzCombinator purple)
              : level === 'expert'
                ? '#FF8C42' // Vibrant orange for expert
                : level === 'senior'
                  ? '#4A90E2' // Professional blue for senior
                  : level === 'junior'
                    ? '#7ED321' // Fresh green for junior
                    : level === 'uzcombinator'
                      ? '#8B5CF6' // Purple for UzCombinator
                      : '#F4D03F' // Yellowish for probono
          }
          className={styles.coach}
        >
          <CustomText
            fontSize={12}
            fontWeight={500}
            color={isMasterProgramMentor ? '#ffffff' : level === 'probono' ? '#333333' : '#ffffff'}
            style={{ 
              letterSpacing: '0.2px'
            }}
          >
            {isMasterProgramMentor ? 'Master Program Mentor' : level === 'uzcombinator' ? 'UzCombinator' : level} Coach
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
            fontSize={compact ? 15 : 18}
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

        {/* Pricing based on mentor level - hidden for UzCombinator mentors (rate, contact for pricing) */}
        <div className={styles.sessionsSection}>
          {level !== 'uzcombinator' && (
            <>
              <CustomText
                color={colors.colorTextSecondary}
                fontSize={13}
                fontWeight={500}
                style={{ marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                {isMasterProgramMentor
                  ? 'Master Program'
                  : level === 'probono'
                    ? t('mentors.complimentarySession') || 'Complimentary'
                    : t('mentors.rate') || 'Rate'}
              </CustomText>
              <CustomText
                color={colors.colorText}
                fontSize={isMasterProgramMentor ? 14 : 16}
                fontWeight={600}
                style={isMasterProgramMentor ? { lineHeight: 1.35 } : undefined}
              >
                {isMasterProgramMentor
                  ? "Currently mentoring in Master's program."
                  : level === 'expert'
                    ? '$50 – $100 / session'
                    : level === 'senior'
                      ? '$25 – $50 / session'
                      : level === 'junior'
                        ? '$12.50 – $25 / session'
                        : level === 'probono'
                          ? t('mentors.freeSession') || 'Free / Pro-bono'
                          : t('mentors.contactForPricing') || 'Contact for pricing'}
              </CustomText>
            </>
          )}
          {isGiveaway && (
            <CustomText
              color={giveawaySessionsCount > 0 ? "#FF6B35" : "#999999"}
              fontSize={13}
              fontWeight={600}
              style={{ marginTop: '8px' }}
            >
              🎁 {giveawaySessionsCount} giveaway {giveawaySessionsCount === 1 ? 'session' : 'sessions'}
            </CustomText>
          )}
        </div>
      </div>
    </CustomCard>
  );
}

export default memo(MentorCard);
