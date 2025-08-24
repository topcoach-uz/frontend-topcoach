import { TabsProps } from 'antd';
import { useState } from 'react';
import { useTypedSelector } from 'src/app/store';
import { CustomCard } from 'src/components/cards';
import { CustomTabs, CustomText } from 'src/components/common';
import EmptyCardComp from 'src/components/emptyCard';
import useColors from 'src/hooks/useColors';
import UpcomingCard from './_components/upcamingcards';
import styles from './bookings.module.scss';
import { SessionTypeEnum } from 'src/app/api/Api';
import { useTranslation } from 'react-i18next';

export default function BookingsSection() {
  const colors = useColors();
  const { t } = useTranslation();

  const { profile: meData } = useTypedSelector((state) => state.auth);

  const joinedSessions = meData?.joinedSessions;
  
  // Debug logging for mentee sessions
  console.log('Mentee joinedSessions:', joinedSessions);
  console.log('Current time:', new Date());
  
  const upcomingSessions = joinedSessions?.filter(
    (session) => new Date(session.date) > new Date() && !session.cancelStatus
  );
  const pastSessions = joinedSessions?.filter((session) => {
    // Calculate session duration based on type
    const sessionDuration = session.type === SessionTypeEnum.Individual30M ? 30 : 60; // minutes
    const sessionEndTime = new Date(session.date).getTime() + sessionDuration * 60 * 1000; // Add duration to session start time
    const isPast = new Date().getTime() > sessionEndTime;
    
    // Debug logging for past sessions filtering
    console.log(`Session ${session.id}:`, {
      date: session.date,
      type: session.type,
      duration: sessionDuration,
      sessionEndTime: new Date(sessionEndTime),
      isPast,
      mentor: session.mentor?.id,
      participants: session.participants?.length || 0
    });
    
    return isPast; // Check if the current time is past the session's end time
  });
  const cancelledSessions = joinedSessions?.filter(
    (session) => session.cancelStatus !== null && session.cancelStatus.id
  );

  const [activeTab, setActiveTab] = useState('1');
  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: (
        <CustomText fontSize={14} fontWeight={400} color={colors.colorPrimary}>
          {t('home.upcoming')}
        </CustomText>
      ),
      children:
        upcomingSessions && upcomingSessions?.length > 0 ? (
          <div className={styles.upcoming}>
            {upcomingSessions?.map((session, index) => (
              <UpcomingCard
                key={index}
                duration={
                  session.type == SessionTypeEnum.Individual30M ? 30 : 60
                }
                // cancelCheck={false}
                reportCheck={false}
                rateCheck={false}
                {...session}
              />
            ))}
          </div>
        ) : (
          <EmptyCardComp
            title={t('home.noUpcoming')}
            description={t('home.noUpcomingDesc')}
          />
        ),
    },
    {
      key: '2',
      label: (
        <CustomText fontSize={14} fontWeight={400} color={colors.colorPrimary}>
          {t('home.past')}
        </CustomText>
      ),
      children:
        pastSessions && pastSessions?.length > 0 ? (
          <div className={styles.upcoming}>
            {pastSessions?.map((session, index) => (
              <UpcomingCard
                duration={
                  session.type == SessionTypeEnum.Individual30M ? 30 : 60
                }
                // cancelCheck={false}
                key={index}
                {...session}
              />
            ))}
          </div>
        ) : (
          <EmptyCardComp
            title={t('home.noPast')}
            description={t('home.noPastDesc')}
          />
        ),
    },
    {
      key: '3',
      label: (
        <CustomText fontSize={14} fontWeight={400} color={colors.colorPrimary}>
          {t('home.canceled')}
        </CustomText>
      ),
      children:
        cancelledSessions && cancelledSessions?.length > 0 ? (
          <div className={styles.upcoming}>
            {cancelledSessions?.map((session, index) => (
              <UpcomingCard
                cancelCheck={false}
                rateCheck={false}
                key={index}
                {...session}
              />
            ))}
          </div>
        ) : (
          <EmptyCardComp
            title={t('home.noCanceled')}
            description={t('home.noCanceledDesc')}
          />
        ),
    },
  ];

  return (
    <section className={styles.bookings_section}>
      <div className={'container ' + styles.container}>
        <CustomCard shadowed={false} bgColor={colors.colorBgContainer}>
          <CustomText
            fontSize={32}
            fontWeight={600}
            mb={4}
            color={colors.colorTextBase}
          >
            {t('home.upcomingbooking')}
          </CustomText>
          <CustomText
            fontSize={16}
            fontWeight={400}
            mb={24}
            color={colors.colorTextSecondary}
          >
            {t('home.upcomingDesc')}
          </CustomText>
          <CustomCard padding={24} borderRadius={24}>
            <CustomTabs
              activeKey={activeTab}
              items={tabItems}
              onChange={(key) => setActiveTab(key)}
            />
          </CustomCard>
        </CustomCard>
      </div>
    </section>
  );
}
