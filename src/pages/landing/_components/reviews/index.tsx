import { AxiosResponse } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard } from 'swiper/modules';
import 'swiper/css';
import useApi from 'src/hooks/useApi';
import { BlogsType } from 'src/pages/success-stories';
import styles from './reviews.module.scss';
import TestimonialCard from './testimonialCard';
import { api } from 'src/app/api';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { useTypedSelector } from 'src/app/store';

export default function ReviewsSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTypedSelector((state) => state.layout);
  const { response: blogsData } = useApi<AxiosResponse<BlogsType>>(() =>
    // @ts-expect-error not a problem
    api.blogs.findAll()
  );

  const successStories = blogsData?.data.data;

  const testimonialList: ITestimonial[] | undefined = successStories?.map(
    (story) => ({
      authorName: story.author,
      imageSrc: story.media?.[0]?.url || '',
      mainQuote: story?.title,
      id: story?.id,
    })
  );

  if (!testimonialList?.length) return null;

  const displayList = testimonialList.slice(0, 3);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <CustomText
            as="h2"
            fontSize={themeFontSize.fontSizeTitle3}
            fontWeight={themeFontWeight.fontWeightSemibold}
            color={colors.colorText}
            className={styles.title}
          >
            {t('landing.reviews.title')}
          </CustomText>
        </div>
        <div className={styles.carouselWrapper}>
          <Swiper
            modules={[Keyboard]}
            keyboard={{ enabled: true }}
            className={styles.carousel}
            slidesPerView="auto"
            spaceBetween={24}
            loop={true}
            grabCursor={true}
          >
            {displayList.map((item, i) => (
              <SwiperSlide key={item.id || i} className={styles.slide}>
                <TestimonialCard
                  {...item}
                  onClick={() => navigate(`/success-stories/${item.id}`)}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <button
          type="button"
          className={styles.viewAllBtn}
          onClick={() => navigate('/success-stories')}
        >
          {t('landing.viewAll')}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}

interface ITestimonial {
  mainQuote: string;
  authorName: string;
  imageSrc: string;
  id: string;
}
