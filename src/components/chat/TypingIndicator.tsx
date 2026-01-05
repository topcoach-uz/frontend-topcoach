import React, { useState, useEffect } from 'react';
import { Typography } from 'antd';
import { useSocket } from 'src/lib/socket';
import { useTypedSelector } from 'src/app/store';
import styles from './TypingIndicator.module.scss';

const { Text } = Typography;

interface TypingIndicatorProps {
  conversationId: string;
  threadId?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  conversationId,
  threadId,
}) => {
  const { socket, isConnected, on, off } = useSocket({ autoConnect: true });
  const currentUser = useTypedSelector((state) => state.auth.profile);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleTyping = (data: {
      conversationId: string;
      threadId?: string;
      userId: string;
      isTyping: boolean;
    }) => {
      // Only show typing indicator for other users
      if (
        data.conversationId === conversationId &&
        data.threadId === threadId &&
        data.userId !== currentUser?.id
      ) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    };

    on('user_typing', handleTyping);

    // Auto-clear typing indicator after 3 seconds
    const timer = setInterval(() => {
      setTypingUsers((prev) => {
        if (prev.size > 0) {
          return new Set();
        }
        return prev;
      });
    }, 3000);

    return () => {
      off('user_typing', handleTyping);
      clearInterval(timer);
    };
  }, [socket, isConnected, conversationId, threadId, currentUser?.id, on, off]);

  if (typingUsers.size === 0) {
    return null;
  }

  return (
    <div className={styles.typingIndicator}>
      <div className={styles.typingDots}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <Text type="secondary" className={styles.typingText}>
        {typingUsers.size === 1 ? 'Someone is typing...' : 'People are typing...'}
      </Text>
    </div>
  );
};

export default TypingIndicator;

