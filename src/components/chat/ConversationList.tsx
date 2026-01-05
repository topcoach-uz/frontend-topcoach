import React, { useMemo, useEffect } from 'react';
import { List, Avatar, Empty, Spin, Typography } from 'antd';
import { useGetConversationsQuery, chatApi } from 'src/app/services/chat/chatApi';
import {
  Conversation,
  isConversationArray,
} from 'src/app/services/chat/types';
import { useTypedSelector, useAppDispatch } from 'src/app/store';
import { useSocket } from 'src/lib/socket';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './ConversationList.module.scss';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface ConversationListProps {
  onConversationClick: (conversationId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onConversationClick,
}) => {
  const dispatch = useAppDispatch();
  const { data: conversationsData, isLoading } = useGetConversationsQuery(
    undefined,
    {
      // Reduced polling since we have real-time updates via Socket.io
      pollingInterval: 60000, // Poll every 60 seconds as fallback
    }
  );
  const currentUser = useTypedSelector((state) => state.auth.profile);
  
  // Listen for real-time conversation updates
  const { socket, isConnected, on, off } = useSocket({ autoConnect: true });
  
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleConversationUpdate = () => {
      // Invalidate cache to refresh conversation list
      dispatch(chatApi.util.invalidateTags(['ChatConversations']));
    };

    on('conversation_updated', handleConversationUpdate);

    return () => {
      off('conversation_updated', handleConversationUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, dispatch]);

  const conversations = useMemo(() => {
    if (!conversationsData) return [];
    // Handle both array and object response formats
    if (isConversationArray(conversationsData)) {
      return conversationsData;
    }
    // If it's an object, check for conversations property
    return conversationsData.conversations || [];
  }, [conversationsData]);

  const getOtherUser = (conversation: Conversation) => {
    if (!currentUser?.id) return null;
    if (conversation.mentorId === currentUser.id) {
      return conversation.student;
    }
    return conversation.mentor;
  };

  const getUnreadCount = (conversation: Conversation) => {
    if (!currentUser?.id) return 0;
    if (conversation.mentorId === currentUser.id) {
      return conversation.unreadCountMentor;
    }
    return conversation.unreadCountStudent;
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    // This will be enhanced when we have message data
    if (conversation.lastMessageAt) {
      return dayjs(conversation.lastMessageAt).fromNow();
    }
    return 'No messages yet';
  };

  const handleConversationClick = (conversationId: string) => {
    onConversationClick(conversationId);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <Empty
          description="No conversations yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <List
      className={styles.conversationList}
      dataSource={conversations}
      renderItem={(conversation) => {
        const otherUser = getOtherUser(conversation);
        const unreadCount = getUnreadCount(conversation);
        const lastMessageTime = getLastMessagePreview(conversation);

        return (
          <List.Item
            className={`${styles.conversationItem} ${
              unreadCount > 0 ? styles.unread : ''
            }`}
            onClick={() => handleConversationClick(conversation.id)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  src={otherUser?.profile?.avatar}
                  size={48}
                  style={{ backgroundColor: '#8b0000' }}
                >
                  {otherUser?.profile?.name?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              }
              title={
                <div className={styles.conversationTitle}>
                  <Text strong className={styles.userName}>
                    {otherUser?.profile?.name ||
                      otherUser?.email ||
                      'Unknown User'}
                  </Text>
                  {unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{unreadCount}</span>
                  )}
                </div>
              }
              description={
                <Text type="secondary" className={styles.lastMessage}>
                  {lastMessageTime}
                </Text>
              }
            />
          </List.Item>
        );
      }}
    />
  );
};

export default ConversationList;

