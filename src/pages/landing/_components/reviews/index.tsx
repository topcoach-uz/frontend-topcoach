import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard } from 'swiper/modules';
import 'swiper/css';
import styles from './reviews.module.scss';
import TestimonialCard from './testimonialCard';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { useTypedSelector } from 'src/app/store';
import { useGetTestimonialsQuery } from 'src/app/services/testimonialsApi';

export default function ReviewsSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTypedSelector((state) => state.layout);

  // Real, backend-managed testimonials. The section only renders once
  // published testimonials exist — until then it is a no-op (nothing shown),
  // so environments with no testimonial rows are unaffected.
  const {
    data: testimonialsData,
    isLoading,
    isFetching,
    isError,
  } = useGetTestimonialsQuery();

  const ready = !isLoading && !isFetching && !isError;

  const displayList = (testimonialsData?.data ?? []).slice(0, 3).map((item) => ({
    id: item.id,
    authorName: item.name,
    authorRole: item.context ? `${item.role} · ${item.context}` : item.role,
    imageSrc: item.avatarUrl || '',
    mainQuote: item.quote,
  }));

  if (!ready || displayList.length === 0) return null;

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
                <TestimonialCard {...item} onClick={() => {}} />
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
