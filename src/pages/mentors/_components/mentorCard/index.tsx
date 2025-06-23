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
    >
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
      <div className={styles.img}>
        {imgSrc ? <img src={imgSrc} alt="img error" /> : <Skeleton.Image />}
      </div>
      <CustomText
        fontSize={20}
        fontWeight={600}
        color={colors.colorTextBase}
        mt={8}
        mb={4}
      >
        {name}
      </CustomText>
      <CustomText
        fontSize={16}
        fontWeight={400}
        color={colors.colorTextDescription}
        lineHeight="24px"
        className={styles.university}
      >
        {university}
      </CustomText>
      <div className={styles.rates}>
        {/* <MentorStarIcon />
        <CustomText
          color={colors.colorTextSecondary}
          pr={12}
          borderRight={`1px solid ${colors.colorBorder}`}
          ml={4}
        >
          {rating}
        </CustomText> */}
        <CustomText
          //  ml={12}
          color={colors.colorTextSecondary}
        >
          {sessionNumber}{' '}
          {sessionNumber < 2 ? t('mentors.session') : t('mentors.sessions')}
        </CustomText>
      </div>
    </CustomCard>
  );
}
