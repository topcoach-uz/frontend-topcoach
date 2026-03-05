import { useEffect, useMemo, useState, useCallback } from 'react';
import { Spin } from 'antd';
import { api } from 'src/app/api';
import MainTitleDescription from 'src/components/mainTitleDesc';
import useApi from 'src/hooks/useApi';
import EventCard from './_components/card';
import PlaylistCard from './_components/PlaylistCard';
import PlaylistModal from './_components/PlaylistModal';
import styles from './events.module.scss';
import { useTranslation } from 'react-i18next';
import { formatDateRange, getLatestCreatedImg } from 'src/utils';
import { MEDIA_TAGS, MediaSchema } from 'src/app/api/Api';
import UpcomingEventsSection from './_components/UpcomingEventsSection';
import CustomSelect from 'src/components/common/select';

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  deadline?: string;
  media: MediaSchema[];
  type?: string;
  youtubeVideoType?: string | null;
  youtubePlaylistId?: string | null;
  youtubePlaylistName?: string | null;
}

interface PlaylistGroup {
  id: string;
  name: string;
  events: Event[];
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

  // Group events by playlist (same logic as YouTubeSection)
  const playlists = useMemo((): PlaylistGroup[] => {
    const combined = [...allEventsData, ...allWorkshopsData];
    const playlistsMap = new Map<string, { name: string; events: Event[] }>();

    combined.forEach((event: any) => {
      if (!event.youtubeVideoType || event.youtubeVideoType === 'none') return;
      if (event.youtubeVideoType === 'existing_playlist' && event.youtubePlaylistId) {
        const pid = event.youtubePlaylistId;
        if (!playlistsMap.has(pid)) {
          playlistsMap.set(pid, {
            name: event.youtubePlaylistName || `Playlist ${pid}`,
            events: [],
          });
        }
        playlistsMap.get(pid)!.events.push(event);
      } else if (event.youtubeVideoType === 'new_playlist' && event.youtubePlaylistName) {
        const key = `new_${event.youtubePlaylistName}`;
        if (!playlistsMap.has(key)) {
          playlistsMap.set(key, { name: event.youtubePlaylistName, events: [] });
        }
        playlistsMap.get(key)!.events.push(event);
      }
    });

    return Array.from(playlistsMap.entries()).map(([id, data]) => ({ id, ...data }));
  }, [allEventsData, allWorkshopsData]);

  // Filter playlists by selected type: show playlists that contain at least one matching item
  const playlistsToShow = useMemo(() => {
    if (selectedType === 'all') return playlists;
    if (selectedType === 'workshop') return playlists.filter((p) => p.events.some((e: any) => isWorkshop(e)));
    if (selectedType === 'event') return playlists.filter((p) => p.events.some((e: any) => !isWorkshop(e)));
    return playlists;
  }, [playlists, selectedType, isWorkshop]);

  const [selectedPlaylist, setSelectedPlaylist] = useState<{ id: string; name: string } | null>(null);

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
            
            {/* Unified grid: playlist cards + past events and workshops */}
            <div className={styles.cards_wrapper}>
              {playlistsToShow.map((playlist) => {
                const firstEvent = playlist.events[0];
                const img = firstEvent?.media
                  ? getLatestCreatedImg(firstEvent.media as MediaSchema[], MEDIA_TAGS.General) || ''
                  : '';
                return (
                  <PlaylistCard
                    key={playlist.id}
                    playlistId={playlist.id}
                    playlistName={playlist.name}
                    img={img}
                    videoCount={playlist.events.length}
                    onClick={() => setSelectedPlaylist({ id: playlist.id, name: playlist.name })}
                  />
                );
              })}
              {pastItems.map((item: any, index: number) => {
                const itemStartDate = item.startDate ? new Date(item.startDate) : null;
                const isUpcoming = itemStartDate ? itemStartDate > now : false;
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
              })}
              {playlistsToShow.length === 0 && pastItems.length === 0 && (
                <div className={styles.no_events + ' ' + styles.no_events_full}>
                  <p>{t('events.noWorkshops')}</p>
                </div>
              )}
            </div>

            {selectedPlaylist && (
              <PlaylistModal
                visible={!!selectedPlaylist}
                playlistId={selectedPlaylist.id}
                playlistName={selectedPlaylist.name}
                onClose={() => setSelectedPlaylist(null)}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}