import { useEffect } from 'react';
import { api } from 'src/app/api';
import MainTitleDescription from 'src/components/mainTitleDesc';
import useApi from 'src/hooks/useApi';
import EventCard from './_components/card';
import styles from './events.module.scss';
import { useTranslation } from 'react-i18next';
import { formatDateRange, getLatestCreatedImg } from 'src/utils';
import { MEDIA_TAGS, MediaSchema } from 'src/app/api/Api';
import UpcomingEventsSection from './_components/UpcomingEventsSection';

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  deadline?: string;
  media: MediaSchema[];
}

export default function EventsPage() {
  const { response: eventsData } = useApi(() => api.camps.campsList());
  const { response: workshopsData } = useApi(() => api.camps.getActiveWorkshops());
  const { t } = useTranslation();

  // Set page title in browser header
  useEffect(() => {
    document.title = 'Workshops - Top Coach';
  }, []);

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

  // Get all events and workshops that have passed deadline
  // For workshops: check if deadline has passed
  // For events: check if endDate has passed
  const pastItems = [
    ...regularEvents.filter((event: Event) => {
      const endDate = new Date(event.endDate);
      return endDate < now;
    }),
    ...workshops.filter((workshop: any) => {
      // Check if deadline has passed, or if no deadline, check endDate
      if (workshop.deadline) {
        const deadline = new Date(workshop.deadline);
        return deadline < now;
      } else {
        const endDate = new Date(workshop.endDate);
        return endDate < now;
      }
    }),
  ];

  // Sort by endDate or deadline (most recent first)
  pastItems.sort((a: any, b: any) => {
    const dateA = a.deadline ? new Date(a.deadline) : new Date(a.endDate);
    const dateB = b.deadline ? new Date(b.deadline) : new Date(b.endDate);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <main>
      <div className={'container ' + styles.container}>
        <MainTitleDescription
          title={t('events.workshops')}
          description={t('events.description')}
          mb={48}
        />
        
        {/* Upcoming Events and Workshops Section */}
        <UpcomingEventsSection 
          upcomingEvents={upcomingEvents}
          upcomingWorkshops={upcomingWorkshops}
        />
        
        {/* Unified past events and workshops */}
        <div className={styles.cards_wrapper}>
          {pastItems.length > 0 ? (
            pastItems.map((item: any, index: number) => {
              const itemStartDate = new Date(item.startDate);
              const isUpcoming = itemStartDate > now;
              
              return (
                <EventCard
                  key={`${item.id}-${index}`}
                  id={item.id}
                  name={item.title}
                  img={getLatestCreatedImg(item.media, MEDIA_TAGS.General) || ''}
                  date={formatDateRange(item.startDate, item.endDate)}
                  isUpcoming={isUpcoming}
                />
              );
            })
          ) : (
            <div className={styles.no_events}>
              <p>{t('events.noWorkshops')}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}