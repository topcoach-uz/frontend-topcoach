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

  // Generate consistent read time, date, and quote based on card ID
  const [readTime, setReadTime] = useState<number>(0);
  const [publishDate, setPublishDate] = useState<dayjs.Dayjs>(dayjs());
  const [description, setDescription] = useState<string>('');

  const inspirationalQuotes = [
    "I never gave up on my dreams, and today I see the result of my hard work.",
    "Turning challenges into milestones - that's what TopCoach taught me.",
    "The biggest changes and opportunities in my life began at TopCoach, where I realized I was ready for greater success.",
    "With the right guidance and determination, anything is possible.",
    "TopCoach didn't just help me get into university - it helped me discover my potential.",
    "Every setback was a setup for a comeback, thanks to the support I received.",
    "The journey was tough, but the destination made it all worth it.",
    "I learned that success isn't about perfection, it's about progress and persistence."
  ];

  useEffect(() => {
    if (!id) return;
    
    // Generate consistent read time based on ID (3-7 minutes)
    const idHash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    setReadTime((idHash % 5) + 3);
    
    // Generate consistent date based on ID (within last 6 months)
    const daysAgo = (idHash % 180); // 0-180 days ago
    const consistentDate = dayjs().subtract(daysAgo, 'day');
    setPublishDate(consistentDate);
    
    // Generate consistent quote based on both ID and title for more variety
    const titleHash = title ? title.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
    const combinedHash = idHash + titleHash;
    const quoteIndex = Math.abs(combinedHash) % inspirationalQuotes.length;
    
    console.log(`Card ID: ${id}, Title: ${title}, Combined Hash: ${combinedHash}, Quote Index: ${quoteIndex}, Quote: ${inspirationalQuotes[quoteIndex]}`);
    setDescription(inspirationalQuotes[quoteIndex]);
  }, [id, title]);

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
          {description}
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
