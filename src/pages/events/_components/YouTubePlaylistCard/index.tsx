import React from 'react';
import { Card } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import styles from './YouTubePlaylistCard.module.scss';

interface YouTubePlaylistCardProps {
  type: 'video' | 'playlist';
  videoId?: string;
  playlistId?: string;
  playlistName?: string;
  thumbnailUrl?: string;
  videoCount?: number;
  onClick?: () => void;
}

const YouTubePlaylistCard: React.FC<YouTubePlaylistCardProps> = ({
  type,
  videoId,
  playlistId,
  playlistName,
  thumbnailUrl,
  videoCount,
  onClick,
}) => {
  // Generate thumbnail URL if not provided
  const getThumbnailUrl = () => {
    if (thumbnailUrl) return thumbnailUrl;
    if (type === 'video' && videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    // Default placeholder
    return 'https://via.placeholder.com/320x180?text=Video';
  };

  return (
    <Card
      hoverable
      className={styles.playlistCard}
      cover={
        <div className={styles.thumbnailContainer}>
          <img
            src={getThumbnailUrl()}
            alt={type === 'playlist' ? playlistName || 'Playlist' : 'Video'}
            className={styles.thumbnail}
          />
          <div className={styles.overlay}>
            <PlayCircleOutlined className={styles.playIcon} />
          </div>
          {type === 'playlist' && videoCount !== undefined && (
            <div className={styles.videoCount}>
              {videoCount} {videoCount === 1 ? 'video' : 'videos'}
            </div>
          )}
        </div>
      }
      onClick={onClick}
    >
      {type === 'playlist' && playlistName && (
        <Card.Meta title={playlistName} />
      )}
    </Card>
  );
};

export default YouTubePlaylistCard;
