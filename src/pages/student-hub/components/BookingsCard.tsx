/**
 * Bookings Card Component for Dashboard
 * Compact version of BookingsSection from Home page
 */

import React, { useState } from 'react';
import { Card, Tabs, Empty, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from '../../../app/store';
import { SessionTypeEnum } from '../../../app/api/Api';
import UpcomingCard from '../../../pages/home/_components/bookings/_components/upcamingcards';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import { BOOKING_ICONS } from '../../../constants/icons';
import { useNavigate } from 'react-router-dom';
import './BookingsCard.scss';

interface BookingsCardProps {
  compact?: boolean;
  maxItems?: number;
}

const BookingsCard: React.FC<BookingsCardProps> = ({ compact = true, maxItems = 3 }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile: meData } = useTypedSelector((state) => state.auth);

  const joinedSessions = meData?.joinedSessions;
  
  const upcomingSessions = joinedSessions?.filter(
    (session: any) => new Date(session.date) > new Date() && !session.cancelStatus
  )?.slice(0, maxItems);
  
  const pastSessions = joinedSessions?.filter((session: any) => {
    const sessionDuration = session.type === SessionTypeEnum.Individual30M ? 30 : 60;
    const sessionEndTime = new Date(session.date).getTime() + sessionDuration * 60 * 1000;
    return new Date().getTime() > sessionEndTime;
  })?.slice(0, maxItems);
  
  const cancelledSessions = joinedSessions?.filter(
    (session: any) => session.cancelStatus !== null && session.cancelStatus.id
  )?.slice(0, maxItems);

  const [activeTab, setActiveTab] = useState('1');

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <UnifiedIcon name={BOOKING_ICONS.BOOKING} size="sm" color="primary" style={{ marginRight: 4 }} />
          {t('home.upcoming')}
          {upcomingSessions && upcomingSessions.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: 12, color: '#8b0000' }}>
              ({upcomingSessions.length})
            </span>
          )}
        </span>
      ),
      children:
        upcomingSessions && upcomingSessions?.length > 0 ? (
          <div className="bookings-list" style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
            {upcomingSessions.map((session: any, index: number) => (
              <UpcomingCard
                key={index}
                duration={session.type === SessionTypeEnum.Individual30M ? 30 : 60}
                reportCheck={false}
                rateCheck={false}
                {...session}
              />
            ))}
            {!compact && joinedSessions?.filter((s: any) => new Date(s.date) > new Date() && !s.cancelStatus).length > maxItems && (
              <Button 
                type="link" 
                onClick={() => navigate('/')}
                style={{ width: '100%', marginTop: 8 }}
              >
                {t('studentHub.dashboard.viewAll')} →
              </Button>
            )}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span>{t('home.noUpcoming')}</span>
                <Button 
                  type="primary"
                  size="middle"
                  onClick={() => navigate('/mentors')}
                  icon={<UnifiedIcon name="calendar" size="md" color="white" />}
                  style={{ marginTop: 8 }}
                >
                  {t('studentHub.dashboard.bookMentor') || 'Book a Mentor'}
                </Button>
              </div>
            }
          />
        ),
    },
    {
      key: '2',
      label: t('home.past'),
      children:
        pastSessions && pastSessions?.length > 0 ? (
          <div className="bookings-list" style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
            {pastSessions.map((session: any, index: number) => (
              <UpcomingCard
                key={index}
                duration={session.type === SessionTypeEnum.Individual30M ? 30 : 60}
                cancelCheck={false}
                rateCheck={true}
                {...session}
              />
            ))}
            {!compact && joinedSessions?.filter((s: any) => {
              const duration = s.type === SessionTypeEnum.Individual30M ? 30 : 60;
              const endTime = new Date(s.date).getTime() + duration * 60 * 1000;
              return new Date().getTime() > endTime;
            }).length > maxItems && (
              <Button 
                type="link" 
                onClick={() => navigate('/')}
                style={{ width: '100%', marginTop: 8 }}
              >
                {t('studentHub.dashboard.viewAll')} →
              </Button>
            )}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('home.noPast')}
          />
        ),
    },
    {
      key: '3',
      label: t('home.canceled'),
      children:
        cancelledSessions && cancelledSessions?.length > 0 ? (
          <div className="bookings-list" style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
            {cancelledSessions.map((session: any, index: number) => (
              <UpcomingCard
                key={index}
                duration={session.type === SessionTypeEnum.Individual30M ? 30 : 60}
                cancelCheck={false}
                rateCheck={false}
                {...session}
              />
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                {t('home.noCanceled')}
                <br />
                <small style={{ color: '#999' }}>{t('home.noCanceledDesc')}</small>
              </span>
            }
          />
        ),
    },
  ];

  if (compact) {
    // Compact view - only show upcoming tab (for Priority 1 placement)
    return (
      <Card
        title={
          <span>
            <UnifiedIcon name={BOOKING_ICONS.BOOKING} size="md" color="primary" style={{ marginRight: 8 }} />
            {t('home.upcomingbooking')}
          </span>
        }
        className="dashboard-bookings-card"
        extra={
          <span style={{ fontSize: 13, color: '#666' }}>
            {t('home.upcomingDesc')}
          </span>
        }
      >
        {upcomingSessions && upcomingSessions.length > 0 ? (
          <div className="bookings-list-compact">
            {upcomingSessions.slice(0, 2).map((session: any, index: number) => (
              <UpcomingCard
                key={index}
                duration={session.type === SessionTypeEnum.Individual30M ? 30 : 60}
                reportCheck={false}
                rateCheck={false}
                {...session}
              />
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span>{t('home.noUpcoming')}</span>
                <Button 
                  type="primary"
                  size="middle"
                  onClick={() => navigate('/mentors')}
                  icon={<UnifiedIcon name="calendar" size="md" color="white" />}
                  style={{ marginTop: 8 }}
                >
                  {t('studentHub.dashboard.bookMentor')}
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
          <UnifiedIcon name={BOOKING_ICONS.BOOKING} size="md" color="primary" style={{ marginRight: 8 }} />
          {t('home.upcomingbooking')}
        </span>
      }
      className="dashboard-bookings-card"
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

export default BookingsCard;
