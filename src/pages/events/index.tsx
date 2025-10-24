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
import UpcomingEventsSection from './_components/UpcomingEventsSection';

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
  const allEventsData = eventsData?.data.data || [];
  const allWorkshopsData = workshopsData?.data || [];

  // Separate events and workshops
  const regularEvents = allEventsData.filter((event: any) => 
    event.type !== 'workshop' && event.type !== 'Workshop'
  );

  const workshops = allEventsData.filter((event: any) => 
    event.type === 'workshop' || event.type === 'Workshop'
  );

  // Get upcoming events and workshops (for the upcoming section)
  const upcomingEvents = regularEvents.filter((event: Event) => {
    const startDate = new Date(event.startDate);
    return startDate > now;
  });

  const upcomingWorkshops = workshops.filter((workshop: any) => {
    const startDate = new Date(workshop.startDate);
    return startDate > now;
  });

  // Get past events and workshops (for the tabs)
  const currentEvents = regularEvents.filter((event: Event) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    return startDate <= now && endDate >= now;
  });

  const previousEvents = regularEvents.filter((event: Event) => {
    const endDate = new Date(event.endDate);
    return endDate < now;
  });

  const pastWorkshops = workshops.filter((workshop: any) => {
    const endDate = new Date(workshop.endDate);
    return endDate < now;
  });

  // Combine past events for the events tab
  const allPastEvents = [...currentEvents, ...previousEvents];
  const allPastWorkshops = [...pastWorkshops];

  const tabItems = [
    {
      key: 'events',
      label: t('events.events'),
      children: (
        <div className={styles.cards_wrapper}>
          {allPastEvents.length > 0 ? (
            allPastEvents.map((event: Event, index: number) => {
              const eventStartDate = new Date(event.startDate);
              const isUpcoming = eventStartDate > now;
              
              return (
                <EventCard
                  key={index}
                  id={event.id}
                  name={event.title}
                  img={getLatestCreatedImg(event.media, MEDIA_TAGS.General) || ''}
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
          {allPastWorkshops.length > 0 ? (
            allPastWorkshops.map((workshop: any, index: number) => (
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
                img={getLatestCreatedImg(workshop.media, MEDIA_TAGS.General) || ''}
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
        
        {/* Upcoming Events and Workshops Section */}
        <UpcomingEventsSection 
          upcomingEvents={upcomingEvents}
          upcomingWorkshops={upcomingWorkshops}
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