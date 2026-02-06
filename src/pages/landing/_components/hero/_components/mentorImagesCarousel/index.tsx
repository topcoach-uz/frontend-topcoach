import styles from './mentorImagesCarousel.module.scss';

interface Props {
  images: string[];
}

export default function MentorImagesCarousel({ images }: Props) {
  const duplicated = [...images, ...images];

  return (
    <div className={styles.carousel}>
      <ul className={styles.carouselTrack}>
        {duplicated.map((src, index) => (
          <li key={index} className={styles.carouselItem}>
            <div className={styles.imageWrapper}>
              <img src={src} alt={`Mentor ${index + 1}`} loading="lazy" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
