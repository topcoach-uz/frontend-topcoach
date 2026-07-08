import { TabsProps } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useEffect, useState } from 'react';
import { SessionsSchema, SessionTypeEnum } from 'src/app/api/Api';
import { useGetMySessionsQuery } from 'src/app/services/sessions';
import { CustomText } from 'src/components/common';
import EmptyCardComp from 'src/components/emptyCard';
import { CardSkeleton } from 'src/components/loading';
import useColors from 'src/hooks/useColors';
import UpcomingCard from '../../_components/bookings/_components/upcamingcards';
import styles from './bookings.module.scss';
import { useTranslation } from 'react-i18next';
dayjs.extend(utc);

export default function useBookings() {
  const colors = useColors();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('1');
  const handleTabsChange = (key: string) => setActiveTab(key);

  const [allSessions, setAllSessions] = useState<SessionsSchema[]>([]);
  const [aviableSessions, setAviableSessions] = useState<SessionsSchema[]>([]);

  // -------------------- old code --------------------
  const {
    data: response,
    error,
    isError,
    isLoading,
    refetch,
  } = useGetMySessionsQuery();

  if (isError) {
    console.log(error);
  }

  const data = ((response as any)?.data ?? []) as SessionsSchema[];

  // const currentDay = dayjs.utc().subtract(60, 'minute');
  const currentDay = dayjs.utc();

  // Aviable sessions
  const aviableSessionsData = aviableSessions.filter((item) => {
    const aviableSessionDateTime = dayjs.utc(item.date);

    return aviableSessionDateTime.isAfter(currentDay);
  });

  // Past data
  const pastSessions = aviableSessions.filter((session) => {
    const sessionDateTime = dayjs.utc(session.date);

    return sessionDateTime.isBefore(currentDay);
  });

  // formatted data update based on the response – show all sessions in Booked/Available/Past/Canceled
  useEffect(() => {
    const updatedData = ((response as any)?.data ?? []) as SessionsSchema[];

    const formatted = updatedData.map((session) => ({
      ...session,
      time: dayjs.utc(session.date).format('hh:mm A'),
    }));

    setAllSessions(formatted);
    setAviableSessions(formatted);
  }, [response]);

  // Bookings
  const correctDateBooking = aviableSessions.filter((item) => {
    // Check if session is booked and not canceled
    const isBooked =
      item.cancelStatus === null &&
      item.participants &&
      item.participants.length > 0;

    // Check if session time + duration hasn't passed yet
    const sessionTime = dayjs.utc(item.date);
    const sessionDuration =
      item.type === SessionTypeEnum.Individual30M ? 30 : 60;
    const sessionEndTime = sessionTime.add(sessionDuration, 'minute');
    const sessionNotExpired = sessionEndTime.isAfter(currentDay);

    return isBooked && sessionNotExpired;
  });

  // Available sessions
  const correctDateAviable = aviableSessionsData.filter((item) => {
    // Check if session has no participants and is not canceled
    const noParticipantsAndNotCanceled =
      !item.participants?.length && !item.cancelStatus?.id;

    // Check if session time + duration hasn't passed yet
    const sessionTime = dayjs.utc(item.date);
    const sessionDuration =
      item.type === SessionTypeEnum.Individual30M ? 30 : 60;
    const sessionEndTime = sessionTime.add(sessionDuration, 'minute');
    const sessionNotExpired = sessionEndTime.isAfter(currentDay);

    return noParticipantsAndNotCanceled && sessionNotExpired;
  });

  const correctDatePast = pastSessions.filter((item) =>
    dayjs(item.date).isBefore()
  );

  const cancelSessionData = data.filter((item) => item.cancelStatus);

  // Never show the "No … sessions" empty cards while the sessions query is
  // still in flight — hold each tab body on skeleton cards until it settles.
  const tabLoading = (
    <div className={styles.upcoming}>
      <CardSkeleton count={2} showImage={false} />
    </div>
  );

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: (
        <CustomText fontSize={14} fontWeight={400} color={colors.colorPrimary}>
          {t('homeMentor.booked')}
        </CustomText>
      ),
      children: isLoading ? (
        tabLoading
      ) : correctDateBooking.length ? (
        <div className={styles.upcoming}>
          {correctDateBooking.map((item) => (
            <UpcomingCard
              key={item.id}
              duration={item.type == SessionTypeEnum.Individual30M ? 30 : 60}
              reportCheck={false}
              detailCheck={true}
              {...item}
            />
          ))}
        </div>
      ) : (
        <EmptyCardComp
          title={t('homeMentor.noUpcomingSessions')}
          description={t('homeMentor.noUpcomingSessionsDesc')}
        />
      ),
    },
    {
      key: '2',
      label: (
        <CustomText fontSize={14} fontWeight={400} color={colors.colorPrimary}>
          {t('homeMentor.available')}
        </CustomText>
      ),
      children: isLoading ? (
        tabLoading
      ) : correctDateAviable.length ? (
        <div className={styles.upcoming}>
          {correctDateAviable.map((item) => (
            <UpcomingCard
              key={item.id}
              duration={item.type == SessionTypeEnum.Individual30M ? 30 : 60}
              reportCheck={false}
              {...item}
            />
          ))}
        </div>
      ) : (
        <EmptyCardComp
          title={t('homeMentor.noAvailableSessions')}
          description={t('homeMentor.noAvailableSessionsDesc')}
        />
      ),
    },
    {
      key: '3',
      label: (
        <CustomText fontSize={14} fontWeight={400} color={colors.colorPrimary}>
          {t('homeMentor.past')}
        </CustomText>
      ),
      children: isLoading ? (
        tabLoading
      ) : pastSessions.length ? (
        <div className={styles.upcoming}>
          {correctDatePast.map((item) => (
            <UpcomingCard
              key={item.id}
              duration={item.type == SessionTypeEnum.Individual30M ? 30 : 60}
              cancelCheck={false}
              {...item}
            />
          ))}
        </div>
      ) : (
        <EmptyCardComp
          title={t('homeMentor.noPastSessions')}
          description={t('homeMentor.noPastSessionsDesc')}
        />
      ),
    },
    {
      key: '4',
      label: (
        <CustomText fontSize={14} fontWeight={400} color={colors.colorPrimary}>
          {t('homeMentor.canceled')}
        </CustomText>
      ),
      children: isLoading ? (
        tabLoading
      ) : cancelSessionData.length ? (
        <div className={styles.upcoming}>
          {cancelSessionData.map((item) => (
            <UpcomingCard
              key={item.id}
              duration={item.type === SessionTypeEnum.Individual30M ? 30 : 60}
              reportCheck={false}
              cancelCheck={false}
              dropdownVisible={false}
              {...item}
            />
          ))}
        </div>
      ) : (
        <EmptyCardComp
          title={t('homeMentor.noCanceledSessions')}
          description={t('homeMentor.noCanceledSessionsDesc')}
        />
      ),
    },
  ];

  return {
    activeTab,
    tabItems,
    isLoading,
    handleTabsChange,
    refetch,
  };
}
