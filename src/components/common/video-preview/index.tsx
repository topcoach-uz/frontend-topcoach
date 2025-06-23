import { useEffect, useState, useRef } from 'react';
import styles from './video-preview.module.scss';
import CustomText from '../text';
import useColors from 'src/hooks/useColors';
import { CloseOutlined } from '@ant-design/icons';

interface VideoPreviewProps {
  videoFile?: File;
  videoLink?: string;
  title?: string;
}

export default function VideoPreview({
  videoFile,
  title,
  videoLink,
}: VideoPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const colors = useColors();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayButtonClick = () => {
    setIsFullscreen(true);
  };

  const handleVideoClick = () => {
    setIsFullscreen(true);
  };

  const handleCloseButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (!isFullscreen && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isFullscreen]);

  return (
    <div>
      <CustomText color={colors.colorText} mb={10}>
        {(videoFile || videoLink) && title}
      </CustomText>
      {(videoFile || videoLink) && (
        <div
          className={`${styles.videoContainer} ${isFullscreen ? styles.fullscreen : ''}`}
          onClick={handleVideoClick}
        >
          {!isFullscreen && (
            <div className={styles.playButton} onClick={handlePlayButtonClick}>
              ▶
            </div>
          )}
          {isFullscreen && (
            <>
              <div
                className={styles.overlay}
                onClick={handleOverlayClick}
              ></div>
              <button
                className={styles.closeButton}
                onClick={handleCloseButtonClick}
              >
                <CloseOutlined />
              </button>
            </>
          )}
          <video
            className={styles.video}
            controls={isFullscreen}
            ref={videoRef}
            src={
              videoLink
                ? videoLink
                : videoFile
                  ? URL.createObjectURL(videoFile)
                  : ''
            }
          />
        </div>
      )}
      {
        // if there is no videoFile or a videoLink, show a message
        !videoFile && !videoLink && (
          <CustomText color={colors.colorTextDescription}>
            No {title} uploaded
          </CustomText>
        )
      }
    </div>
  );
}
