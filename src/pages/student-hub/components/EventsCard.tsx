/**
 * Events Card Component for Dashboard
 * Compact version of EventsSection from Home page
 */

import React, { useState } from 'react';
import { Card, Tabs, Empty, Button, Badge, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { ApplicationStatusEnum } from '../../../app/api/Api';
import useMentee from '../../../pages/home/mentee/useMentee';
import EventCardComp from '../../../pages/home/_components/events/_component';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import { useNavigate } from 'react-router-dom';
import { useGetCaafForumApplicationsMeQuery } from '../../../app/services/caafForumApi';
import { CAAF_FORUM_CARD_IMAGE } from '../../events/central-asian-admissions-forum/constants';
import './EventsCard.scss';

interface EventsCardProps {
  compact?: boolean;
  maxItems?: number;
}

const EventsCard: React.FC<EventsCardProps> = ({ compact = true, maxItems = 3 }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { menteeEventData, isLoading } = useMentee();
  const { data: caafMe, isLoading: isCaafLoading } = useGetCaafForumApplicationsMeQuery();

  const mapCaafStatus = (
    status: 'pending_payment' | 'paid' | 'refunded' | 'cancelled',
  ): ApplicationStatusEnum => {
    if (status === 'pending_payment') return ApplicationStatusEnum.Pending;
    if (status === 'paid') return ApplicationStatusEnum.Successful;
    return ApplicationStatusEnum.Rejected;
  };

  const caafApplication = caafMe?.application;
  const caafAsEvent = caafApplication
    ? [
        {
          id: `caaf-${caafApplication.id}`,
          status: mapCaafStatus(caafApplication.status),
          caafStatus: caafApplication.status,
          isCaaf: true,
          title: 'Central Asian Admissions Forum 2026',
          date: caafApplication.submittedAt,
          img: CAAF_FORUM_CARD_IMAGE,
        },
      ]
    : [];

  const allEvents = [...(Array.isArray(menteeEventData) ? menteeEventData : []), ...caafAsEvent];

  const getEventStatusText = (item: any): string => {
    if (item.isCaaf) {
      if (item.caafStatus === 'pending_payment') {
        return t('caafForum.card.tag.pending', 'Pending payment');
      }
      if (item.caafStatus === 'paid') {
        return t('caafForum.card.tag.registered', 'Registered');
      }
      return t('home.rejected');
    }
    if (item.status === ApplicationStatusEnum.Pending) return t('home.reviewing');
    if (item.status === ApplicationStatusEnum.Successful) return t('home.accepted');
    return t('home.rejected');
  };

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
    if (isLoading || isCaafLoading) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          padding: 40,
        }}>
          <Spin size="large" />
          <span style={{ marginTop: 16, color: '#666' }}>Loading...</span>
        </div>
      );
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
            img={item.img || '/img/upcoming_event/event_mobile.png'}
            status={item.status}
            statusText={getEventStatusText(item)}
            title={item.title || 'Top 100 Uni Camp 2025'}
            date={item.date ? new Date(item.date).toLocaleDateString() : '25.05.2025'}
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
        {isLoading || isCaafLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
            padding: 40,
          }}>
            <Spin size="large" />
            <span style={{ marginTop: 16, color: '#666' }}>Loading...</span>
          </div>
        ) : allEvents.length > 0 ? (
          <div className="events-list-compact">
            {allEvents.slice(0, 2).map((item) => (
              <EventCardComp
                key={item.id}
                img={item.img || '/img/upcoming_event/event_mobile.png'}
                status={item.status}
                statusText={getEventStatusText(item)}
                title={item.title || 'Top 100 Uni Camp 2025'}
                date={item.date ? new Date(item.date).toLocaleDateString() : '25.05.2025'}
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
