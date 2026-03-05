import { useEffect, useMemo, useState, useCallback } from 'react';
import { Spin } from 'antd';
import { api } from 'src/app/api';
import MainTitleDescription from 'src/components/mainTitleDesc';
import useApi from 'src/hooks/useApi';
import EventCard from './_components/card';
import styles from './events.module.scss';
import { useTranslation } from 'react-i18next';
import { formatDateRange, getLatestCreatedImg } from 'src/utils';
import { MEDIA_TAGS, MediaSchema } from 'src/app/api/Api';
import UpcomingEventsSection from './_components/UpcomingEventsSection';
import YouTubeSection from './_components/YouTubeSection';
import CustomSelect from 'src/components/common/select';

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  deadline?: string;
  media: MediaSchema[];
}

export default function EventsPage() {
  const { response: eventsData, isLoading: eventsLoading } = useApi(() => api.camps.campsList());
  const { response: workshopsData, isLoading: workshopsLoading } = useApi(() => api.camps.getActiveWorkshops());
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<string>('all');
  
  const isLoading = eventsLoading || workshopsLoading;

  const typeFilterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Workshops', value: 'workshop' },
    { label: 'Camps & bootcamps', value: 'event' },
  ];

  // Set page title in browser header
  useEffect(() => {
    document.title = 'Workshops - Top Coach';
  }, []);

  // Categorize events based on dates
  const now = useMemo(() => new Date(), []);
  const allEventsData = eventsData?.data.data || [];
  const allWorkshopsData = workshopsData?.data || [];

  // Helper function to check if event is a workshop
  const isWorkshop = useCallback((event: any) => {
    return event.type === 'workshop' || event.type === 'Workshop';
  }, []);

  // Helper function to check if event is in a playlist
  const isInPlaylist = useCallback((event: any) => {
    return event.youtubeVideoType && 
           event.youtubeVideoType !== 'none' && 
           (event.youtubePlaylistId || event.youtubePlaylistName);
  }, []);

  // Separate events and workshops, excluding those in playlists
  const regularEvents = useMemo(() => {
    return allEventsData.filter((event: any) => 
      !isWorkshop(event) && !isInPlaylist(event)
    );
  }, [allEventsData, isWorkshop, isInPlaylist]);

  const workshops = useMemo(() => {
    // Filter workshops from both allEventsData and allWorkshopsData, excluding those in playlists
    const workshopsFromEvents = allEventsData.filter((event: any) => 
      isWorkshop(event) && !isInPlaylist(event)
    );
    const workshopsFromData = (allWorkshopsData || []).filter((workshop: any) => 
      !isInPlaylist(workshop)
    );
    // Combine and deduplicate by id
    const allWorkshops = [...workshopsFromEvents, ...workshopsFromData];
    const uniqueWorkshops = allWorkshops.filter((workshop, index, self) =>
      index === self.findIndex((w) => w.id === workshop.id)
    );
    return uniqueWorkshops;
  }, [allEventsData, allWorkshopsData, isWorkshop, isInPlaylist]);

  // Helper function to check if event matches the selected filter
  const matchesFilter = useMemo(() => {
    return (event: any) => {
      if (selectedType === 'all') return true;
      if (selectedType === 'workshop') return isWorkshop(event);
      if (selectedType === 'event') return !isWorkshop(event);
      return true;
    };
  }, [selectedType]);

  // Get upcoming events and workshops (for the upcoming section)
  const upcomingEvents = useMemo(() => {
    return regularEvents.filter((event: Event) => {
      if (!event.startDate) return false;
      const startDate = new Date(event.startDate);
      return !Number.isNaN(startDate.getTime()) && startDate > now && matchesFilter(event);
    });
  }, [regularEvents, now, matchesFilter]);

  const upcomingWorkshops = useMemo(() => {
    return workshops.filter((workshop: any) => {
      if (!workshop.startDate) return false;
      const startDate = new Date(workshop.startDate);
      return !Number.isNaN(startDate.getTime()) && startDate > now && matchesFilter(workshop);
    });
  }, [workshops, now, matchesFilter]);

  // Get all events and workshops that have passed deadline
  // For workshops: check if deadline has passed
  // For events: check if endDate has passed
  const pastItems = useMemo(() => {
    const pastEvents = regularEvents.filter((event: Event) => {
      if (!event.endDate) return false;
      const endDate = new Date(event.endDate);
      return !Number.isNaN(endDate.getTime()) && endDate < now && matchesFilter(event);
    });

    const pastWorkshops = workshops.filter((workshop: any) => {
      // No dates = recorded workshop, include in past so it shows with "Recorded · Watch anytime"
      if (!workshop.deadline && !workshop.endDate) return matchesFilter(workshop);
      if (workshop.deadline) {
        const deadline = new Date(workshop.deadline);
        if (!Number.isNaN(deadline.getTime())) return deadline < now && matchesFilter(workshop);
      }
      if (workshop.endDate) {
        const endDate = new Date(workshop.endDate);
        return !Number.isNaN(endDate.getTime()) && endDate < now && matchesFilter(workshop);
      }
      return false;
    });

    const allPastItems = [...pastEvents, ...pastWorkshops];

    // Sort by endDate or deadline (most recent first); items with no date go last
    allPastItems.sort((a: any, b: any) => {
      const tsA = a.deadline ? new Date(a.deadline).getTime() : (a.endDate ? new Date(a.endDate).getTime() : 0);
      const tsB = b.deadline ? new Date(b.deadline).getTime() : (b.endDate ? new Date(b.endDate).getTime() : 0);
      return tsB - tsA;
    });

    return allPastItems;
  }, [regularEvents, workshops, now, matchesFilter]);

  return (
    <main>
      <div className={'container ' + styles.container}>
        <div className={styles.header_section}>
          <MainTitleDescription
            title={t('events.workshops')}
            description={t('events.description')}
            mb={48}
          />
        </div>
        <div className={styles.filter}>
          <CustomSelect
            defaultValue={'all'}
            style={{ width: 180 }}
            options={typeFilterOptions}
            onChange={(value) => setSelectedType(value)}
          />
        </div>
        
        {isLoading ? (
          <div className={styles.loading_container}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: '#666' }}>Loading workshops...</p>
          </div>
        ) : (
          <>
            {/* Upcoming Events and Workshops Section */}
            <UpcomingEventsSection 
              upcomingEvents={upcomingEvents}
              upcomingWorkshops={upcomingWorkshops}
            />
            
            {/* YouTube Videos & Playlists Section */}
            <YouTubeSection events={[...allEventsData, ...allWorkshopsData]} />
            
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
          </>
        )}
      </div>
    </main>
  );
}