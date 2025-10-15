import useColors from 'src/hooks/useColors';
import CustomText from '../text';
import { Flex } from 'antd';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';

interface Props {
  videoSrc: string;
  title?: string;
}

export default function VideoView({ videoSrc, title }: Props) {
  const colors = useColors();
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    const generateThumbnail = () => {
      try {
        // Set video to 1 second to get a better frame
        video.currentTime = 1;
        
        video.addEventListener('seeked', () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            canvas.width = video.videoWidth || 380;
            canvas.height = video.videoHeight || 240;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
            setThumbnailUrl(thumbnail);
          }
        }, { once: true });
      } catch (error) {
        console.warn('Could not generate thumbnail:', error);
      }
    };

    video.addEventListener('loadedmetadata', generateThumbnail);
    
    return () => {
      video.removeEventListener('loadedmetadata', generateThumbnail);
    };
  }, [videoSrc]);

  return (
    <Flex gap={15} vertical style={{ flex: 1, minWidth: '380px' }}>
      {title && <CustomText color={colors.colorText}>{title}</CustomText>}
      <video 
        ref={videoRef}
        width="380" 
        height="240" 
        controls
        poster={thumbnailUrl || undefined}
        preload="metadata"
        style={{ 
          width: '100%', 
          maxWidth: '380px', 
          height: '240px',
          borderRadius: '12px',
          objectFit: 'cover',
          backgroundColor: '#f5f5f5'
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        <source src={videoSrc} type="video/webm" />
        <source src={videoSrc} type="video/ogg" />
        {t('mentors.videoMessage')}
      </video>
    </Flex>
  );
}
