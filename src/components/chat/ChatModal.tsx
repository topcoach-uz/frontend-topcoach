import React from 'react';
import { Drawer, Modal } from 'antd';
import { useScreenSize } from 'src/hooks/useScreenSize';
import MessengerExperience from './MessengerExperience';
import styles from './ChatModal.module.scss';

interface ChatModalProps {
  conversationId: string | null;
  threadId?: string | null;
  open: boolean;
  onClose: () => void;
  onConversationChange?: (conversationId: string) => void;
  onThreadChange?: (threadId: string | null) => void;
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

  const handleConversationChange = (id: string) => {
    onConversationChange?.(id);
  };

  const body = (
    <MessengerExperience
      conversationId={conversationId}
      threadId={threadId ?? null}
      openToGeneralConversation={openToGeneralConversation}
      onConversationChange={handleConversationChange}
      onThreadChange={onThreadChange}
    />
  );

  if (isMobile) {
    return (
      <Drawer
        title="Messages"
        placement="bottom"
        height="90vh"
        open={open}
        onClose={onClose}
        className={styles.chatDrawer}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } }}
        closable
      >
        <div className={styles.messengerModalBody}>{body}</div>
      </Drawer>
    );
  }

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={960}
      className={styles.chatModal}
      style={{ top: 8, paddingBottom: 0 }}
      styles={{
        body: {
          padding: 0,
          height: '82vh',
          maxHeight: 900,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      destroyOnClose
    >
      <div className={styles.messengerModalBody}>{body}</div>
    </Modal>
  );
};

export default ChatModal;
