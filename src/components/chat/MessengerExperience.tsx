import React, { useState } from 'react';
import { Empty } from 'antd';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { useGetConversationQuery, useGetThreadsQuery, useGetUnreadCountQuery } from 'src/app/services/chat/chatApi';
import { useTypedSelector } from 'src/app/store';
import { getLatestCreatedImg } from 'src/utils';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ThreadSelector from './ThreadSelector';
import styles from './MessengerExperience.module.scss';

export interface MessengerExperienceProps {
  conversationId: string | null;
  threadId?: string | null;
  openToGeneralConversation?: boolean;
  onConversationChange: (id: string) => void;
  onThreadChange?: (id: string | null) => void;
  embedded?: boolean;
}

const MessengerExperience: React.FC<MessengerExperienceProps> = ({
  conversationId,
  threadId = null,
  openToGeneralConversation = false,
  onConversationChange,
  onThreadChange,
  embedded = false,
}) => {
  const navigate = useNavigate();
  const { screenSize } = useScreenSize();
  const isMobile = screenSize < 768;
  const currentUser = useTypedSelector((state) => state.auth.profile);
  const [threadsExpanded, setThreadsExpanded] = useState(false);

  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 60000,
  });
  const totalUnread = typeof (unreadData as { unreadCount?: number })?.unreadCount === 'number'
    ? (unreadData as { unreadCount: number }).unreadCount
    : 0;

  const { data: conversation } = useGetConversationQuery(conversationId || '', {
    skip: !conversationId,
  });

  const { data: threadsData } = useGetThreadsQuery(conversationId || '', {
    skip: !conversationId,
  });
  const threadsCount = threadsData?.threads?.length || 0;

  const getOtherUser = () => {
    if (!conversation || !currentUser?.id) return null;
    if (conversation.mentorId === currentUser.id) {
      return conversation.student;
    }
    return conversation.mentor;
  };

  const otherUser = getOtherUser();
  const userName = otherUser?.profile?.name || otherUser?.email || 'User';
  const isMentorSide = conversation?.mentorId === currentUser?.id;
  const otherIsMentor = !isMentorSide && !!conversation?.mentorId;
  const subtitle = threadId
    ? 'Session thread'
    : openToGeneralConversation
      ? 'Full Support'
      : isMentorSide
        ? 'Student'
        : 'Mentor';

  const avatarSrc = (() => {
    if (!otherUser || !conversation) return null;
    const isMentor = conversation.mentorId === otherUser.id;
    if (isMentor && otherUser.profile?.media) {
      const m = getLatestCreatedImg(otherUser.profile.media as any);
      if (m) return m;
    }
    return otherUser.profile?.avatar || null;
  })();

  const showList = !isMobile || !conversationId;
  const showThreadPane = !isMobile || !!conversationId;

  const handleBackMobile = () => {
    onConversationChange('');
    onThreadChange?.(null);
  };

  const handleHeaderClick = () => {
    if (otherIsMentor && conversation?.mentorId) {
      navigate(`/mentors/${conversation.mentorId}`);
    }
  };

  const renderMessages = () => {
    if (!conversationId) return null;
    if (openToGeneralConversation) {
      return (
        <>
          <MessageList conversationId={conversationId} />
          <ChatInput conversationId={conversationId} />
        </>
      );
    }
    if (threadId) {
      return (
        <>
          <MessageList conversationId={conversationId} threadId={threadId} />
          <ChatInput conversationId={conversationId} threadId={threadId} />
        </>
      );
    }
    return (
      <>
        <MessageList conversationId={conversationId} />
        <ChatInput conversationId={conversationId} />
      </>
    );
  };

  return (
    <div className={`${styles.root} ${embedded ? styles.embedded : ''}`}>
      <div className={styles.shell}>
        <aside
          className={styles.sidebar}
          style={{ display: showList ? 'flex' : 'none' }}
          aria-hidden={!showList}
        >
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarHeaderTitle}>Messages</span>
            {totalUnread > 0 && (
              <span className={styles.sidebarUnreadBadge}>
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
          <div className={styles.sidebarList}>
            <ConversationList
              variant="messenger"
              selectedConversationId={conversationId}
              onConversationClick={(id) => {
                onConversationChange(id);
                onThreadChange?.(null);
                setThreadsExpanded(false);
              }}
            />
          </div>
        </aside>

        <main
          className={styles.threadPane}
          style={{ display: showThreadPane ? 'flex' : 'none' }}
        >
          {!conversationId ? (
            <div className={styles.threadEmpty}>
              <Empty description="Select a conversation" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <>
              <header className={styles.threadHeader}>
                {isMobile && (
                  <button type="button" className={styles.threadBackBtn} onClick={handleBackMobile} aria-label="Back to conversations">
                    ←
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.threadHeaderProfile} ${otherIsMentor ? styles.threadHeaderProfileClickable : ''}`}
                  onClick={handleHeaderClick}
                  disabled={!otherIsMentor}
                >
                  <div className={styles.threadHeaderAvatar}>
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="" className={styles.threadAvatarImg} />
                    ) : (
                      <span className={styles.threadAvatarFallback}>{userName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className={styles.threadHeaderText}>
                    <div className={styles.threadHeaderName}>{userName}</div>
                    <div className={styles.threadHeaderMeta}>
                      <span className={styles.threadHeaderRole}>{subtitle}</span>
                    </div>
                  </div>
                </button>

                {!openToGeneralConversation && threadsCount > 0 && (
                  <button
                    type="button"
                    className={styles.threadToggleBtn}
                    onClick={() => setThreadsExpanded((p) => !p)}
                    aria-expanded={threadsExpanded}
                    aria-label="Toggle session threads"
                  >
                    <span className={styles.threadToggleLabel}>
                      {threadsCount} session{threadsCount !== 1 ? 's' : ''}
                    </span>
                    {threadsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </header>

              {!openToGeneralConversation && threadsCount > 0 && threadsExpanded && (
                <div className={styles.threadPicker}>
                  {threadId && (
                    <button
                      type="button"
                      className={styles.backToGeneral}
                      onClick={() => {
                        onThreadChange?.(null);
                        setThreadsExpanded(false);
                      }}
                    >
                      ← General chat
                    </button>
                  )}
                  <ThreadSelector
                    conversationId={conversationId}
                    selectedThreadId={threadId || undefined}
                    onThreadSelect={(tid) => {
                      onThreadChange?.(tid);
                      setThreadsExpanded(false);
                    }}
                  />
                </div>
              )}

              <div className={styles.threadMessages}>{renderMessages()}</div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default MessengerExperience;
