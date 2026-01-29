import React, { useState } from 'react';
import { Badge } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { ErrorBoundary } from 'react-error-boundary';
import { useGetUnreadCountQuery } from 'src/app/services/chat/chatApi';
import { useTypedSelector } from 'src/app/store';
import { ACCESS_TOKEN } from 'src/constants/storage';
import ChatModal from './ChatModal';
import styles from './ChatIcon.module.scss';

interface ChatIconProps {
  className?: string;
}

function getHasToken(): boolean {
  try {
    return typeof window !== 'undefined' && !!localStorage.getItem(ACCESS_TOKEN);
  } catch {
    return false;
  }
}

function ChatIconFallback() {
  if (!getHasToken()) return null;
  return (
    <div
      className={styles.chatIconWrapper}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 40,
        height: 40,
        cursor: 'default',
        color: '#fff',
      }}
    >
      <span style={{ display: 'inline-flex', color: '#fff' }}>
        <MessageOutlined style={{ fontSize: 20, color: '#fff' }} />
      </span>
    </div>
  );
}

const ChatIcon: React.FC<ChatIconProps> = ({ className }) => {
  const isAuthenticated = useTypedSelector((state) => state?.auth?.isAuthenticated) ?? false;
  const hasToken = getHasToken();
  const showIcon = isAuthenticated || hasToken;

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    skip: true,
  });
  const unreadCount = unreadData?.unreadCount ?? 0;

  if (!showIcon) {
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

  const iconEl = (
    <span style={{ display: 'inline-flex', alignItems: 'center', color: '#fff' }} aria-hidden="true">
      <MessageOutlined className={styles.chatIcon} style={{ fontSize: 20, color: '#fff' }} />
    </span>
  );

  return (
    <>
      <div
        className={`${styles.chatIconWrapper} ${className || ''}`}
        onClick={handleIconClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleIconClick(); } }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 40,
          height: 40,
          color: '#fff',
        }}
      >
        {unreadCount > 0 ? (
          <Badge count={unreadCount} showZero={false} offset={[-5, 5]}>
            {iconEl}
          </Badge>
        ) : (
          iconEl
        )}
      </div>
      {chatModalOpen && (
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
      )}
    </>
  );
};

function ChatIconWithBoundary(props: ChatIconProps) {
  return (
    <ErrorBoundary fallbackRender={() => <ChatIconFallback />}>
      <ChatIcon {...props} />
    </ErrorBoundary>
  );
}

export default ChatIconWithBoundary;

