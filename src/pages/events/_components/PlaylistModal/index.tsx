import React, { useEffect, useState } from 'react';
import { Modal, Spin, Empty } from 'antd';
import { api } from 'src/app/api';
import { EventsSchema, MediaSchema } from 'src/app/api/Api';
import { useNavigate } from 'react-router-dom';
import EventCard from '../card';
import { formatDateRange, getLatestCreatedImg } from 'src/utils';
import { MEDIA_TAGS } from 'src/app/api/Api';

interface PlaylistModalProps {
  visible: boolean;
  playlistId: string;
  playlistName: string;
  onClose: () => void;
}

const PlaylistModal: React.FC<PlaylistModalProps> = ({
  visible,
  playlistId,
  playlistName,
  onClose,
}) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventsSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && playlistId) {
      fetchPlaylistEvents();
    }
  }, [visible, playlistId]);

  const fetchPlaylistEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.request({
        path: `/camps/youtube/playlist/${playlistId}/videos`,
        method: 'GET',
      });
      // The API returns events in the playlist
      setEvents(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching playlist events:', err);
      setError(err.message || 'Failed to load playlist events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
    onClose();
  };

  return (
    <Modal
      title={playlistName}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      style={{ top: 20 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Loading playlist events...</p>
        </div>
      ) : error ? (
        <Empty
          description={error}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : events.length === 0 ? (
        <Empty
          description="No events in this playlist yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
            padding: '20px 0',
          }}
        >
          {events.map((event) => {
            const eventTitle = typeof event.title === 'string' 
              ? event.title 
              : (event.title as any)?.en || 'Untitled';
            
            // Handle media - EventsSchema type says string[] but API actually returns MediaSchema[]
            // Cast to MediaSchema[] to match what getLatestCreatedImg expects
            const eventMedia = ((event as any).media || []) as MediaSchema[];
            
            return (
              <div key={event.id} onClick={() => handleEventClick(event.id)} style={{ cursor: 'pointer' }}>
                <EventCard
                  id={event.id}
                  name={eventTitle}
                  img={getLatestCreatedImg(eventMedia, MEDIA_TAGS.General) || ''}
                  date={formatDateRange(event.startDate, event.endDate)}
                  isUpcoming={new Date(event.startDate) > new Date()}
                />
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default PlaylistModal;
