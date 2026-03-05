import React, { useEffect, useState } from 'react';
import { Button, Empty, Input, Modal, Spin } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from 'src/app/api';
import { EventsSchema, MediaSchema } from 'src/app/api/Api';
import EventCard from '../card';
import { formatDateRange, getLatestCreatedImg } from 'src/utils';
import { MEDIA_TAGS } from 'src/app/api/Api';

interface PlaylistModalProps {
  visible: boolean;
  playlistId: string;
  playlistName: string;
  onClose: () => void;
  onRenamed?: (newName: string) => void;
}

const PlaylistModal: React.FC<PlaylistModalProps> = ({
  visible,
  playlistId,
  playlistName,
  onClose,
  onRenamed,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventsSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(playlistName);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setEditName(playlistName);
  }, [playlistName]);

  useEffect(() => {
    if (visible && playlistId) {
      fetchPlaylistEvents();
    }
  }, [visible, playlistId]);

  const fetchPlaylistEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const encodedId = encodeURIComponent(playlistId);
      const response = await api.request({
        path: `/camps/youtube/playlist/${encodedId}/videos`,
        method: 'GET',
      });
      const raw = response?.data;
      const list = Array.isArray(raw) ? raw : (raw && Array.isArray((raw as any).data) ? (raw as any).data : []);
      setEvents(list);
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

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === playlistName) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const encodedId = encodeURIComponent(playlistId);
      await api.request({
        path: `/camps/youtube/playlist/${encodedId}`,
        method: 'PATCH',
        body: { name: trimmed },
      });
      onRenamed?.(trimmed);
      setIsEditingName(false);
    } catch (err: any) {
      console.error('Failed to update playlist name:', err);
    } finally {
      setSavingName(false);
    }
  };

  const titleNode = isEditingName ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <Input
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        onPressEnter={handleSaveName}
        style={{ maxWidth: 320 }}
        autoFocus
      />
      <Button type="primary" size="small" loading={savingName} onClick={handleSaveName}>
        {t('events.save')}
      </Button>
      <Button size="small" onClick={() => { setIsEditingName(false); setEditName(playlistName); }}>
        Cancel
      </Button>
    </div>
  ) : (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {playlistName}
      {onRenamed && (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => setIsEditingName(true)} title={t('events.editPlaylistName')} />
      )}
    </span>
  );

  return (
    <Modal
      title={titleNode}
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
            
            const hasValidStart = event.startDate && !Number.isNaN(new Date(event.startDate).getTime());
            const isUpcoming = !!(hasValidStart && new Date(event.startDate) > new Date());
            return (
              <div key={event.id} onClick={() => handleEventClick(event.id)} style={{ cursor: 'pointer' }}>
                <EventCard
                  id={event.id}
                  name={eventTitle}
                  img={getLatestCreatedImg(eventMedia, MEDIA_TAGS.General) || ''}
                  date={formatDateRange(event.startDate, event.endDate)}
                  isUpcoming={isUpcoming}
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
