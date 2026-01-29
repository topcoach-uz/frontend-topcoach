import { Flex, message } from 'antd';
import { CustomCard } from 'src/components/cards';
import { CustomButton, CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './mentor_sessions.module.scss';
import { useTranslation } from 'react-i18next';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { useState } from 'react';
import { useTypedSelector } from 'src/app/store';
import RequestSessionModal from '../RequestSessionModal';

interface Props {
  availableSessions: { name: string; duration: number }[];
  handleBookPayment: () => void;
  noSessions: boolean;
  mentorName: string;
  mentorId: string;
}

export default function MentorAvailableSessions({
  availableSessions,
  handleBookPayment,
  noSessions,
  mentorName,
  mentorId,
}: Props) {
  const colors = useColors();
  const { t } = useTranslation();
  const { screenSize } = useScreenSize();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);

  const thiryMinutSession = availableSessions.filter(
    (session) => session.duration === 30
  );

  const handleRequestSession = () => {
    if (!isAuthenticated) {
      message.warning(t('mentors.requestSession.authRequired'));
      // Store the current mentor page URL for redirect after login
      const currentUrl = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', currentUrl);
      window.location.href = '/auth/signin';
      return;
    }
    setRequestModalOpen(true);
  };

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

      {/* Request Session Button */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
        <CustomText
          fontSize={themeFontSize.fontSizeTitle8}
          color={colors.colorTextSecondary}
          style={{ marginBottom: '12px', display: 'block' }}
        >
          {t('mentors.requestSession.helpText')}
        </CustomText>
        
        <CustomButton
          type="primary"
          height={40}
          width="100%"
          style={{ 
            borderRadius: 8,
            backgroundColor: '#8b0000',
            borderColor: '#8b0000',
            color: 'white',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#6b0000';
            e.currentTarget.style.borderColor = '#6b0000';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#8b0000';
            e.currentTarget.style.borderColor = '#8b0000';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onClick={handleRequestSession}
        >
          {t('mentors.requestSession.button')}
        </CustomButton>
      </div>

      <RequestSessionModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        mentorName={mentorName}
        mentorId={mentorId}
      />
    </CustomCard>
  );
}
