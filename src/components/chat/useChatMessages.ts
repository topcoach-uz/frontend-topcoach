import { useEffect } from 'react';
import { useSocket } from 'src/lib/socket';
import { ChatMessage } from 'src/app/services/chat/types';
import { chatApi } from 'src/app/services/chat/chatApi';
import { useAppDispatch } from 'src/app/store';

interface UseChatMessagesOptions {
  conversationId: string;
  threadId?: string;
  onNewMessage?: (message: ChatMessage) => void;
}

/**
 * Hook to handle real-time chat messages via Socket.io
 */
export const useChatMessages = ({
  conversationId,
  threadId,
  onNewMessage,
}: UseChatMessagesOptions) => {
  const { socket, isConnected, on, off, emit } = useSocket({ autoConnect: true });
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    // Join conversation room
    emit('join_conversation', {
      conversationId,
      threadId,
    });

    // Listen for new messages
    const handleNewMessage = (message: ChatMessage) => {
      // Update RTK Query cache with new message
      dispatch(
        chatApi.util.updateQueryData(
          'getConversationMessages',
          { conversationId, threadId, page: 1, limit: 50 },
          (draft) => {
            // Check if message already exists
            const exists = draft.messages.some((m) => m.id === message.id);
            if (!exists) {
              draft.messages.push(message);
              draft.messages.sort(
                (a, b) =>
                  new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
              );
            }
          }
        )
      );

      // Call callback if provided
      if (onNewMessage) {
        onNewMessage(message);
      }
    };

    // Listen for conversation updates
    const handleConversationUpdate = (data: {
      conversationId: string;
      lastMessage?: ChatMessage;
    }) => {
      if (data.conversationId === conversationId) {
        // Invalidate conversations list to refresh last message
        dispatch(chatApi.util.invalidateTags(['ChatConversations']));
      }
    };

    // Listen for message status updates (delivered, read)
    const handleMessagesRead = (data: {
      conversationId: string;
      threadId?: string;
      readerId: string;
      messageIds?: string[];
    }) => {
      if (
        data.conversationId === conversationId &&
        data.threadId === threadId
      ) {
        // Update message statuses in cache
        dispatch(
          chatApi.util.updateQueryData(
            'getConversationMessages',
            { conversationId, threadId, page: 1, limit: 50 },
            (draft) => {
              draft.messages.forEach((msg) => {
                if (
                  msg.senderId !== data.readerId &&
                  (!data.messageIds || data.messageIds.includes(msg.id))
                ) {
                  msg.status = 'read' as any;
                  msg.readAt = new Date().toISOString();
                }
              });
            }
          )
        );
      }
    };

    // Listen for message delivered updates
    const handleMessageDelivered = (data: { messageId: string }) => {
      dispatch(
        chatApi.util.updateQueryData(
          'getConversationMessages',
          { conversationId, threadId, page: 1, limit: 50 },
          (draft) => {
            const message = draft.messages.find((m) => m.id === data.messageId);
            if (message) {
              message.status = 'delivered' as any;
              message.deliveredAt = new Date().toISOString();
            }
          }
        )
      );
    };

    on('new_message', handleNewMessage);
    on('conversation_updated', handleConversationUpdate);
    on('messages_read', handleMessagesRead);
    on('message_delivered', handleMessageDelivered);

    return () => {
      off('new_message', handleNewMessage);
      off('conversation_updated', handleConversationUpdate);
      off('messages_read', handleMessagesRead);
      off('message_delivered', handleMessageDelivered);
      
      // Leave conversation room
      emit('leave_conversation', {
        conversationId,
        threadId,
      });
    };
  }, [socket, isConnected, conversationId, threadId, emit, on, off, dispatch, onNewMessage]);
};

