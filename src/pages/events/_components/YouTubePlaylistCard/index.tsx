import React from 'react';
import { Card } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import styles from './YouTubePlaylistCard.module.scss';

interface YouTubePlaylistCardProps {
  type: 'playlist';
  playlistId?: string;
  playlistName?: string;
  thumbnailUrl?: string;
  videoCount?: number;
  onClick?: () => void;
}

const YouTubePlaylistCard: React.FC<YouTubePlaylistCardProps> = ({
  playlistId,
  playlistName,
  thumbnailUrl,
  videoCount,
  onClick,
}) => {
  // Generate thumbnail URL if not provided
  const getThumbnailUrl = () => {
    if (thumbnailUrl) return thumbnailUrl;
    // Default placeholder for playlist
    return 'https://via.placeholder.com/320x180?text=Playlist';
  };

  return (
    <Card
      hoverable
      className={styles.playlistCard}
      cover={
        <div className={styles.thumbnailContainer}>
          <img
            src={getThumbnailUrl()}
            alt={playlistName || 'Playlist'}
            className={styles.thumbnail}
          />
          <div className={styles.overlay}>
            <PlayCircleOutlined className={styles.playIcon} />
          </div>
          {videoCount !== undefined && (
            <div className={styles.videoCount}>
              {videoCount} {videoCount === 1 ? 'event' : 'events'}
            </div>
          )}
        </div>
      }
      onClick={onClick}
    >
      {playlistName && (
        <Card.Meta title={playlistName} />
      )}
    </Card>
  );
};

export default YouTubePlaylistCard;
