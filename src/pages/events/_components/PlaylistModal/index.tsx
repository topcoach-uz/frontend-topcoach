import React, { useEffect, useState } from 'react';
import { Modal, Spin, Empty } from 'antd';
import { api } from 'src/app/api';
import YouTubePlaylistCard from '../YouTubePlaylistCard';

interface PlaylistVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoId: string;
}

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
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && playlistId) {
      fetchPlaylistVideos();
    }
  }, [visible, playlistId]);

  const fetchPlaylistVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API endpoint when YouTube API is integrated
      const response = await api.request({
        path: `/camps/youtube/playlist/${playlistId}/videos`,
        method: 'GET',
      });
      setVideos(response.data || []);
    } catch (err: any) {
      console.error('Error fetching playlist videos:', err);
      setError(err.message || 'Failed to load playlist videos');
      // For now, show empty state - will be populated when YouTube API is integrated
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
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
          <p style={{ marginTop: 16 }}>Loading playlist videos...</p>
        </div>
      ) : error ? (
        <Empty
          description={error}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : videos.length === 0 ? (
        <Empty
          description="No videos in this playlist yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            padding: '20px 0',
          }}
        >
          {videos.map((video) => (
            <YouTubePlaylistCard
              key={video.id}
              type="video"
              videoId={video.videoId}
              thumbnailUrl={video.thumbnailUrl}
              onClick={() => handleVideoClick(video.videoId)}
            />
          ))}
        </div>
      )}
    </Modal>
  );
};

export default PlaylistModal;
