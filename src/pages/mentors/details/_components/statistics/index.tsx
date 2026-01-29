import { CustomCard } from 'src/components/cards';
import { CustomText } from 'src/components/common';
import { ClockIcon, Star2Icon, TickIcon } from 'src/components/icons';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './mentor_stats.module.scss';
import { useTypedSelector } from 'src/app/store';
import { useTranslation } from 'react-i18next';

interface Props {}

export default function MentorDetailsStatistics({}: Props) {
  const colors = useColors();
  const { lastMentorData: mentorData } = useTypedSelector(
    (state) => state.mentor
  );
  const { t } = useTranslation();
  const totalMinutes = mentorData?.sessionStats?.totalMunites;
  const rating = mentorData?.profile?.overallRating;
  const completedSessions = mentorData?.sessionStats?.totalCompletedSessions;

  return (
    <CustomCard bordered shadowed={false} className={styles.card}>
      <CustomText
        fontSize={themeFontSize.fontSizeTitle5}
        fontWeight={themeFontWeight.fontWeightSemibold}
        color={colors.colorTextBase}
        mb={24}
      >
        {t('mentors.stats')}
      </CustomText>
      <ul className={styles.stats_ul}>
        {/* <li>
          <div className={styles.icon_wrapper}>
            <Star2Icon />
          </div>
          <div className={styles.num_wrapper}>
            <CustomText
              fontWeight={themeFontWeight.fontWeightMedium}
              color={colors.colorTextBase}
            >
              {rating}
            </CustomText>
            <CustomText
              color={colors.colorTextSecondary}
              fontSize={themeFontSize.fontSizeTitle8}
              lineHeight="19.6px"
            >
              {t('mentors.rating')}
            </CustomText>
          </div>
        </li> */}
        <li>
          <div className={styles.icon_wrapper}>
            <ClockIcon width={24} height={24} />
          </div>
          <div className={styles.num_wrapper}>
            <CustomText
              fontWeight={themeFontWeight.fontWeightMedium}
              color={colors.colorTextBase}
            >
              {totalMinutes?.toLocaleString()} {t('mentors.mins')}
            </CustomText>
            <CustomText
              color={colors.colorTextSecondary}
              fontSize={themeFontSize.fontSizeTitle8}
              lineHeight="19.6px"
            >
              {t('mentors.totalTime')}
            </CustomText>
          </div>
        </li>
        <li>
          <div
            className={styles.icon_wrapper}
            style={{ background: colors.green1 }}
          >
            <TickIcon width={24} height={24} color={colors.green1} />
          </div>
          <div className={styles.num_wrapper}>
            <CustomText
              fontWeight={themeFontWeight.fontWeightMedium}
              color={colors.colorTextBase}
            >
              {completedSessions}
            </CustomText>
            <CustomText
              color={colors.colorTextSecondary}
              fontSize={themeFontSize.fontSizeTitle8}
              lineHeight="19.6px"
            >
              {t('mentors.completedSessions')}
            </CustomText>
          </div>
        </li>
      </ul>
    </CustomCard>
  );
}
