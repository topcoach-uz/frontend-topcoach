import { useTranslation } from 'react-i18next';
import { Card, Button, Space, Tag, Typography, message } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { formatDateRange, getLatestCreatedImg } from 'src/utils';
import { MEDIA_TAGS, MediaSchema } from 'src/app/api/Api';
import { useState, useEffect } from 'react';
import RegistrationModal from './RegistrationModal';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import RichTextRenderer from 'src/pages/universities/_components/detail/richText';
import { api } from 'src/app/api';
import { useTypedSelector } from 'src/app/store';
import { useNavigate } from 'react-router-dom';
import styles from './UpcomingEventsSection.module.scss';

const { Title, Text } = Typography;

interface Event {
  id: string;
  title: string;
  summary?: string;
  content?: {
    blocks: any[];
  };
  startDate: string;
  endDate: string;
  media: MediaSchema[];
}

interface Workshop {
  id: string;
  title: string;
  summary: string;
  content?: {
    blocks: any[];
  };
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
  const navigate = useNavigate();
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
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
  
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());

  // Fetch user's existing registrations on component mount
  useEffect(() => {
    const fetchUserRegistrations = async () => {
      try {
        // Get all event IDs from upcoming events and workshops
        const allEventIds = [
          ...upcomingEvents.map(event => event.id),
          ...upcomingWorkshops.map(workshop => workshop.id)
        ];

        if (allEventIds.length === 0) return;

        // Check registrations for each event/workshop
        const registrationChecks = await Promise.allSettled(
          allEventIds.map(async (eventId) => {
            try {
              const response = await api.request({
                path: `/camps/events/${eventId}/registration-status`,
                method: 'GET',
                secure: true,
              });
              return response.data?.registered ? eventId : null;
            } catch (error) {
              return null; // If failed, user is not registered
            }
          })
        );

        // Extract successfully registered event IDs
        const registeredIds = registrationChecks
          .filter((result): result is PromiseFulfilledResult<string> => 
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value);

        setRegisteredEvents(new Set(registeredIds));
      } catch (error) {
        console.error('Error fetching user registrations:', error);
      }
    };

    fetchUserRegistrations();
  }, [upcomingEvents, upcomingWorkshops]);

  const handleRegister = (eventId: string, eventTitle: string, eventType: 'event' | 'workshop') => {
    // Check if user is authenticated before opening registration modal
    if (!isAuthenticated) {
      message.warning(t('events.signInRequired') || 'You need to sign in first to register for workshops.');
      navigate('/auth/signin');
      return;
    }
    
    setRegistrationModal({
      visible: true,
      eventId,
      eventTitle,
      eventType
    });
  };

  const handleRegistrationClose = (success: boolean = false) => {
    if (success && registrationModal.eventId) {
      setRegisteredEvents(prev => new Set([...prev, registrationModal.eventId]));
    }
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
              registeredEvents.has(event.id) ? (
                <Button
                  key="registered"
                  type="default"
                  size="large"
                  disabled
                  className={styles.registered_button}
                >
                  {t('events.registered')}
                </Button>
              ) : (
                <Button
                  key="register"
                  type="primary"
                  size="large"
                  onClick={() => handleRegister(event.id, event.title, 'event')}
                  className={styles.register_button}
                >
                  {t('events.registerNow')}
                </Button>
              )
            ]}
          >
            <div className={styles.card_content}>
              <Title level={4} className={styles.event_title}>
                {event.title}
              </Title>
              
              {event.summary && (
                <div className={styles.summary_section}>
                  <Text className={styles.event_summary}>
                    {getTranslation(event.summary)}
                  </Text>
                </div>
              )}

              {event.content?.blocks && event.content.blocks.length > 0 && (
                <div className={styles.content_section}>
                  <RichTextRenderer blocks={event.content.blocks} id={event.id} />
                </div>
              )}
              
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
            className={styles.workshop_card_horizontal}
            actions={[
              registeredEvents.has(workshop.id) ? (
                <Button
                  key="registered"
                  type="default"
                  size="large"
                  disabled
                  className={styles.registered_button}
                >
                  {t('events.registered')}
                </Button>
              ) : (
                <Button
                  key="register"
                  type="primary"
                  size="large"
                  onClick={() => handleRegister(workshop.id, workshop.title, 'workshop')}
                  className={styles.register_button}
                >
                  {t('events.registerNow')}
                </Button>
              )
            ]}
          >
            <div className={styles.workshop_horizontal_content}>
              {/* Tags in top right corner */}
              <div className={styles.workshop_tags_top_right}>
                <Tag color="blue" className={styles.workshop_tag}>
                  {t('events.workshop')}
                </Tag>
                <Tag color="green" className={styles.upcoming_tag}>
                  {t('events.upcoming')}
                </Tag>
              </div>

              {/* Image on the left */}
              <div className={styles.workshop_image_container}>
                <img 
                  src={getLatestCreatedImg(workshop.media, MEDIA_TAGS.General) || '/img/upcoming_event/event_mobile.png'} 
                  alt={workshop.title}
                  className={styles.workshop_image}
                />
              </div>

              {/* Text content on the right */}
              <div className={styles.workshop_text_content}>
                <Title level={4} className={styles.workshop_title}>
                  {workshop.title}
                </Title>
                
                {(workshop.summary && getTranslation(workshop.summary)) && (
                  <Text className={styles.workshop_summary_compact}>
                    {getTranslation(workshop.summary)}
                  </Text>
                )}

                {/* Location and date below text */}
                <div className={styles.workshop_meta}>
                  <Space direction="vertical" size="small" className={styles.workshop_info_compact}>
                    <div className={styles.info_item}>
                      <CalendarOutlined className={styles.info_icon} />
                      <span>{formatDateRange(workshop.startDate, workshop.endDate)}</span>
                    </div>

                    {workshop.locations && workshop.locations.length > 0 && (
                      <div className={styles.info_item}>
                        <EnvironmentOutlined className={styles.info_icon} />
                        <span>{workshop.locations[0]?.address || workshop.locations[0]?.region || 'TBA'}</span>
                      </div>
                    )}
                  </Space>
                </div>
              </div>
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
