import { AxiosResponse } from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import useApi from 'src/hooks/useApi';
import { BlogsType } from 'src/pages/success-stories';
import styles from './reviews.module.scss';
import CarouselSlide from './slider';
import { api } from 'src/app/api';

export default function ReviewsSection() {
  const { response: blogsData } = useApi<AxiosResponse<BlogsType>>(() =>
    // @ts-expect-error not a problem
    api.blogs.findAll()
  );

  const successStories = blogsData?.data.data;

  // Fallback data in case API doesn't return any stories

  const slideList: ICarouselSlide[] | undefined = successStories?.map(
    (story) => ({
      authorName: story.author,
      imageSrc: story.media?.[0]?.url || '',
      mainQuote: story?.title,
      id: story?.id,
    })
  );

  console.log('32', slideList);
  return (
    <section>
      <div className={'container ' + styles.container}>
        <Swiper
          modules={[Pagination, Navigation, Keyboard]}
          pagination={{
            clickable: true,
            el: '.swiper-pagination',
            bulletClass: styles.dot,
            bulletActiveClass: styles.active,
            renderBullet: (index, className) => {
              return `<span class="${className}"></span>`;
            },
          }}
          navigation={false}
          keyboard={{ enabled: true }}
          className={styles.carousel}
          slidesPerView={1}
          spaceBetween={0}
          loop={true}
          grabCursor={true}
        >
          {slideList?.map((slide, i) => (
            <SwiperSlide key={i} className={styles.carouselItem}>
              <CarouselSlide {...slide} />
            </SwiperSlide>
          ))}
          <div className={styles.swiperPagination + ' swiper-pagination'}></div>
        </Swiper>
      </div>
    </section>
  );
}

interface ICarouselSlide {
  mainQuote: string;
  authorName: string;
  imageSrc: string;
  id: string;
}
