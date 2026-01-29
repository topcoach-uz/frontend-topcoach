import { Pagination } from 'antd';
import { AxiosResponse } from 'axios';
import { useTranslation } from 'react-i18next';
import { api } from 'src/app/api';
import { CustomText } from 'src/components/common';
import { themeFontWeight } from 'src/constants/theme';
import useApi from 'src/hooks/useApi';
import useColors from 'src/hooks/useColors';
import styles from './SuccessStories.module.scss';
import MyCard from './_components/MyCard';
import { MediaSchema } from 'src/app/api/Api';

export default function SuccessStoriesPage() {
  const colors = useColors();
  const { t } = useTranslation();
  const { response } = useApi<
    AxiosResponse<BlogsType> // @ts-expect-error types from backend hasn't been properly defined.
  >(() => api.blogs.findAll());

  const successStories = response?.data;

  return (
    <main>
      <div className={styles.container}>
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              {t('successStories.title')}
            </h1>
            <p className={styles.heroSubtitle}>
              {t('successStories.subtitle')}
            </p>
          </div>
        </div>
        
        <div className={styles.storiesSection}>
          {successStories?.data ? (
            <ul className={styles.storiesWrapper}>
              {successStories.data.map((story, index) => (
                <MyCard
                  image={story.media[0]?.url || ''}
                  key={story.id}
                  hoverText={story.title}
                  id={story.id}
                  title={story?.author ?? ''}
                  createdAt={story.createdAt}
                  index={index}
                />
              ))}
            </ul>
          ) : (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner}></div>
              <div>Loading inspiring success stories...</div>
            </div>
          )}
          
          <div className={styles.paginationWrapper}>
            <Pagination
              current={1}
              total={successStories?.total}
              pageSize={6}
              showSizeChanger={false}
              showQuickJumper
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export interface BlogsType {
  data: Data[];
  total: number;
}

export interface Data {
  id: string;
  title: string;
  subtitle: string;
  publishedDate: string;
  content: Content;
  author: string;
  media: MediaSchema[];
  createdAt: string;
}

export interface Content {
  en: any;
  blocks: Block[];
  time?: number;
  version?: string;
}

export interface Block {
  id: string;
  data: Data;
  type: string;
  blocks: string;
}

export interface Data {
  data: string;
  text: string;
}
