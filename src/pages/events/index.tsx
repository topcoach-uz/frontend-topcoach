import { api } from 'src/app/api';
import MainTitleDescription from 'src/components/mainTitleDesc';
import useApi from 'src/hooks/useApi';
import EventCard from './_components/card';
import CurrentEventSection from './_components/CurrentEventSection';
import styles from './events.module.scss';
import { useTranslation } from 'react-i18next';
import { formatDateRange, getLatestCreatedImg } from 'src/utils';
import { MEDIA_TAGS, MediaSchema } from 'src/app/api/Api';

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  media: MediaSchema[];
}

export default function EventsPage() {
  const { response } = useApi(() => api.camps.campsList());
  const { t } = useTranslation();

  return (
    <main>
      <CurrentEventSection />

      <div className={'container ' + styles.container}>
        <MainTitleDescription
          title={t('blog.previous')}
          description={t('blog.description')}
          mb={24}
        />
        {/* Hardcoded data */}{' '}
        <div className={styles.cards_wrapper}>
          {response?.data.data.map((event: Event, index: number) => (
            <EventCard
              key={index}
              id={event.id}
              name={event.title}
              img={getLatestCreatedImg(event.media, MEDIA_TAGS.General)}
              date={formatDateRange(event.startDate, event.endDate)}
            />
          ))}
        </div>
        {/* // data fom api */}
        {/* <h1>api</h1>
        <div className={styles.cards_wrapper}>
          {previousEventData?.map((event: any, index: any) => (
            <EventCard
              key={index}
              id={event.id}
              name={event.title}
              // date={event.endDate}
              date={dayjs(event.endDate).format('MMMM Do, YYYY')}
              img={'/img/events/bootcamp_samarkand.jpg'}
            />
          ))}
        </div> */}
        {/* <Pagination
          total={events.en.length}
          showTotal={(total) => `Total ${total} items`}
          defaultPageSize={20}
          defaultCurrent={1} 
        /> */}
      </div>
    </main>
  );
}
