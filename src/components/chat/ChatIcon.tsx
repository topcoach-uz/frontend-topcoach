import React, { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { chatApi, useGetConversationsQuery, useGetUnreadCountQuery } from 'src/app/services/chat/chatApi';
import { isConversationArray, type Conversation } from 'src/app/services/chat/types';
import { useTypedSelector } from 'src/app/store';
import { ACCESS_TOKEN } from 'src/constants/storage';
import { MessageCircle } from 'lucide-react';
import ChatModal from './ChatModal';
import styles from './ChatIcon.module.scss';
import { useSocket } from 'src/lib/socket';
import { useAppDispatch } from 'src/app/store';

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
        cursor: 'pointer',
        color: '#fff',
      }}
    >
      <MessageCircle size={22} color="#fff" />
    </div>
  );
}

const ChatIcon: React.FC<ChatIconProps> = ({ className }) => {
  const authState = useTypedSelector((state) => state.auth);
  const isAuthenticated = authState?.isAuthenticated ?? false;
  const currentUserId = authState?.profile?.id as string | undefined;
  const hasToken = getHasToken();
  const showIcon = isAuthenticated || hasToken;
  const dispatch = useAppDispatch();

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Subscribe to total unread count (includes threaded unread counts)
  const {
    data: unreadCountData,
    refetch: refetchUnreadCount,
  } = useGetUnreadCountQuery(undefined, {
    skip: !showIcon,
    pollingInterval: 60000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Conversations-based unread count (matches popup list)
  const { data: conversationsData } = useGetConversationsQuery(undefined, {
    skip: !showIcon,
    pollingInterval: 60000,
  });

  const conversations: Conversation[] = React.useMemo(() => {
    if (!conversationsData) return [];
    if (isConversationArray(conversationsData)) return conversationsData;
    return (conversationsData as any).conversations || [];
  }, [conversationsData]);

  // Prefer backend's canonical total unread count (covers threaded chats).
  // Fallback to conversation list sum if endpoint isn't available yet.
  const unreadCount = React.useMemo(() => {
    const apiCount = (unreadCountData as any)?.unreadCount;
    const apiCountSafe = typeof apiCount === 'number' ? apiCount : null;

    // Conversation list includes per-user unread fields but we may not always have
    // `currentUserId` available immediately; in practice, only one side is non-zero.
    const conversationSum = conversations.reduce((sum, conv) => {
      if (currentUserId) {
        if (conv.mentorId === currentUserId) return sum + (conv.unreadCountMentor || 0);
        if (conv.studentId === currentUserId) return sum + (conv.unreadCountStudent || 0);
        return sum;
      }
      return sum + Math.max(conv.unreadCountMentor || 0, conv.unreadCountStudent || 0);
    }, 0);

    if (apiCountSafe === null) return conversationSum;
    return Math.max(apiCountSafe, conversationSum);
  }, [unreadCountData, conversations, currentUserId]);

  // Real-time: refresh unread badge when backend notifies changes
  const { socket, isConnected, on, off } = useSocket({ autoConnect: true });
  React.useEffect(() => {
    if (!socket || !isConnected || !showIcon) return;

    const handleUnreadCountChanged = () => {
      // Ensure both list + total count stay in sync
      dispatch(chatApi.util.invalidateTags(['ChatConversations', 'ChatThreads']));
      refetchUnreadCount();
    };

    on('unread_count_changed', handleUnreadCountChanged);
    return () => {
      off('unread_count_changed', handleUnreadCountChanged);
    };
  }, [socket, isConnected, showIcon, on, off, dispatch, refetchUnreadCount]);

  if (!showIcon) {
    return null;
  }

  const handleIconClick = () => {
    setSelectedConversationId(null);
    setSelectedThreadId(null);
    setChatModalOpen(true);
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSelectedThreadId(null);
  };

  const handleThreadSelect = (threadId: string | null) => {
    setSelectedThreadId(threadId);
  };

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
          visibility: 'visible',
          opacity: 1,
        }}
      >
        <MessageCircle size={22} color="#fff" />
        {unreadCount > 0 && (
          <span className={styles.chatIconBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
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
          onThreadChange={(tid) => handleThreadSelect(tid)}
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

