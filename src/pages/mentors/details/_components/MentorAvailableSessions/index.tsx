import { Flex } from 'antd';
import { CustomCard } from 'src/components/cards';
import { CustomButton, CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './mentor_sessions.module.scss';
import { useTranslation } from 'react-i18next';
import { useScreenSize } from 'src/hooks/useScreenSize';

interface Props {
  availableSessions: { name: string; duration: number }[];
  handleBookPayment: () => void;
  noSessions: boolean;
}

export default function MentorAvailableSessions({
  availableSessions,
  handleBookPayment,
  noSessions,
}: Props) {
  const colors = useColors();
  const { t } = useTranslation();
  const { screenSize } = useScreenSize();

  const thiryMinutSession = availableSessions.filter(
    (session) => session.duration === 30
  );

  return (
    <CustomCard shadowed={false} bordered borderRadius={16}>
      <CustomText
        fontSize={themeFontSize.fontSizeTitle5}
        fontWeight={themeFontWeight.fontWeightSemibold}
        color={colors.colorTextBase}
        mb={4}
      >
        {noSessions === false
          ? t('mentors.noAvailable')
          : t('mentors.available')}
      </CustomText>
      <CustomText
        fontSize={themeFontSize.fontSizeTitle8}
        lineHeight={1.4}
        color={colors.colorTextSecondary}
        mb={24}
      >
        {t('mentors.bookingText')}
      </CustomText>

      <Flex vertical gap={8}>
        {thiryMinutSession.map(({ name, duration }) => (
          <CustomCard shadowed={false} bordered key={name} borderRadius={12}>
            <Flex
              align={screenSize < 560 ? 'center' : 'center'}
              justify={screenSize < 560 ? 'center' : 'space-between'}
              vertical={screenSize < 560}
              gap={screenSize < 560 ? 20 : 0}
            >
              <div className={styles.sessionNameTime}>
                <CustomText
                  color={colors.colorText}
                  fontWeight={themeFontWeight.fontWeightMedium}
                  mb={9}
                >
                  {name}
                </CustomText>
                {/* <div className={styles.session_time}>{duration} min</div> */}
                <div className={styles.session_time}>
                  {t('mentors.duration')}
                </div>
              </div>

              {noSessions && (
                <CustomButton
                  type="primary"
                  height={32}
                  width="max-content"
                  style={{ borderRadius: 8, padding: '0 16px' }}
                  onClick={() => handleBookPayment()}
                >
                  {t('btn.book')}
                </CustomButton>
              )}
            </Flex>
          </CustomCard>
        ))}
      </Flex>
    </CustomCard>
  );
}
