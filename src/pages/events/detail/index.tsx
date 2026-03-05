import { Breadcrumb, Flex, Skeleton } from 'antd';
import { Link, useParams } from 'react-router-dom';
import MainTitleDescription from 'src/components/mainTitleDesc';
import { useScreenSize } from 'src/hooks/useScreenSize';
import EventsDetailCarousel from './_components/carousel';
import styles from './eventsDetail.module.scss';
import useApi from 'src/hooks/useApi';
import { api } from 'src/app/api';
import { formatDateRange, getYoutubeVideoIdFromUrl } from 'src/utils';
import RichTextRenderer from 'src/pages/universities/_components/detail/richText';
import { getTranslation } from 'src/lib/i18n/translationUtils';

/** Get YouTube video ID from event: either youtubeVideoId or from first location's URL/address */
function getEventYoutubeVideoId(event: any): string | null {
  if (event?.youtubeVideoId) return event.youtubeVideoId;
  const locations = event?.locations;
  if (!Array.isArray(locations)) return null;
  for (const loc of locations) {
    if (!loc) continue;
    const url = typeof loc.url === 'string' ? loc.url : null;
    const idFromUrl = getYoutubeVideoIdFromUrl(url);
    if (idFromUrl) return idFromUrl;
    const address = getTranslation(loc.address);
    const idFromAddress = getYoutubeVideoIdFromUrl(address);
    if (idFromAddress) return idFromAddress;
  }
  return null;
}

export default function EventsDetailsPage() {
  const { screenSize } = useScreenSize();
  const params = useParams();
  const eventId = params.id || '';
  const { response: eventData, isLoading } = useApi(() =>
    api.camps.campsDetail(eventId)    
  );
  const event = eventData?.data;
  const isRecorded = !event?.startDate || !event?.endDate;
  const youtubeVideoId = event ? getEventYoutubeVideoId(event) : null;

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
        </Flex>
        <>
          {isRecorded && youtubeVideoId ? (
            <div className={styles.videoWrapper}>
              <iframe
                width="100%"
                height="315"
                src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                className={styles.video}
                allowFullScreen
              />
            </div>
          ) : (
            <EventsDetailCarousel media={event?.media} />
          )}
          {event?.content?.blocks && (
            <RichTextRenderer blocks={event.content.blocks} id={event.id} />
          )}
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
