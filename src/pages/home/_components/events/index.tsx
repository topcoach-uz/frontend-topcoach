import { TabsProps } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApplicationStatusEnum } from 'src/app/api/Api';
import { useTypedSelector } from 'src/app/store';
import { CustomCard } from 'src/components/cards';
import { CustomTabs, CustomText } from 'src/components/common';
import ConfettiCelebration from 'src/components/confetti';
import EmptyCardComp from 'src/components/emptyCard';
import { useConfettiCelebration } from 'src/hooks/useConfettiCelebration';
import useMentee from '../../mentee/useMentee';
import EventCardComp from './_component';
import styles from './events.module.scss';

interface MenteeEvent {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  fullName: string;
  birthDate: string;
  jshshir: string;
  passportNumber: string;
  passportIssuingAuthority: string;
  region: string;
  parentFullName: string;
  parentPhoneNumber: string;
  parentEmail: string | null;
  emergencyContact: string;
  country: string;
  email: string | null;
  status: ApplicationStatusEnum;
  eventForm: {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    type: string;
    event: {
      id: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
      title: string;
      summary: string;
      startDate: string;
      endDate: string;
      deadline: string;
      price: number;
      applicationStartDate: string;
      content: unknown;
    };
    additionalForms: unknown[];
    essays: unknown[];
  };
}

export default function EventsSection() {
  const { colors } = useTypedSelector((state) => state.layout);
  const [activeTab, setActiveTab] = useState('1');
  const { t } = useTranslation();
  const { menteeEventData, isLoading } = useMentee(); // Convert to proper format for confetti hook
  const allEvents = Array.isArray(menteeEventData) ? menteeEventData : [];
  const { showConfetti, handleConfettiComplete, setTargetRef } =
    useConfettiCelebration(allEvents);

  if (isLoading) {
    return <div>Loading events...</div>;
  }

  const pendingEvents = allEvents.filter(
    (event) => event.status === ApplicationStatusEnum.Pending
  );
  const acceptedEvents = allEvents.filter(
    (event) => event.status === ApplicationStatusEnum.Successful
  );
  const rejectedEvents = allEvents.filter(
    (event) => event.status === ApplicationStatusEnum.Rejected
  );

  const renderEventCards = (events: MenteeEvent[]) => {
    return (
      <div className={styles.eventCardCenter}>
        {events.length > 0 ? (
          <div className={styles.flexCard}>
            {events.map((item) => (
              <EventCardComp
                key={item.id}
                img={'/img/upcoming_event/event_mobile.png'}
                status={item.status}
                statusText={
                  item.status === ApplicationStatusEnum.Pending
                    ? t('home.reviewing')
                    : item.status === ApplicationStatusEnum.Successful
                      ? t('home.accepted')
                      : t('home.rejected')
                }
                title="Top 100 Uni Camp 2025"
                date="25.05.2025"
              />
            ))}
          </div>
        ) : (
          <EmptyCardComp
            title={t('home.noEvents')}
            description={t('home.noEventsDesc')}
          />
        )}
      </div>
    );
  };

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: (
        <CustomText fontSize={14} color={colors.colorPrimary}>
          {t('home.all')}
        </CustomText>
      ),
      children: (
        <div
          className={styles.eventCard}
          ref={(el) => {
            // Only set the ref if there are accepted events
            if (acceptedEvents.length > 0) {
              setTargetRef(el);
            }
          }}
        >
          {/* {allEvents ? (
            allEvents.map((item, index) => (
              <EventCardComp
                key={index + item.id}
                img={item.img}
                status={item.status}
                title={item.name}
                date={item.gradDate}
              />
            ))
          ) : (
            <EmptyCardComp
              title={t('home.noEvents')}
              description={t('home.noEventsDesc')}
            />
          )} */}
          {renderEventCards(allEvents)}
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <CustomText fontSize={14} color={colors.colorPrimary}>
          {t('home.reviewing')}
        </CustomText>
      ),
      children: (
        <div className={styles.eventCard}>
          {/* {menteeEventData && menteeEventData.status === 'pending' ? (
            pendingEventsData.map((item, index) => (
              <EventCardComp
                key={index + item.id}
                img={item.img}
                status={item.status}
                title={item.name}
                date={item.underData}
              />
            ))
          ) : (
            <EmptyCardComp
              title={t('home.noReviewing')}
              description={t('home.noReviewingDesc')}
            />
          )} */}
          {renderEventCards(pendingEvents)}
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <CustomText fontSize={14} color={colors.colorPrimary}>
          {t('home.accepted')}
        </CustomText>
      ),
      children: (
        <div className={styles.eventCard}>
          {/* {menteeEventData?.status === 'accepted' ? (
            acceptedEventsData.map((item, index) => (
              <EventCardComp
                key={index + item.id}
                img={item.img}
                status={item.status}
                title={item.name}
                date={item.gradDate}
              />
            ))
          ) : (
            <EmptyCardComp
              title={t('home.noAccepted')}
              description={t('home.noAcceptedDesc')}
            />
          )} */}
          {renderEventCards(acceptedEvents)}
        </div>
      ),
    },
    {
      key: '4',
      label: (
        <CustomText fontSize={14} color={colors.colorPrimary}>
          {t('home.rejected')}
        </CustomText>
      ),
      children: (
        <div className={styles.eventCard}>
          {/* {menteeEventData?.status === 'rejected' ? (
            rejectedEventsData.map((item, index) => (
              <EventCardComp
                key={index + item.id}
                img={item.img}
                status={item.status}
                title={item.name}
                date={item.gradDate}
              />
            ))
          ) : (
            <EmptyCardComp
              title={t('home.noRejected')}
              description={t('home.noRejectedDesc')}
            />
          )} */}
          {renderEventCards(rejectedEvents)}
        </div>
      ),
    },
  ];
  return (
    <>
      <ConfettiCelebration
        show={showConfetti}
        onComplete={handleConfettiComplete}
      />
      <div className={'container ' + styles.events}>
        <CustomText fontSize={32} fontWeight={600} color={colors.colorTextBase}>
          {t('home.eventTitle')}
        </CustomText>
        <CustomText
          fontSize={16}
          color={colors.colorTextSecondary}
          mt={4}
          mb={24}
        >
          {t('home.eventSubtitle')}
        </CustomText>
        <CustomCard
          bgColor={colors.colorBgContainer}
          mb={40}
          shadowed
          borderRadius={24}
          padding={24}
        >
          <CustomTabs
            accessKey={activeTab}
            items={tabItems}
            onChange={(key) => setActiveTab(key)}
          />
        </CustomCard>
      </div>
    </>
  );
}
