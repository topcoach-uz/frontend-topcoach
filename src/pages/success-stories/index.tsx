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
      <div className={'container ' + styles.container}>
        <CustomText
          as="h2"
          color={colors.colorTextBase}
          fontSize={32}
          fontWeight={themeFontWeight.fontWeightSemibold}
          mb={4}
        >
          {t('blog.title')}
        </CustomText>
        <CustomText
          as="p"
          lineHeight={1.4}
          color={colors.colorTextSecondary}
          mb={24}
        >
          {t('blog.text')}
        </CustomText>
        <ul className={styles.storiesWrapper}>
          {successStories?.data?.map((story) => (
            <MyCard
              image={story.media[0]?.url || ''}
              key={story.id}
              hoverText={story.title}
              id={story.id}
              title={story?.author ?? ''}
            />
          ))}
        </ul>
        <Pagination
          style={{ marginTop: 16 }}
          current={1}
          total={successStories?.total}
        />
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
