import React, { useState } from 'react';
import { Card, List, Badge, Button, Space, Tag, message, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { useStudentHub } from '../../../hooks/useStudentHub';
import { formatTimeAgo } from '../../../utils/dateFormatter';
import './NotificationsPage.scss';

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { dashboard, isLoading } = useStudentHub();

  // Use real data from API
  const notificationsData = {
    overview: {
      totalNotifications: dashboard?.stats?.totalNotifications || 0,
      unread: dashboard?.stats?.unreadNotifications || 0,
      today: dashboard?.stats?.todayNotifications || 0,
      thisWeek: dashboard?.stats?.thisWeekNotifications || 0,
    },
    notifications: dashboard?.recentNotifications || [],
  };

  // Button click handlers
  const handleMarkAsRead = (notificationId: string) => {
    message.success('Notification marked as read');
  };

  const handleMarkAllAsRead = () => {
    message.success('All notifications marked as read');
  };

  const handleViewNotification = (notificationId: string) => {
    navigate(`/student-hub/notifications/${notificationId}`);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return 'calendar-exclamation';
      case 'application':
        return 'building';
      case 'essay':
        return 'pen';
      case 'document':
        return 'file';
      case 'profile':
        return 'user';
      case 'system':
        return 'cog';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'deadline':
        return 'error';
      case 'application':
        return 'processing';
      case 'essay':
        return 'warning';
      case 'document':
        return 'success';
      case 'profile':
        return 'default';
      case 'system':
        return 'purple';
      default:
        return 'default';
    }
  };


  // Show loading state
  if (isLoading) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner">
          <FontAwesomeIcon icon="spinner" spin />
        </div>
        <p>Loading your notifications...</p>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        <p className="page-subtitle">Stay updated with your college application progress</p>
      </div>

      <Card className="notifications-main-card">
        {/* Notification Stats */}
        <div className="stats-section">
          <div className="stat-item">
            <div className="stat-icon">
              <FontAwesomeIcon icon="bell" />
            </div>
            <div className="stat-info">
              <div className="stat-number">{notificationsData.overview.totalNotifications}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon unread">
              <FontAwesomeIcon icon="exclamation-circle" />
            </div>
            <div className="stat-info">
              <div className="stat-number">{notificationsData.overview.unread}</div>
              <div className="stat-label">Unread</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon today">
              <FontAwesomeIcon icon="calendar-day" />
            </div>
            <div className="stat-info">
              <div className="stat-number">{notificationsData.overview.today}</div>
              <div className="stat-label">Today</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon week">
              <FontAwesomeIcon icon="calendar-week" />
            </div>
            <div className="stat-info">
              <div className="stat-number">{notificationsData.overview.thisWeek}</div>
              <div className="stat-label">This Week</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="actions-section">
          <Button 
            type="primary" 
            icon={<FontAwesomeIcon icon="check-double" />}
            onClick={handleMarkAllAsRead}
            disabled={notificationsData.overview.unread === 0}
          >
            Mark All as Read
          </Button>
        </div>

        {/* Notifications List */}
        <div className="notifications-list">
          {notificationsData.notifications.length > 0 ? (
            <List
              dataSource={notificationsData.notifications}
              renderItem={(notification: any) => (
                <List.Item className={`notification-item ${!notification.read ? 'unread' : ''}`}>
                  <Card className="notification-card">
                    <div className="notification-content">
                      <div className="notification-icon">
                        <FontAwesomeIcon icon={getNotificationIcon(notification.type)} />
                      </div>
                      <div className="notification-body">
                        <div className="notification-header">
                          <h4 className="notification-title">{notification.title}</h4>
                          <div className="notification-meta">
                            <Tag color={getNotificationColor(notification.type)}>
                              {notification.type.toUpperCase()}
                            </Tag>
                            <span className="notification-time">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="notification-message">{notification.message}</p>
                        {notification.action && (
                          <div className="notification-actions">
                            <Space>
                              <Button
                                type="link"
                                size="small"
                                onClick={() => handleViewNotification(notification.id)}
                              >
                                View Details
                              </Button>
                              {!notification.read && (
                                <Button
                                  type="link"
                                  size="small"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  Mark as Read
                                </Button>
                              )}
                            </Space>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <div className="empty-state">
              <Empty
                image={<FontAwesomeIcon icon="bell-slash" />}
                description={
                  <div>
                    <h4>No notifications yet</h4>
                    <p>You'll receive notifications about deadlines, application updates, and important reminders here.</p>
                  </div>
                }
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;