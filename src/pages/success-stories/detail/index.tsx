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
  const { i18n } = useTranslation();
  const { id } = params;

  const { response: storyData } = useApi<AxiosResponse<IBlog>>(
    // @ts-expect-error types hasn't been properly defined.
    () => api.blogs.findOne(id ?? ''),
    [id],
    !!id
  );

  return (
    <main>
      <div className={'container ' + styles.container}>
        <Breadcrumb items={breadcrumbItems} />

        <CustomText
          color={colors.colorTextBase}
          fontSize={32}
          fontWeight={themeFontWeight.fontWeightSemibold}
          mt={40}
          mb={4}
        >
          {storyData?.data.title}
        </CustomText>
        <CustomText color={colors.colorTextSecondary} lineHeight={1.4} mb={40}>
          {dayjs(storyData?.data.createdAt).format('MMMM D, YYYY')}
        </CustomText>

        <div className={styles.imgWrapper}>
          <img
            className={styles.img}
            height={400}
            src={storyData?.data.media?.[0]?.url}
            alt=""
          />
        </div>
        <CustomText
          color={colors.colorTextBase}
          fontSize={32}
          fontWeight={themeFontWeight.fontWeightSemibold}
          mt={20}
          mb={4}
        >
          {storyData?.data.author}
        </CustomText>
        <Flex vertical gap={8}>
          <RichTextRenderer blocks={storyData?.data.content.blocks ?? []} />
        </Flex>
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
