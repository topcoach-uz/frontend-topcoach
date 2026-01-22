import React, { useMemo, useState } from 'react';
import { Typography } from 'antd';
import YouTubePlaylistCard from '../YouTubePlaylistCard';
import PlaylistModal from '../PlaylistModal';
import styles from './YouTubeSection.module.scss';

const { Title } = Typography;

interface Event {
  id: string;
  youtubeVideoType?: string | null;
  youtubeVideoId?: string | null;
  youtubePlaylistId?: string | null;
  youtubePlaylistName?: string | null;
  title: string;
}

interface YouTubeSectionProps {
  events: Event[];
}

const YouTubeSection: React.FC<YouTubeSectionProps> = ({ events }) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Group events by playlist or show standalone videos
  const { playlists, standaloneVideos } = useMemo(() => {
    const playlistsMap = new Map<string, { name: string; events: Event[] }>();
    const standalone: Event[] = [];

    events.forEach((event) => {
      if (!event.youtubeVideoType || !event.youtubeVideoId) return;

      if (event.youtubeVideoType === 'standalone') {
        standalone.push(event);
      } else if (
        event.youtubeVideoType === 'existing_playlist' &&
        event.youtubePlaylistId
      ) {
        const playlistId = event.youtubePlaylistId;
        if (!playlistsMap.has(playlistId)) {
          playlistsMap.set(playlistId, {
            name: event.youtubePlaylistName || `Playlist ${playlistId}`,
            events: [],
          });
        }
        playlistsMap.get(playlistId)!.events.push(event);
      } else if (
        event.youtubeVideoType === 'new_playlist' &&
        event.youtubePlaylistName
      ) {
        // For new playlists, use the playlist name as the key
        const playlistName = event.youtubePlaylistName;
        const playlistKey = `new_${playlistName}`;
        if (!playlistsMap.has(playlistKey)) {
          playlistsMap.set(playlistKey, {
            name: playlistName,
            events: [],
          });
        }
        playlistsMap.get(playlistKey)!.events.push(event);
      }
    });

    return {
      playlists: Array.from(playlistsMap.entries()).map(([id, data]) => ({
        id,
        ...data,
      })),
      standaloneVideos: standalone,
    };
  }, [events]);

  const handlePlaylistClick = (playlistId: string, playlistName: string) => {
    setSelectedPlaylist({ id: playlistId, name: playlistName });
  };

  const handleVideoClick = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  if (playlists.length === 0 && standaloneVideos.length === 0) {
    return null;
  }

  return (
    <div className={styles.youtubeSection}>
      <Title level={2} className={styles.sectionTitle}>
        Videos & Playlists
      </Title>

      {/* Standalone Videos */}
      {standaloneVideos.length > 0 && (
        <div className={styles.section}>
          <Title level={4} className={styles.subtitle}>
            Videos
          </Title>
          <div className={styles.grid}>
            {standaloneVideos.map((event) => (
              <YouTubePlaylistCard
                key={event.id}
                type="video"
                videoId={event.youtubeVideoId || undefined}
                onClick={() =>
                  handleVideoClick(event.youtubeVideoId || '')
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Playlists */}
      {playlists.length > 0 && (
        <div className={styles.section}>
          <Title level={4} className={styles.subtitle}>
            Playlists
          </Title>
          <div className={styles.grid}>
            {playlists.map((playlist) => (
              <YouTubePlaylistCard
                key={playlist.id}
                type="playlist"
                playlistId={playlist.id}
                playlistName={playlist.name}
                videoCount={playlist.events.length}
                onClick={() => handlePlaylistClick(playlist.id, playlist.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Playlist Modal */}
      {selectedPlaylist && (
        <PlaylistModal
          visible={!!selectedPlaylist}
          playlistId={selectedPlaylist.id}
          playlistName={selectedPlaylist.name}
          onClose={() => setSelectedPlaylist(null)}
        />
      )}
    </div>
  );
};

export default YouTubeSection;
