import React, { useState } from 'react';
import { Badge } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { useGetUnreadCountQuery } from 'src/app/services/chat/chatApi';
import { useTypedSelector } from 'src/app/store';
import ChatModal from './ChatModal';
import styles from './ChatIcon.module.scss';

interface ChatIconProps {
  className?: string;
}

const ChatIcon: React.FC<ChatIconProps> = ({ className }) => {
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Fetch unread count
  const { data: unreadData, error: unreadError, isLoading: unreadLoading } = useGetUnreadCountQuery(
    undefined,
    {
      skip: !isAuthenticated,
      pollingInterval: 10000, // Poll every 10 seconds for real-time updates
    }
  );

  // Debug logging
  React.useEffect(() => {
    if (unreadData !== undefined) {
      console.log('Unread count data:', unreadData);
      console.log('Unread count value:', unreadData?.unreadCount);
    }
    if (unreadError) {
      console.error('Unread count error:', unreadError);
    }
  }, [unreadData, unreadError]);

  const unreadCount = unreadData?.unreadCount ?? 0;

  // Debug: Log the count to verify it's being calculated
  React.useEffect(() => {
    console.log('[ChatIcon] Unread count:', unreadCount, 'Data:', unreadData, 'Error:', unreadError);
  }, [unreadCount, unreadData, unreadError]);

  if (!isAuthenticated) {
    return null;
  }

  const handleIconClick = () => {
    // Open modal without a specific conversation - will show conversation list
    setSelectedConversationId(null);
    setSelectedThreadId(null);
    setChatModalOpen(true);
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSelectedThreadId(null);
  };

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  return (
    <>
      <div 
        className={`${styles.chatIconWrapper} ${className || ''}`}
        onClick={handleIconClick}
      >
        <Badge count={unreadCount} showZero={false} offset={[-5, 5]}>
          <MessageOutlined className={styles.chatIcon} />
        </Badge>
      </div>
      <ChatModal
        conversationId={selectedConversationId}
        threadId={selectedThreadId || undefined}
        open={chatModalOpen}
        onClose={() => {
          setChatModalOpen(false);
          setSelectedConversationId(null);
          setSelectedThreadId(null);
        }}
        onConversationChange={handleConversationSelect}
        onThreadChange={handleThreadSelect}
      />
    </>
  );
};

export default ChatIcon;

