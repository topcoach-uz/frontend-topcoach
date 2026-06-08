import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Popover, List, Button, Empty, Spin, notification as antdNotification } from 'antd';
import { BellDot, Bell, Check, UserPlus, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsReadMutation,
} from 'src/app/services/student-hub/dashboardApi';
import { RtkApi } from 'src/app/services/api';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { useSocket } from 'src/lib/socket';
import { useSmartPolling } from 'src/hooks/useSmartPolling';
import { ACCESS_TOKEN } from 'src/constants/storage';
import { formatTimeAgo } from 'src/utils/dateFormatter';
import styles from './NotificationBell.module.scss';

function getHasToken(): boolean {
  try {
    return typeof window !== 'undefined' && !!localStorage.getItem(ACCESS_TOKEN);
  } catch {
    return false;
  }
}

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  status?: string;
  actionUrl?: string;
  targetUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
};

function iconForType(type: string) {
  switch (type) {
    case 'study_buddy_request':
      return <UserPlus size={16} color="#8b0000" />;
    case 'study_buddy_accepted':
      return <UserCheck size={16} color="#8b0000" />;
    default:
      return <Bell size={16} color="#8b0000" />;
  }
}

const NotificationBell: React.FC = () => {
  const isAuthenticated = useTypedSelector((s) => s.auth?.isAuthenticated ?? false);
  const hasToken = getHasToken();
  const showIcon = isAuthenticated || hasToken;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);

  const pollInterval = useSmartPolling(60000);

  const { data: listData, isLoading } = useGetNotificationsQuery(
    { page: 1, limit: 12 },
    { skip: !showIcon, pollingInterval: pollInterval, refetchOnFocus: true, refetchOnReconnect: true },
  );
  const { data: countData } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !showIcon,
    pollingInterval: pollInterval,
    refetchOnFocus: true,
  });

  const [markRead] = useMarkNotificationAsReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  // Backend returns { notifications, total, unreadCount }; tolerate other shapes.
  const notifications: NotificationRow[] = useMemo(() => {
    const d = listData as any;
    return d?.notifications ?? d?.data ?? [];
  }, [listData]);

  const unreadCount = useMemo(() => {
    const c = countData as any;
    return c?.unreadCount ?? c?.count ?? c?.data?.count ?? 0;
  }, [countData]);

  // Real-time: a new notification arrived over the socket → refresh the bell
  // (and the Study Buddy requests dot) and pop a toast.
  const { socket, isConnected, on, off } = useSocket({ autoConnect: true });
  useEffect(() => {
    if (!socket || !isConnected || !showIcon) return;

    const handleNotification = (payload: any) => {
      const n = payload?.notification ?? payload;
      dispatch(RtkApi.util.invalidateTags(['Notifications', 'StudyBuddy']));
      if (n?.title) {
        antdNotification.open({
          message: n.title,
          description: n.message,
          icon: iconForType(n.type),
          placement: 'topRight',
          duration: 5,
          onClick: () => {
            const conversationId = n.metadata?.conversationId;
            if (conversationId) {
              window.dispatchEvent(
                new CustomEvent('openChat', {
                  detail: { conversationId, threadId: n.metadata?.threadId },
                }),
              );
            } else {
              const url = n.actionUrl || n.metadata?.actionUrl;
              if (url) navigate(url);
            }
            antdNotification.destroy();
          },
        });
      }
    };

    on('notification', handleNotification);
    return () => {
      off('notification', handleNotification);
    };
  }, [socket, isConnected, showIcon, on, off, dispatch, navigate]);

  // Route a notification to its target: open the chat modal directly when it
  // carries a conversationId (e.g. an accepted study buddy request), otherwise
  // navigate to its deep-link URL.
  const openTarget = useCallback(
    (n: NotificationRow) => {
      const conversationId = n.metadata?.conversationId;
      if (conversationId) {
        window.dispatchEvent(
          new CustomEvent('openChat', {
            detail: { conversationId, threadId: n.metadata?.threadId },
          }),
        );
        return;
      }
      const url = n.actionUrl || n.targetUrl;
      if (url) navigate(url);
    },
    [navigate],
  );

  const handleItemClick = useCallback(
    async (n: NotificationRow) => {
      setOpen(false);
      if (n.status === 'unread') {
        try {
          await markRead(n.id).unwrap();
        } catch {
          /* non-blocking */
        }
      }
      openTarget(n);
    },
    [markRead, openTarget],
  );

  const handleMarkAll = useCallback(async () => {
    try {
      await markAllRead().unwrap();
    } catch {
      /* non-blocking */
    }
  }, [markAllRead]);

  if (!showIcon) return null;

  const content = (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Notifications</span>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<Check size={14} />}
            loading={markingAll}
            onClick={handleMarkAll}
            className={styles.markAllBtn}
          >
            Mark all read
          </Button>
        )}
      </div>

      <div className={styles.panelBody}>
        {isLoading && !notifications.length ? (
          <div className={styles.panelLoading}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="You're all caught up" />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(n) => (
              <List.Item
                className={`${styles.item} ${n.status === 'unread' ? styles.itemUnread : ''}`}
                onClick={() => handleItemClick(n)}
              >
                <div className={styles.itemIcon}>{iconForType(n.type)}</div>
                <div className={styles.itemMain}>
                  <div className={styles.itemTitle}>{n.title}</div>
                  <div className={styles.itemMessage}>{n.message}</div>
                  <div className={styles.itemTime}>{formatTimeAgo(n.createdAt)}</div>
                </div>
                {n.status === 'unread' && <span className={styles.itemDot} />}
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      overlayClassName={styles.popover}
      arrow={false}
    >
      <div
        className={styles.bellWrapper}
        role="button"
        tabIndex={0}
        aria-label="Notifications"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        <BellDot size={20} color="#fff" />
        {unreadCount > 0 && (
          <span className={styles.bellBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </div>
    </Popover>
  );
};

function NotificationBellWithBoundary() {
  return (
    <ErrorBoundary fallbackRender={() => null}>
      <NotificationBell />
    </ErrorBoundary>
  );
}

export default NotificationBellWithBoundary;
