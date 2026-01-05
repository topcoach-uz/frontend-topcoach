import React from 'react';
import { List, Typography } from 'antd';
import { useGetThreadsQuery, useGetConversationQuery } from 'src/app/services/chat/chatApi';
import { ConversationThread } from 'src/app/services/chat/types';
import { useTypedSelector } from 'src/app/store';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './ThreadSelector.module.scss';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface ThreadSelectorProps {
  conversationId: string;
  onThreadSelect?: (threadId: string) => void;
  selectedThreadId?: string;
}

const ThreadSelector: React.FC<ThreadSelectorProps> = ({
  conversationId,
  onThreadSelect,
  selectedThreadId,
}) => {
  const currentUser = useTypedSelector((state) => state.auth.profile);
  const { data: threadsData, isLoading: threadsLoading } = useGetThreadsQuery(conversationId);
  const { data: conversation, isLoading: conversationLoading } = useGetConversationQuery(conversationId);

  const threads = threadsData?.threads || [];

  const getOtherUser = () => {
    if (!conversation || !currentUser?.id) return null;
    if (conversation.mentorId === currentUser.id) {
      return conversation.student;
    }
    return conversation.mentor;
  };

  const otherUser = getOtherUser();
  const otherUserName = otherUser?.profile?.name || otherUser?.email || 'User';
  const isCurrentUserMentor = conversation?.mentorId === currentUser?.id;
  const otherUserRole = isCurrentUserMentor ? 'Student' : 'Mentor';

  const getUnreadCount = (thread: ConversationThread) => {
    if (!currentUser?.id) return 0;
    if (conversation?.mentorId === currentUser.id) {
      return thread.unreadCountMentor;
    }
    return thread.unreadCountStudent;
  };

  const handleThreadClick = (threadId: string) => {
    if (onThreadSelect) {
      onThreadSelect(threadId);
    }
  };

  if (threadsLoading || conversationLoading) {
    return <div className={styles.loading}>Loading threads...</div>;
  }

  if (threads.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text type="secondary">No session threads yet</Text>
      </div>
    );
  }

  return (
    <div className={styles.threadSelector}>
      <div className={styles.threadHeader}>
        <Text strong>Session Threads</Text>
      </div>
      <List
        dataSource={threads}
        renderItem={(thread) => {
          const unreadCount = getUnreadCount(thread);
          const isSelected = thread.id === selectedThreadId;

          return (
            <List.Item
              className={`${styles.threadItem} ${
                isSelected ? styles.selected : ''
              } ${unreadCount > 0 ? styles.unread : ''}`}
              onClick={() => handleThreadClick(thread.id)}
            >
              <div className={styles.threadContent}>
                <Text className={styles.threadTitle}>
                  {otherUserName} ({otherUserRole}) - {thread.title || 'Untitled Thread'}
                </Text>
                {thread.lastMessageAt && (
                  <Text type="secondary" className={styles.threadTime}>
                    {dayjs(thread.lastMessageAt).fromNow()}
                  </Text>
                )}
              </div>
              {unreadCount > 0 && (
                <span className={styles.unreadBadge}>{unreadCount}</span>
              )}
            </List.Item>
          );
        }}
      />
    </div>
  );
};

export default ThreadSelector;

