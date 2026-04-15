import React, { useState } from 'react';
import { Modal, Typography, Space } from 'antd';
import { PlayCircle, Clock, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ADMISSIONS_YOUTUBE_PREVIEW_SPECS, admissionsPreviewEmbedUrl } from 'src/constants/admissionsPreviewVideos';
import styles from './VideoPreviewSection.module.scss';

const { Title, Text } = Typography;

interface VideoPreview {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  views: number;
}

interface VideoPreviewSectionProps {
  onVideoClick?: (video: VideoPreview) => void;
  previewImage?: string;
  previewVideos?: VideoPreview[];
  modalTitle?: string;
  previewTitle?: string;
}

const VideoPreviewSection: React.FC<VideoPreviewSectionProps> = ({ 
  onVideoClick,
  previewImage,
  previewVideos: customPreviewVideos,
  modalTitle: customModalTitle,
  previewTitle: customPreviewTitle
}) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoPreview | null>(null);

  const defaultPreviewVideos: VideoPreview[] = ADMISSIONS_YOUTUBE_PREVIEW_SPECS.map((spec) => ({
    id: spec.id,
    title: t(spec.titleKey),
    description: t(spec.descriptionKey),
    duration: spec.duration,
    thumbnail: spec.thumbnail,
    videoUrl: admissionsPreviewEmbedUrl(spec.youtubeId, true),
    views: 100,
  }));

  const previewVideos = customPreviewVideos || defaultPreviewVideos;
  const imageSrc = previewImage || '/img/students.jpeg';
  const modalTitle = customModalTitle || t('videoPreview.modalTitle');
  const previewTitle = customPreviewTitle || t('videoPreview.previewTitle');

  const handleImageClick = () => {
    setCurrentVideo(previewVideos[0]); // Start with first video
    setModalVisible(true);
    if (onVideoClick) {
      onVideoClick(previewVideos[0]);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setCurrentVideo(null);
  };

  const handleVideoSelect = (video: VideoPreview) => {
    setCurrentVideo(video);
  };

  return (
    <div className={styles.video_preview_section}>
      <div className={styles.preview_image_container} onClick={handleImageClick}>
        <img 
          src={imageSrc} 
          alt={t('videoPreview.previewImageAlt')} 
          className={styles.preview_image}
        />
        <div className={styles.play_overlay}>
          <PlayCircle size={16} className={styles.play_icon} />
          <div className={styles.preview_text}>
            <Title level={4} className={styles.preview_title}>
              {previewTitle}
            </Title>
          </div>
        </div>
      </div>

      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={1000}
        className={styles.video_modal}
        destroyOnClose
      >
        {currentVideo && (
          <div className={styles.video_modal_content}>
            {/* Main Video Player */}
            <div className={styles.main_video_section}>
              <iframe
                key={currentVideo.id}
                className={styles.main_video}
                src={currentVideo.videoUrl}
                title={currentVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className={styles.main_video_info}>
                <Title level={4} className={styles.main_video_title}>
                  {currentVideo.title}
                </Title>
                <Text className={styles.main_video_description}>
                  {currentVideo.description}
                </Text>
              </div>
            </div>

            {/* Preview Videos Below - Stacked Layout */}
            <div className={styles.preview_videos_section}>
              <Title level={5} className={styles.preview_section_title}>
                {t('videoPreview.moreVideos')}
              </Title>
              <div className={styles.preview_videos_list}>
                {previewVideos.map((video) => (
                  <div
                    key={video.id}
                    className={`${styles.preview_video_item} ${currentVideo.id === video.id ? styles.active : ''}`}
                    onClick={() => handleVideoSelect(video)}
                  >
                    <div className={styles.preview_video_thumbnail}>
                      <img src={video.thumbnail} alt={video.title} />
                      <div className={styles.preview_play_overlay}>
                        <PlayCircle size={16} className={styles.preview_play_icon} />
                      </div>
                    </div>
                    <div className={styles.preview_video_info}>
                      <Title level={5} className={styles.preview_video_title}>
                        {video.title}
                      </Title>
                      <Text className={styles.preview_video_description}>
                        {video.description}
                      </Text>
                    </div>
                    <div className={styles.preview_video_duration}>
                      <Clock size={16} />
                      <span>{video.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VideoPreviewSection;