import { CustomText } from 'src/components/common';
import { Tag } from 'antd';
import styles from '../../events.module.scss';
import useColors from 'src/hooks/useColors';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { useTranslation } from 'react-i18next';

interface PlaylistCardProps {
  playlistId: string;
  playlistName: string;
  img?: string;
  videoCount: number;
  onClick: () => void;
}

export default function PlaylistCard({
  playlistName,
  img,
  videoCount,
  onClick,
}: PlaylistCardProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const dateLabel = t('events.playlist') + ' · ' + (videoCount === 1 ? t('events.playlistVideos', { count: videoCount }) : t('events.playlistVideos_other', { count: videoCount }));

  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className={styles.img_mask}>
        <img
          src={img || 'https://via.placeholder.com/320x180?text=Playlist'}
          alt={playlistName}
          className={styles.event_image}
          loading="lazy"
        />
        <Tag color="purple" className={styles.playlist_badge}>
          {t('events.playlist')} ({videoCount})
        </Tag>
      </div>
      <div className={styles.card_description}>
        <CustomText color={colors.colorTextSecondary} lineHeight={1.4}>
          {dateLabel}
        </CustomText>
        <CustomText
          color={colors.colorTextBase}
          fontSize={themeFontSize.fontSizeTitle5}
          fontWeight={themeFontWeight.fontWeightSemibold}
          className={styles.event_name}
          as="p"
        >
          {playlistName}
        </CustomText>
      </div>
    </div>
  );
}
