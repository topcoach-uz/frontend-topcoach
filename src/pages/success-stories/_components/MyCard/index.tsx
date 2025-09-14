import { CustomCard } from 'src/components/cards';
import styles from './MyCard.module.scss';
import { useState, useEffect } from 'react';
import { CustomText } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

interface Props {
  title?: string;
  description?: string[];
  hoverText?: string;
  image?: string;
  id?: string;
  createdAt?: string;
}

export default function MyCard({ title, image, id, hoverText, createdAt }: Props) {
  const [hovered, setHovered] = useState<boolean>(false);
  const colors = useColors();
  const navigate = useNavigate();

  // Generate random read time only once when component mounts
  const [readTime, setReadTime] = useState<number>(0);

  useEffect(() => {
    setReadTime(Math.floor(Math.random() * 5) + 3); // 3-7 minutes
  }, []);

  // Use actual blog date or fallback to current date
  const publishDate = createdAt ? dayjs(createdAt) : dayjs();

  return (
    <div
      className={styles.cardContainer}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      onClick={() => navigate(`/success-stories/${id}`)}
    >
      <div className={styles.imgContainer}>
        <img src={image} alt={title} loading="lazy" />
      </div>
      
      <div className={styles.textContainer}>
        <div className={styles.category}>
          SUCCESS STORIES
        </div>
        
        <h3 className={styles.title}>
          {hoverText}
        </h3>
        <p className={styles.description}>
          {title}'s journey showcases the power of determination and quality education.
        </p>
      </div>
      
      <div className={styles.metadata}>
        <span className={styles.publishDate}>
          {publishDate.format('MMM DD, YYYY')}
        </span>
        <span className={styles.readTime}>
          {readTime} min read
        </span>
      </div>
    </div>
  );
}
