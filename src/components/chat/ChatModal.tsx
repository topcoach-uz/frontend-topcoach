import React, { useState, useEffect } from 'react';
import { Drawer, Modal } from 'antd';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { useGetConversationQuery, useGetThreadsQuery } from 'src/app/services/chat/chatApi';
import { useTypedSelector } from 'src/app/store';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ThreadSelector from './ThreadSelector';
import ConversationList from './ConversationList';
import styles from './ChatModal.module.scss';

interface ChatModalProps {
  conversationId: string | null;
  threadId?: string | null;
  open: boolean;
  onClose: () => void;
  onConversationChange?: (conversationId: string) => void;
  onThreadChange?: (threadId: string) => void;
  /** When true, open directly to conversation-level messages (no thread), e.g. "Full Support" chat. Skips thread list. */
  openToGeneralConversation?: boolean;
}

const ChatModal: React.FC<ChatModalProps> = ({
  conversationId,
  threadId,
  open,
  onClose,
  onConversationChange,
  onThreadChange,
  openToGeneralConversation = false,
}) => {
  const { screenSize } = useScreenSize();
  const isMobile = screenSize < 768;
  const currentUser = useTypedSelector((state) => state.auth.profile);

  // Fetch conversation data
  const { data: conversation, isLoading: conversationLoading } =
    useGetConversationQuery(conversationId || '', {
      skip: !conversationId || !open,
    });

  const getOtherUser = () => {
    if (!conversation || !currentUser?.id) return null;
    if (conversation.mentorId === currentUser.id) {
      return conversation.student;
    }
    return conversation.mentor;
  };

  const otherUser = getOtherUser();
  const userName = otherUser?.profile?.name || otherUser?.email || 'User';
  const userAvatar = otherUser?.profile?.avatar;

  // Get threads count for dynamic height
  const { data: threadsData } = useGetThreadsQuery(conversationId || '', {
    skip: !conversationId || !!threadId,
  });
  const threadsCount = threadsData?.threads?.length || 0;
  
  // Calculate dynamic height based on thread count (max 35vh, but smaller if fewer threads)
  const getThreadSelectorHeight = () => {
    if (threadsCount === 0) return 'auto';
    if (threadsCount === 1) return '150px';
    if (threadsCount === 2) return '200px';
    if (threadsCount <= 3) return '250px';
    return '35vh';
  };

  const title = conversationId ? (
    <div className={styles.chatHeader}>
      <button
        type="button"
        className={styles.backButton}
        onClick={() => {
          // Go back to conversation list
          if (onConversationChange) {
            onConversationChange('');
          }
        }}
      >
        ←
      </button>
      {userAvatar && (
        <img src={userAvatar} alt={userName} className={styles.headerAvatar} />
      )}
      <div className={styles.headerInfo}>
        <div className={styles.headerName}>{userName}</div>
        {threadId ? (
          <div className={styles.headerSubtitle}>Session Thread</div>
        ) : openToGeneralConversation ? (
          <div className={styles.headerSubtitle}>Full Support</div>
        ) : null}
      </div>
    </div>
  ) : (
    <div className={styles.chatHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerName}>Conversations</div>
      </div>
    </div>
  );

  const content = (
    <div className={styles.chatContainer}>
      {!conversationId ? (
        <ConversationList
          onConversationClick={(selectedConversationId) => {
            if (onConversationChange) {
              onConversationChange(selectedConversationId);
            }
          }}
        />
      ) : (
        <>
          {openToGeneralConversation ? (
            <>
              <MessageList conversationId={conversationId} />
              <ChatInput conversationId={conversationId} />
            </>
          ) : !threadId ? (
            <>
              <MessageList conversationId={conversationId} />
              <ChatInput conversationId={conversationId} />
            </>
          ) : (
            <>
              <MessageList
                conversationId={conversationId}
                threadId={threadId || undefined}
              />
              <ChatInput conversationId={conversationId} threadId={threadId || undefined} />
            </>
          )}
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        title={title}
        placement="bottom"
        height="90vh"
        open={open}
        onClose={onClose}
        className={styles.chatDrawer}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
      >
        {content}
      </Drawer>
    );
  }

  // Desktop heights:
  // - conversation list: moderate height
  // - conversation messages (threaded or not): tall so message view isn't cramped
  const modalBodyHeight = !conversationId ? '70vh' : '82vh';
  const modalBodyMaxHeight = !conversationId ? '700px' : '900px';

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      className={styles.chatModal}
      style={{ top: 8, paddingBottom: 0 }}
      styles={{
        body: {
          padding: 0,
          height: modalBodyHeight,
          maxHeight: modalBodyMaxHeight,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {content}
    </Modal>
  );
};

export default ChatModal;

