import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Spin, Alert, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import MessageList from 'src/components/chat/MessageList';
import ChatInput from 'src/components/chat/ChatInput';
import { useFindOrCreateCounselorConversationMutation } from 'src/app/services/chat/chatApi';
import './chat-readonly.scss';

interface CounselorMessageTabProps {
  studentId: string;
}

/**
 * Counselor <-> student message thread for the "My Journey" console.
 * counselorId is derived server-side from the JWT; only studentId is sent.
 * Resolves (find-or-creates) the conversation once per studentId, then hosts
 * the same MessageList/ChatInput primitives used elsewhere in the app.
 */
const Chat: React.FC<CounselorMessageTabProps> = ({ studentId }) => {
  const { t } = useTranslation();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [findOrCreateCounselorConversation, { isLoading }] = useFindOrCreateCounselorConversationMutation();
  const resolvedForStudentId = useRef<string | null>(null);

  const resolveConversation = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const result = await findOrCreateCounselorConversation({ studentId: id }).unwrap();
        setConversationId(result.conversation.id);
        resolvedForStudentId.current = id;
      } catch (e: any) {
        resolvedForStudentId.current = null;
        setError(e?.data?.message || t('Unable to open this conversation right now.'));
      }
    },
    [findOrCreateCounselorConversation, t],
  );

  useEffect(() => {
    if (!studentId) return;
    if (resolvedForStudentId.current === studentId) return;
    setConversationId(null);
    resolveConversation(studentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  if (isLoading && !conversationId) {
    return (
      <div className="counselor-chat-view counselor-chat-view--center">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="counselor-chat-view counselor-chat-view--center">
        <Alert
          type="error"
          showIcon
          message={t('Unable to load messages')}
          description={error}
          action={
            <Button size="small" danger onClick={() => resolveConversation(studentId)}>
              {t('Retry')}
            </Button>
          }
        />
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="counselor-chat-view counselor-chat-view--center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="counselor-chat-view">
      <div className="counselor-chat-view__messages">
        <MessageList conversationId={conversationId} />
      </div>
      <div className="counselor-chat-view__input">
        <ChatInput conversationId={conversationId} />
      </div>
    </div>
  );
};

export default Chat;
