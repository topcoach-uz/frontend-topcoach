import { Breadcrumb, Flex, Skeleton } from 'antd';
import { Link, useParams } from 'react-router-dom';
import MainTitleDescription from 'src/components/mainTitleDesc';
import { useScreenSize } from 'src/hooks/useScreenSize';
import EventsDetailCarousel from './_components/carousel';
import styles from './eventsDetail.module.scss';
import useApi from 'src/hooks/useApi';
import { api } from 'src/app/api';
import { formatDateRange } from 'src/utils';
import RichTextRenderer from 'src/pages/universities/_components/detail/richText';

export default function EventsDetailsPage() {
  const { screenSize } = useScreenSize();
  const params = useParams();
  const eventId = params.id || '';
  const { response: eventData, isLoading } = useApi(() =>
    api.camps.campsDetail({ id: eventId })
  );
  const event = eventData?.data;

  if (isLoading) {
    return (
      <main>
        <div className={'container ' + styles.container}>
          <Skeleton.Button
            active
            style={{ width: 200, height: 20, marginBottom: 20 }}
          />
          <Skeleton active paragraph={{ rows: 1 }} title={{ width: '50%' }} />
          <Skeleton.Image
            active
            style={{ width: '100%', height: 300, marginBottom: 20 }}
          />
          <Skeleton active paragraph={{ rows: 4 }} title={{ width: '30%' }} />
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className={'container ' + styles.container}>
        <Breadcrumb separator="/" items={breadcrumbItems} />
        <Flex
          vertical={screenSize < 768}
          justify="space-between"
          align="center"
          gap={20}
        >
          <MainTitleDescription
            title={event?.title}
            description={formatDateRange(event?.startDate, event?.endDate)}
            centered={false}
          />
        </Flex>{' '}
        <>
          <EventsDetailCarousel media={event?.media} />{' '}
          {/* Render event content blocks */}
          {event?.content?.blocks && (
            <RichTextRenderer blocks={event.content.blocks} id={event.id} />
          )}
          {/* {videoLink && (
            <iframe
              width="560"
              height="315"
              src={videoLink}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              className={styles.video}
              allowFullScreen
            ></iframe>
          )} */}
        </>
      </div>
    </main>
  );
}
const breadcrumbItems = [
  {
    title: <Link to="/">Home</Link>,
  },
  {
    title: <Link to="/events">Events</Link>,
  },
  {
    title: 'Events Information',
  },
];
