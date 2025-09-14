import { Breadcrumb, Flex } from 'antd';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CustomText } from 'src/components/common';
import { themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './SuccessStoriesDetail.module.scss';
import { useTranslation } from 'react-i18next';
import useApi from 'src/hooks/useApi';
import { api } from 'src/app/api';
import { AxiosResponse } from 'axios';
import RichTextRenderer from 'src/pages/universities/_components/detail/richText';
import dayjs from 'dayjs';

export default function SuccessStoriesDetailPage() {
  const colors = useColors();
  const params = useParams();
  const { i18n, t } = useTranslation();
  const { id } = params;

  const { response: storyData } = useApi<AxiosResponse<IBlog>>(
    // @ts-expect-error types hasn't been properly defined.
    () => api.blogs.findOne(id ?? ''),
    [id],
    !!id
  );

  // Get all stories to find the index of current story
  const { response: allStories } = useApi<AxiosResponse<BlogsType>>(
    // @ts-expect-error types from backend hasn't been properly defined.
    () => api.blogs.findAll()
  );

  // Find the index of current story
  const storyIndex = allStories?.data?.data?.findIndex(story => story.id === id) ?? 0;
  
  // Get quote, title, read time, and date based on story index
  const quotes = t('successStories.quotes', { returnObjects: true }) as string[];
  const titles = t('successStories.titles', { returnObjects: true }) as string[];
  const readTimes = [3, 4, 5, 6, 7, 8, 9, 10];
  const dateOffsets = [15, 30, 45, 60, 90, 120, 150, 180];
  
  const quote = quotes[storyIndex % quotes.length];
  const displayTitle = titles[storyIndex % titles.length];
  const readTime = readTimes[storyIndex % readTimes.length];
  const daysAgo = dateOffsets[storyIndex % dateOffsets.length];
  const publishDate = dayjs().subtract(daysAgo, 'day');

  return (
    <main>
      <button 
        className={styles.backButton}
        onClick={() => window.history.back()}
      >
        ← Back to Stories
      </button>
      
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.categoryBadge}>
            {t('successStories.title')}
          </div>
          <h1 className={styles.heroTitle}>
            {displayTitle}
          </h1>
          <div className={styles.metadata}>
            <span className={styles.publishDate}>
              {publishDate.format('MMM DD, YYYY')}
            </span>
            <span className={styles.readTime}>
              {readTime} min read
            </span>
            <span className={styles.author}>
              {storyData?.data.author}
            </span>
          </div>
        </div>
      </div>
      
      <div className={styles.contentSection}>
        <div className={styles.contentWrapper}>
          <div className={styles.featuredImage}>
            <div className={styles.quoteBubble}>
              <p className={styles.quote}>
                "{quote}"
              </p>
              <div className={styles.attribution}>
                {storyData?.data.author}
              </div>
            </div>
            <div className={styles.imageContainer}>
              <img
                src={storyData?.data.media?.[0]?.url}
                alt={storyData?.data.title}
              />
            </div>
          </div>
          
          <Flex vertical gap={8}>
            <RichTextRenderer blocks={storyData?.data.content.blocks ?? []} />
          </Flex>
        </div>
      </div>
    </main>
  );
}

const breadcrumbItems = [
  {
    title: <Link to="/">Home</Link>,
  },
  {
    title: <Link to="/success-stories">Success Stories</Link>,
  },
  {
    title: 'Success Story',
  },
];

export interface IBlog {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: any;
  title: string;
  subtitle: string;
  author: string;
  showOnHomePage: boolean;
  publishedDate: string;
  content: Content;
  media: Medum[];
}

export interface Content {
  uz: string;
  time: number;
  blocks: Block[];
  version: string;
}

export interface Block {
  id: string;
  type: string;
  data: Data;
}

export interface Data {
  html?: string;
  text: string;
  level?: number;
  style?: string;
  url?: string;
  caption?: string;
  alignment?: string;
}

export interface Medum {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: any;
  url: string;
  type: string;
  tags: string[];
}
