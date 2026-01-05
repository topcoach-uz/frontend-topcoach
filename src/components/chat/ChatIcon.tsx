import React, { useState, useEffect } from 'react';
import { Badge } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { useGetUnreadCountQuery, useGetConversationsQuery } from 'src/app/services/chat/chatApi';
import { isConversationArray } from 'src/app/services/chat/types';
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
  const { data: unreadData } = useGetUnreadCountQuery(
    undefined,
    {
      skip: !isAuthenticated,
      pollingInterval: 30000,
    }
  );

  // Fetch conversations to get the first one
  const { data: conversationsData } = useGetConversationsQuery(
    undefined,
    {
      skip: !isAuthenticated,
    }
  );

  const unreadCount = unreadData?.unreadCount || 0;

  // Get first conversation
  const conversations = conversationsData
    ? (isConversationArray(conversationsData) ? conversationsData : conversationsData.conversations || [])
    : [];
  const firstConversationId = conversations.length > 0 ? conversations[0].id : null;

  useEffect(() => {
    // Set the first conversation when conversations are loaded
    if (firstConversationId && !selectedConversationId) {
      setSelectedConversationId(firstConversationId);
    }
  }, [firstConversationId, selectedConversationId]);

  if (!isAuthenticated) {
    return null;
  }

  const handleIconClick = () => {
    if (firstConversationId) {
      setSelectedConversationId(firstConversationId);
      setSelectedThreadId(null);
      setChatModalOpen(true);
    }
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
          setSelectedThreadId(null);
        }}
        onConversationChange={(newThreadId) => {
          // Handle thread selection
          setSelectedThreadId(newThreadId || null);
        }}
      />
    </>
  );
};

export default ChatIcon;

