import { api } from 'src/app/api';
import MainTitleDescription from 'src/components/mainTitleDesc';
import useApi from 'src/hooks/useApi';
import EventCard from './_components/card';
import styles from './events.module.scss';
import { useTranslation } from 'react-i18next';
import { formatDateRange, getLatestCreatedImg } from 'src/utils';
import { MEDIA_TAGS, MediaSchema } from 'src/app/api/Api';
import { Flex, Tabs } from 'antd';
import { useState } from 'react';
import WorkshopCard from './_components/WorkshopCard';

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  media: MediaSchema[];
}

interface Workshop {
  id: string;
  title: string;
  summary: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxParticipants: number;
  currentParticipants: number;
  isActive: boolean;
  media: MediaSchema[];
  locations: any[];
}

export default function EventsPage() {
  const { response: eventsData } = useApi(() => api.camps.campsList());
  const { response: workshopsData } = useApi(() => api.camps.getActiveWorkshops());
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('events');

  // Categorize events based on dates
  const now = new Date();
  const currentEvents = eventsData?.data.data.filter((event: Event) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    return startDate <= now && endDate >= now;
  }) || [];

  const upcomingEvents = eventsData?.data.data.filter((event: Event) => {
    const startDate = new Date(event.startDate);
    return startDate > now;
  }) || [];

  const previousEvents = eventsData?.data.data.filter((event: Event) => {
    const endDate = new Date(event.endDate);
    return endDate < now;
  }) || [];

  const activeWorkshops = workshopsData?.data || [];

  // Combine all events into one array
  const allEvents = [...currentEvents, ...upcomingEvents, ...previousEvents];

  const tabItems = [
    {
      key: 'events',
      label: t('events.events'),
      children: (
        <div className={styles.cards_wrapper}>
          {allEvents.length > 0 ? (
            allEvents.map((event: Event, index: number) => {
              const eventStartDate = new Date(event.startDate);
              const isUpcoming = eventStartDate > now;
              
              return (
                <EventCard
                  key={index}
                  id={event.id}
                  name={event.title}
                  img={getLatestCreatedImg(event.media, MEDIA_TAGS.General)}
                  date={formatDateRange(event.startDate, event.endDate)}
                  isUpcoming={isUpcoming}
                />
              );
            })
          ) : (
            <div className={styles.no_events}>
              <p>{t('events.noEvents')}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'workshops',
      label: t('events.workshops'),
      children: (
        <div className={styles.cards_wrapper}>
          {activeWorkshops.length > 0 ? (
            activeWorkshops.map((workshop: any, index: number) => (
              <WorkshopCard
                key={index}
                id={workshop.id}
                title={workshop.title}
                summary={workshop.summary}
                startDate={workshop.startDate}
                endDate={workshop.endDate}
                deadline={workshop.deadline}
                maxParticipants={workshop.maxParticipants}
                currentParticipants={workshop.currentParticipants}
                img={getLatestCreatedImg(workshop.media, MEDIA_TAGS.General)}
                locations={workshop.locations}
              />
            ))
          ) : (
            <div className={styles.no_events}>
              <p>{t('events.noWorkshops')}</p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <main>
      <div className={'container ' + styles.container}>
        <MainTitleDescription
          title={t('events.allEvents')}
          description={t('events.description')}
          mb={24}
        />
        
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className={styles.events_tabs}
        />
      </div>
    </main>
  );
}