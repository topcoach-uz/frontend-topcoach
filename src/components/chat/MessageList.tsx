import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Spin, Empty, Typography } from 'antd';
import {
  useGetConversationMessagesQuery,
  useGetConversationQuery,
  useMarkThreadAsReadMutation,
  useMarkConversationAsReadMutation,
  chatApi,
} from 'src/app/services/chat/chatApi';
import { useAppDispatch } from 'src/app/store';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { useChatMessages } from './useChatMessages';
import styles from './MessageList.module.scss';

const { Text } = Typography;

interface MessageListProps {
  conversationId: string;
  threadId?: string;
}

const MessageList: React.FC<MessageListProps> = ({
  conversationId,
  threadId,
}) => {
  const dispatch = useAppDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
    data: messagesData,
    isLoading,
    isFetching,
  } = useGetConversationMessagesQuery(
    {
      conversationId,
      threadId,
      page: 1,
      limit: 50,
    },
    {
      pollingInterval: 5000, // Poll every 5 seconds for new messages
    }
  );

  // Fetch conversation data to pass to MessageBubble
  const { data: conversation } = useGetConversationQuery(conversationId, {
    skip: !conversationId,
  });

  // Mark as read mutations
  const [markThreadAsRead] = useMarkThreadAsReadMutation();
  const [markConversationAsRead] = useMarkConversationAsReadMutation();

  const messages = messagesData?.messages || [];
  const total = messagesData?.total || 0;

  // Setup real-time message updates via Socket.io
  useChatMessages({
    conversationId,
    threadId,
  });

  // Mark thread/conversation as read when messages are loaded
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const markAsRead = async () => {
        try {
          if (threadId) {
            // Mark thread as read
            await markThreadAsRead(threadId).unwrap();
          } else {
            // Mark conversation as read
            await markConversationAsRead(conversationId).unwrap();
          }
        } catch (error) {
          console.error('Error marking as read:', error);
        }
      };
      
      // Small delay to ensure messages are rendered
      const timer = setTimeout(markAsRead, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, messages.length, threadId, conversationId, markThreadAsRead, markConversationAsRead]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMore) {
      scrollToBottom();
    }
  }, [messages.length, isLoadingMore]);

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // Load more messages when scrolling to top
  const handleScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      if (
        target.scrollTop === 0 &&
        hasMore &&
        !isLoadingMore &&
        !isFetching
      ) {
        setIsLoadingMore(true);
        try {
          const nextPage = page + 1;
          const result = await dispatch(
            chatApi.endpoints.getConversationMessages.initiate({
              conversationId,
              threadId,
              page: nextPage,
              limit: 50,
            })
          );

          if (result.data) {
            setPage(nextPage);
            setHasMore(result.data.hasMore);
          }
        } catch (error) {
          console.error('Error loading more messages:', error);
        } finally {
          setIsLoadingMore(false);
        }
      }
    },
    [conversationId, threadId, page, hasMore, isLoadingMore, isFetching, dispatch]
  );

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { [key: string]: typeof messages } = {};
    messages.forEach((message) => {
      const date = new Date(message.sentAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  }, [messages]);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <Empty
          description="No messages yet. Start the conversation!"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div
      className={styles.messageList}
      ref={messagesContainerRef}
      onScroll={handleScroll}
    >
      {isLoadingMore && (
        <div className={styles.loadingMore}>
          <Spin size="small" />
        </div>
      )}

      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          <div className={styles.dateHeader}>
            <Text type="secondary">{formatDateHeader(date)}</Text>
          </div>
          {dateMessages.map((message) => (
            <MessageBubble key={message.id} message={message} conversation={conversation} />
          ))}
        </div>
      ))}

      <TypingIndicator conversationId={conversationId} threadId={threadId} />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

