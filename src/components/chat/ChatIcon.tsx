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

  // Fetch unread count with error handling - always show icon even if query fails
  const { data: unreadData, error: unreadError } = useGetUnreadCountQuery(
    undefined,
    {
      skip: !isAuthenticated,
      pollingInterval: 10000, // Poll every 10 seconds for real-time updates
      // Don't refetch on error - just use default value
      refetchOnMountOrArgChange: false,
    }
  );

  // Safely get unread count - default to 0 if error or no data
  // Always use 0 if there's any error to prevent rendering issues
  const unreadCount = unreadError ? 0 : (unreadData?.unreadCount ?? 0);

  // Always render if authenticated, regardless of query state
  // This ensures the chat icon is always visible when user is logged in
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

  // Always render the chat icon when authenticated
  // Use try-catch to prevent any rendering errors
  try {
    return (
      <>
        <div 
          className={`${styles.chatIconWrapper} ${className || ''}`}
          onClick={handleIconClick}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            visibility: 'visible',
            opacity: 1,
            pointerEvents: 'auto',
          }}
        >
          <Badge count={unreadCount} showZero={false} offset={[-5, 5]}>
            <MessageOutlined 
              className={styles.chatIcon} 
              style={{ 
                display: 'block',
                visibility: 'visible',
                opacity: 1,
              }}
            />
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
  } catch (error) {
    // Fallback: render a simple chat icon even if there's an error
    console.error('ChatIcon rendering error:', error);
    return (
      <div 
        className={`${styles.chatIconWrapper} ${className || ''}`}
        onClick={handleIconClick}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          visibility: 'visible',
          opacity: 1,
          pointerEvents: 'auto',
        }}
      >
        <MessageOutlined 
          className={styles.chatIcon}
          style={{ 
            display: 'block',
            visibility: 'visible',
            opacity: 1,
          }}
        />
      </div>
    );
  }
};

export default ChatIcon;

