import { Carousel } from 'antd';
import styles from './carousel.module.scss';
import { MEDIA_TAGS } from 'src/app/api/Api';

interface EventsDetailCarouselProps {
  media?: Array<{
    id: string;
    url: string;
    tags: string[];
    createdAt: string;
  }>;
}

export default function EventsDetailCarousel({
  media = [],
}: EventsDetailCarouselProps) {
  const contentStyle: React.CSSProperties = {};

  // Filter media items with 'general' tag and sort by creation date (newest first)
  const generalImages = media
    .filter((item) => item?.tags?.includes(MEDIA_TAGS.General))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  // If no general images available, show nothing
  if (generalImages.length === 0) {
    return null;
  }

  return (
    <Carousel infinite draggable arrows autoplay className={styles.carousel}>
      {generalImages.map((img, i) => (
        <div key={img.id || i} style={contentStyle} className={styles.img}>
          <img src={img.url} alt="event image" />
        </div>
      ))}
    </Carousel>
  );
}
