import { useTranslation } from 'react-i18next';
import { CustomButton, CustomText } from 'src/components/common';
import { ArrowRight, ArrowTopRight } from 'src/components/icons';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import { useScreenSize } from 'src/hooks/useScreenSize';
import styles from './events.module.scss';
import { useNavigate } from 'react-router-dom';
import useApi from 'src/hooks/useApi';
import { api } from 'src/app/api';
import { useMemo } from 'react';
import { formatDateRange } from 'src/utils';

export default function LandingEventsSection() {
  const colors = useColors();
  const navigate = useNavigate();
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();
  const { response: camps } = useApi(() => api.camps.campsList());

  // Get the most recent 3 camps sorted by start date
  const recentCamps = useMemo(() => {
    if (!camps?.data?.data) return [];

    return [...camps.data.data]
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )
      .slice(0, 3);
  }, [camps?.data?.data]);

  return (
    <section>
      <div className={'container ' + styles.container}>
        <CustomText
          fontSize={screenSize < 768 ? 32 : themeFontSize.fontSizeTitle2}
          fontWeight={themeFontWeight.fontWeightSemibold}
          color={colors.colorTextBase}
          mt={96}
          mb={8}
        >
          {t('landing.eventsPrograms')}
        </CustomText>
        <CustomText
          fontSize={themeFontSize.fontSizeTitle5}
          color={colors.colorTextDescription}
          mb={32}
        >
          {t('landing.successTogether')}
        </CustomText>{' '}
        <ul className={styles.event_list}>
          {recentCamps?.map((camp) => (
            <li
              key={camp.id}
              className={styles.card}
              onClick={() => navigate(`/events/${camp.id}`)}
            >
              <div className={styles.event_image_wrapper}>
                <img
                  src={camp.media?.[0]?.url || '/img/event_1.png'}
                  alt={camp.title}
                />
              </div>{' '}
              <CustomText
                fontSize={themeFontSize.fontSizeTitle8}
                fontWeight={themeFontWeight.fontWeightSemibold}
                color={colors.colorSecondary}
                mt={20}
                mb={8}
              >
                {formatDateRange(camp.startDate, camp.endDate)}
              </CustomText>
              <div className={styles.name_button_wrapper}>
                <CustomText
                  fontSize={themeFontSize.fontSizeTitle4}
                  fontWeight={themeFontWeight.fontWeightSemibold}
                  color={colors.colorTextBase}
                >
                  {camp.title}
                </CustomText>
                <ArrowTopRight color={colors.colorTextBase} />
              </div>
            </li>
          ))}
        </ul>
        <CustomButton
          className={styles.see_all_button}
          onClick={() => navigate('/events')}
          type="primary"
          mb={96}
          ml="auto"
          mr="auto"
        >
          {t('landing.viewAll')} <ArrowRight />
        </CustomButton>
      </div>
    </section>
  );
}
