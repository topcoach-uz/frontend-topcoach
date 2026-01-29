/**
 * Events Card Component for Dashboard
 * Compact version of EventsSection from Home page
 */

import React, { useState } from 'react';
import { Card, Tabs, Empty, Button, Badge } from 'antd';
import { useTranslation } from 'react-i18next';
import { ApplicationStatusEnum } from '../../../app/api/Api';
import useMentee from '../../../pages/home/mentee/useMentee';
import EventCardComp from '../../../pages/home/_components/events/_component';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import { useNavigate } from 'react-router-dom';
import './EventsCard.scss';

interface EventsCardProps {
  compact?: boolean;
  maxItems?: number;
}

const EventsCard: React.FC<EventsCardProps> = ({ compact = true, maxItems = 3 }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { menteeEventData, isLoading } = useMentee();
  const allEvents = Array.isArray(menteeEventData) ? menteeEventData : [];

  const pendingEvents = allEvents.filter(
    (event) => event.status === ApplicationStatusEnum.Pending
  ).slice(0, maxItems);
  const acceptedEvents = allEvents.filter(
    (event) => event.status === ApplicationStatusEnum.Successful
  ).slice(0, maxItems);
  const rejectedEvents = allEvents.filter(
    (event) => event.status === ApplicationStatusEnum.Rejected
  ).slice(0, maxItems);

  const [activeTab, setActiveTab] = useState('1');

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          {t('home.all')}
          {allEvents.length > 0 && (
            <Badge count={allEvents.length} size="small" style={{ marginLeft: 8 }} />
          )}
        </span>
      ),
      children: renderEvents(allEvents.slice(0, maxItems), allEvents.length > maxItems),
    },
    {
      key: '2',
      label: (
        <span>
          {t('home.reviewing')}
          {pendingEvents.length > 0 && (
            <Badge count={pendingEvents.length} size="small" style={{ marginLeft: 8 }} />
          )}
        </span>
      ),
      children: renderEvents(pendingEvents, pendingEvents.length > maxItems),
    },
    {
      key: '3',
      label: t('home.accepted'),
      children: renderEvents(acceptedEvents, acceptedEvents.length > maxItems),
    },
    {
      key: '4',
      label: t('home.rejected'),
      children: renderEvents(rejectedEvents, rejectedEvents.length > maxItems),
    },
  ];

  function renderEvents(events: any[], showViewAll: boolean = false) {
    if (isLoading) {
      return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
    }

    if (events.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <span>{t('home.noEvents')}</span>
              <Button
                type="primary"
                size="middle"
                onClick={() => navigate('/events')}
                icon={<UnifiedIcon name="calendar" size="md" color="white" />}
                style={{ marginTop: 8 }}
              >
                {t('studentHub.dashboard.seeWorkshops') || 'See workshops'}
              </Button>
            </div>
          }
        />
      );
    }

    return (
      <div className="events-list">
        {events.map((item) => (
          <EventCardComp
            key={item.id}
            img={'/img/upcoming_event/event_mobile.png'}
            status={item.status}
            statusText={
              item.status === ApplicationStatusEnum.Pending
                ? t('home.reviewing')
                : item.status === ApplicationStatusEnum.Successful
                  ? t('home.accepted')
                  : t('home.rejected')
            }
            title="Top 100 Uni Camp 2025"
            date="25.05.2025"
          />
        ))}
        {showViewAll && !compact && (
          <Button 
            type="link" 
            onClick={() => navigate('/events')}
            style={{ width: '100%', marginTop: 8 }}
          >
            {t('studentHub.dashboard.viewAll')} →
          </Button>
        )}
      </div>
    );
  }

  if (compact) {
    // Compact view - show all events in one list
    return (
      <Card
        title={
          <span>
            <UnifiedIcon name="calendar" size="md" color="primary" style={{ marginRight: 8 }} />
            {t('home.events')}
          </span>
        }
        className="dashboard-events-card"
        extra={
          <Button type="link" size="small" onClick={() => navigate('/events')}>
            {t('studentHub.dashboard.viewAll')}
          </Button>
        }
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : allEvents.length > 0 ? (
          <div className="events-list-compact">
            {allEvents.slice(0, 2).map((item) => (
              <EventCardComp
                key={item.id}
                img={'/img/upcoming_event/event_mobile.png'}
                status={item.status}
                statusText={
                  item.status === ApplicationStatusEnum.Pending
                    ? t('home.reviewing')
                    : item.status === ApplicationStatusEnum.Successful
                      ? t('home.accepted')
                      : t('home.rejected')
                }
                title="Top 100 Uni Camp 2025"
                date="25.05.2025"
              />
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span>{t('home.noEvents')}</span>
                {t('home.noEventsDesc') && (
                  <small style={{ color: '#999' }}>{t('home.noEventsDesc')}</small>
                )}
                <Button
                  type="primary"
                  size="middle"
                  onClick={() => navigate('/events')}
                  icon={<UnifiedIcon name="calendar" size="md" color="white" />}
                  style={{ marginTop: 8 }}
                >
                  {t('studentHub.dashboard.seeWorkshops') || 'See workshops'}
                </Button>
              </div>
            }
          />
        )}
      </Card>
    );
  }

  return (
    <Card
      title={
        <span>
          <UnifiedIcon name="calendar" size="md" color="primary" style={{ marginRight: 8 }} />
          {t('home.events')}
        </span>
      }
      className="dashboard-events-card"
    >
      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={(key) => setActiveTab(key)}
        size="small"
      />
    </Card>
  );
};

export default EventsCard;
