import { CustomCard } from 'src/components/cards';
import styles from './MyCard.module.scss';
import { useState, useEffect } from 'react';
import { CustomText } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

interface Props {
  title?: string;
  description?: string[];
  hoverText?: string;
  image?: string;
  id?: string;
  createdAt?: string;
  index?: number; // Add index prop for quote assignment
}

export default function MyCard({ title, image, id, hoverText, createdAt, index = 0 }: Props) {
  const [hovered, setHovered] = useState<boolean>(false);
  const colors = useColors();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Generate consistent read time, date, and quote based on card ID
  const [readTime, setReadTime] = useState<number>(0);
  const [publishDate, setPublishDate] = useState<dayjs.Dayjs>(dayjs());
  const [description, setDescription] = useState<string>('');
  const [displayTitle, setDisplayTitle] = useState<string>('');

  // Get translated data from i18n
  const inspirationalQuotes = t('successStories.quotes', { returnObjects: true }) as string[];
  const storyTitles = t('successStories.titles', { returnObjects: true }) as string[];
  const readTimes = [3, 4, 5, 6, 7, 8, 9, 10];
  const dateOffsets = [15, 30, 45, 60, 90, 120, 150, 180];

  useEffect(() => {
    if (!id) return;
    
    // Use stored data based on index for consistency
    const quoteIndex = index % inspirationalQuotes.length;
    const titleIndex = index % storyTitles.length;
    const readTimeIndex = index % readTimes.length;
    const dateOffsetIndex = index % dateOffsets.length;
    
    // Set values from stored data
    setReadTime(readTimes[readTimeIndex]);
    setDescription(inspirationalQuotes[quoteIndex]);
    setDisplayTitle(storyTitles[titleIndex]);
    
    // Generate consistent date based on stored offset
    const daysAgo = dateOffsets[dateOffsetIndex];
    const consistentDate = dayjs().subtract(daysAgo, 'day');
    setPublishDate(consistentDate);
    
    console.log(`Card Index: ${index}, Title: ${storyTitles[titleIndex]}, Quote: ${inspirationalQuotes[quoteIndex]}, Read Time: ${readTimes[readTimeIndex]} min, Date Offset: ${daysAgo} days`);
  }, [id, index, inspirationalQuotes, storyTitles, readTimes, dateOffsets]);

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
          {t('successStories.title')}
        </div>
        
            <h3 className={styles.title}>
              {displayTitle}
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
