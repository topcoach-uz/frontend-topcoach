/**
 * Read-only Mentor Bookings card for counselor view of a student's sessions
 * Uses student-journey mentor-bookings API instead of auth user's joinedSessions
 */
import React, { useState } from 'react';
import { Tabs, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { SessionTypeEnum } from 'src/app/api/Api';
import UpcomingCard from 'src/pages/home/_components/bookings/_components/upcamingcards';
import { useGetStudentJourneyMentorBookingsQuery } from 'src/app/services/student-hub/studentJourneyReadonlyApi';
import 'src/pages/student-hub/components/BookingsCard.scss';

interface StudentDataBookingsCardProps {
  studentUserId: string;
  maxItems?: number;
}

const StudentDataBookingsCard: React.FC<StudentDataBookingsCardProps> = ({
  studentUserId,
  maxItems = 5,
}) => {
  const { t } = useTranslation();
  const { data, isLoading } = useGetStudentJourneyMentorBookingsQuery(studentUserId, {
    skip: !studentUserId,
  });

  const joinedSessions = data?.data || [];
  const upcomingSessions = joinedSessions.filter(
    (s: any) => new Date(s.date) > new Date() && !s.cancelStatus
  ).slice(0, maxItems);
  const pastSessions = joinedSessions
    .filter((s: any) => {
      const duration = s.type === SessionTypeEnum.Individual30M ? 30 : 60;
      const endTime = new Date(s.date).getTime() + duration * 60 * 1000;
      return new Date().getTime() > endTime;
    })
    .slice(0, maxItems);
  const cancelledSessions = joinedSessions
    .filter((s: any) => s.cancelStatus != null && s.cancelStatus.id)
    .slice(0, maxItems);

  const [activeTab, setActiveTab] = useState('1');

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          {t('home.upcoming')}
          {upcomingSessions.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: 12, color: '#8b0000' }}>
              ({upcomingSessions.length})
            </span>
          )}
        </span>
      ),
      children:
        upcomingSessions.length > 0 ? (
          <div className="bookings-list" style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
            {upcomingSessions.map((session: any, index: number) => (
              <UpcomingCard
                key={session.id}
                {...session}
                duration={session.type === SessionTypeEnum.Individual30M ? 30 : 60}
                cancelCheck={false}
                reportCheck={false}
                rateCheck={false}
                hideChatButton
              />
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('home.noUpcoming')} />
        ),
    },
    {
      key: '2',
      label: t('home.past'),
      children:
        pastSessions.length > 0 ? (
          <div className="bookings-list" style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
            {pastSessions.map((session: any, index: number) => (
              <UpcomingCard
                key={session.id}
                {...session}
                duration={session.type === SessionTypeEnum.Individual30M ? 30 : 60}
                cancelCheck={false}
                rateCheck={false}
                hideChatButton
              />
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('home.noPast')} />
        ),
    },
    {
      key: '3',
      label: t('home.canceled'),
      children:
        cancelledSessions.length > 0 ? (
          <div className="bookings-list" style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
            {cancelledSessions.map((session: any) => (
              <UpcomingCard
                key={session.id}
                {...session}
                duration={session.type === SessionTypeEnum.Individual30M ? 30 : 60}
                cancelCheck={false}
                rateCheck={false}
                hideChatButton
              />
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('home.noCanceled')}
          />
        ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>
        {t('Loading')}...
      </div>
    );
  }

  return (
    <Tabs
      activeKey={activeTab}
      items={tabItems}
      onChange={setActiveTab}
      size="small"
    />
  );
};

export default StudentDataBookingsCard;
