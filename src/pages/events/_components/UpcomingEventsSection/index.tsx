import { useTranslation } from 'react-i18next';
import { Card, Button, Space, Tag, Typography } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { formatDateRange, getLatestCreatedImg } from 'src/utils';
import { MEDIA_TAGS, MediaSchema } from 'src/app/api/Api';
import { useState } from 'react';
import RegistrationModal from './RegistrationModal';
import styles from './UpcomingEventsSection.module.scss';

const { Title, Text } = Typography;

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  media: MediaSchema[];
}

interface Workshop {
  id: string;
  title: string;
  summary: string;
  startDate: string;
  endDate: string;
  deadline: string;
  maxParticipants?: number;
  currentParticipants?: number;
  media: MediaSchema[];
  locations: any[];
}

interface UpcomingEventsSectionProps {
  upcomingEvents: Event[];
  upcomingWorkshops: Workshop[];
}

export default function UpcomingEventsSection({ 
  upcomingEvents, 
  upcomingWorkshops 
}: UpcomingEventsSectionProps) {
  const { t } = useTranslation();
  const [registrationModal, setRegistrationModal] = useState<{
    visible: boolean;
    eventId: string;
    eventTitle: string;
    eventType: 'event' | 'workshop';
  }>({
    visible: false,
    eventId: '',
    eventTitle: '',
    eventType: 'event'
  });

  const handleRegister = (eventId: string, eventTitle: string, eventType: 'event' | 'workshop') => {
    setRegistrationModal({
      visible: true,
      eventId,
      eventTitle,
      eventType
    });
  };

  const handleRegistrationClose = () => {
    setRegistrationModal({
      visible: false,
      eventId: '',
      eventTitle: '',
      eventType: 'event'
    });
  };

  const allUpcoming = [...upcomingEvents, ...upcomingWorkshops];

  if (allUpcoming.length === 0) {
    return null;
  }

  return (
    <div className={styles.upcoming_section}>
      <div className={styles.section_header}>
        <Title level={2} className={styles.section_title}>
          {t('events.upcomingEventsWorkshops')}
        </Title>
        <Text className={styles.section_description}>
          {t('events.upcomingDescription')}
        </Text>
      </div>

      <div className={styles.upcoming_cards}>
        {upcomingEvents.map((event) => (
          <Card
            key={`event-${event.id}`}
            className={styles.upcoming_card}
            cover={
              <div className={styles.card_image}>
                <img 
                  src={getLatestCreatedImg(event.media, MEDIA_TAGS.General) || '/img/upcoming_event/event_mobile.png'} 
                  alt={event.title}
                />
                <div className={styles.card_overlay}>
                  <Tag color="green" className={styles.upcoming_tag}>
                    {t('events.upcoming')}
                  </Tag>
                </div>
              </div>
            }
            actions={[
              <Button
                key="register"
                type="primary"
                size="large"
                onClick={() => handleRegister(event.id, event.title, 'event')}
                className={styles.register_button}
              >
                {t('events.registerNow')}
              </Button>
            ]}
          >
            <div className={styles.card_content}>
              <Title level={4} className={styles.event_title}>
                {event.title}
              </Title>
              
              <Space direction="vertical" size="small" className={styles.event_info}>
                <div className={styles.info_item}>
                  <CalendarOutlined className={styles.info_icon} />
                  <span>{formatDateRange(event.startDate, event.endDate)}</span>
                </div>
              </Space>
            </div>
          </Card>
        ))}

        {upcomingWorkshops.map((workshop) => (
          <Card
            key={`workshop-${workshop.id}`}
            className={styles.upcoming_card}
            cover={
              <div className={styles.card_image}>
                <img 
                  src={getLatestCreatedImg(workshop.media, MEDIA_TAGS.General) || '/img/upcoming_event/event_mobile.png'} 
                  alt={workshop.title}
                />
                <div className={styles.card_overlay}>
                  <Tag color="blue" className={styles.workshop_tag}>
                    {t('events.workshop')}
                  </Tag>
                  <Tag color="green" className={styles.upcoming_tag}>
                    {t('events.upcoming')}
                  </Tag>
                </div>
              </div>
            }
            actions={[
              <Button
                key="register"
                type="primary"
                size="large"
                onClick={() => handleRegister(workshop.id, workshop.title, 'workshop')}
                className={styles.register_button}
              >
                {t('events.registerNow')}
              </Button>
            ]}
          >
            <div className={styles.card_content}>
              <Title level={4} className={styles.event_title}>
                {workshop.title}
              </Title>
              
              {workshop.summary && (
                <Text className={styles.workshop_summary}>
                  {workshop.summary}
                </Text>
              )}
              
              <Space direction="vertical" size="small" className={styles.event_info}>
                <div className={styles.info_item}>
                  <CalendarOutlined className={styles.info_icon} />
                  <span>{formatDateRange(workshop.startDate, workshop.endDate)}</span>
                </div>

                <div className={styles.info_item}>
                  <ClockCircleOutlined className={styles.info_icon} />
                  <span>
                    {t('events.registrationDeadline')}: {new Date(workshop.deadline).toLocaleDateString()}
                  </span>
                </div>

                {workshop.locations && workshop.locations.length > 0 && (
                  <div className={styles.info_item}>
                    <EnvironmentOutlined className={styles.info_icon} />
                    <span>{workshop.locations[0]?.address || workshop.locations[0]?.region || 'TBA'}</span>
                  </div>
                )}

                <div className={styles.info_item}>
                  <UserOutlined className={styles.info_icon} />
                  <span>
                    {workshop.currentParticipants || 0}/{workshop.maxParticipants || 0} {t('events.participants')}
                  </span>
                </div>
              </Space>
            </div>
          </Card>
        ))}
      </div>

      <RegistrationModal
        visible={registrationModal.visible}
        eventId={registrationModal.eventId}
        eventTitle={registrationModal.eventTitle}
        eventType={registrationModal.eventType}
        onClose={handleRegistrationClose}
      />
    </div>
  );
}
