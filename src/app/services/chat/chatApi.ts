import { RtkApi } from '../api';
import {
  Conversation,
  ConversationThread,
  ChatMessage,
  SendMessageDto,
  SendFileMessageDto,
  MessagesResponse,
  ConversationsResponse,
  ThreadsResponse,
} from './types';

export const chatApi = RtkApi.injectEndpoints({
  endpoints: (build) => ({
    // ========================================
    // CONVERSATIONS
    // ========================================

    /**
     * Get all conversations for current user
     */
    getConversations: build.query<ConversationsResponse, void>({
      query: () => ({
        url: '/chat/conversations',
        method: 'GET',
      }),
      providesTags: ['ChatConversations'],
    }),

    /**
     * Get conversation by ID
     */
    getConversation: build.query<Conversation, string>({
      query: (id) => ({
        url: `/chat/conversations/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'ChatConversations', id }],
    }),

    /**
     * Find or create a conversation between mentor and student
     */
    findOrCreateConversation: build.mutation<
      { conversation: Conversation },
      { mentorId: string; studentId: string }
    >({
      query: (body) => ({
        url: '/chat/conversations/find-or-create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ChatConversations'],
    }),

    findOrCreateAdminMentorConversation: build.mutation<
      { conversation: Conversation },
      { mentorUserId: string }
    >({
      query: (body) => ({ url: '/chat/conversations/find-or-create-admin-mentor', method: 'POST', body }),
      invalidatesTags: [{ type: 'ChatConversations', id: 'LIST' }],
    }),

    /**
     * Find or create a conversation between the current counselor and a student.
     * counselorId is derived server-side from the JWT — only studentId is sent.
     */
    findOrCreateCounselorConversation: build.mutation<
      { conversation: Conversation },
      { studentId: string }
    >({
      query: (body) => ({
        url: '/chat/conversations/find-or-create-counselor',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ChatConversations'],
    }),

    /**
     * Mark conversation as read
     */
    markConversationAsRead: build.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/chat/conversations/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ChatConversations', id },
        'ChatConversations',
      ],
    }),

    /**
     * Get total unread count across all conversations
     */
    getUnreadCount: build.query<{ unreadCount: number }, void>({
      query: () => ({
        url: '/chat/unread-count',
        method: 'GET',
      }),
      providesTags: ['ChatConversations', 'ChatThreads'],
    }),

    // ========================================
    // THREADS
    // ========================================

    /**
     * Get all threads in a conversation
     */
    getThreads: build.query<ThreadsResponse, string>({
      query: (conversationId) => ({
        url: `/chat/conversations/${conversationId}/threads`,
        method: 'GET',
      }),
      providesTags: (result, error, conversationId) => [
        { type: 'ChatThreads', id: `LIST-${conversationId}` },
      ],
    }),

    /**
     * Get thread by ID
     */
    getThread: build.query<ConversationThread, string>({
      query: (id) => ({
        url: `/chat/threads/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'ChatThreads', id }],
    }),

    /**
     * Create thread for a session
     */
    createThread: build.mutation<
      { thread: ConversationThread },
      { conversationId: string; sessionId: string }
    >({
      query: ({ conversationId, sessionId }) => ({
        url: `/chat/conversations/${conversationId}/threads`,
        method: 'POST',
        body: { sessionId },
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'ChatThreads', id: `LIST-${conversationId}` },
        'ChatThreads',
      ],
    }),

    /**
     * Mark thread as read
     */
    markThreadAsRead: build.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/chat/threads/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ChatThreads', id },
        'ChatThreads',
        'ChatConversations',
      ],
    }),

    // ========================================
    // MESSAGES
    // ========================================

    /**
     * Get messages in conversation or thread
     */
    getConversationMessages: build.query<
      MessagesResponse,
      {
        conversationId: string;
        threadId?: string;
        page?: number;
        limit?: number;
        before?: string;
      }
    >({
      query: ({ conversationId, threadId, page = 1, limit = 50, before }) => {
        const params = new URLSearchParams();
        if (threadId) params.append('threadId', threadId);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (before) params.append('before', before);

        return {
          url: `/chat/conversations/${conversationId}/messages?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, { conversationId, threadId }) => [
        {
          type: 'ChatMessages',
          id: threadId ? `LIST-${conversationId}-${threadId}` : `LIST-${conversationId}`,
        },
      ],
    }),

    /**
     * Get messages in thread
     */
    getThreadMessages: build.query<
      MessagesResponse,
      {
        threadId: string;
        page?: number;
        limit?: number;
        before?: string;
      }
    >({
      query: ({ threadId, page = 1, limit = 50, before }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (before) params.append('before', before);

        return {
          url: `/chat/threads/${threadId}/messages?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result, error, { threadId }) => [
        { type: 'ChatMessages', id: `THREAD-${threadId}` },
      ],
    }),

    /**
     * Get message by ID
     */
    getMessage: build.query<ChatMessage, string>({
      query: (id) => ({
        url: `/chat/messages/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'ChatMessages', id }],
    }),

    /**
     * Send a text message
     */
    sendMessage: build.mutation<{ message: ChatMessage }, SendMessageDto>({
      query: (body) => ({
        url: `/chat/conversations/${body.conversationId}/messages`,
        method: 'POST',
        body: {
          message: body.message,
          threadId: body.threadId,
          messageType: body.messageType || 'text',
        },
      }),
      invalidatesTags: (result, error, { conversationId, threadId }) => [
        {
          type: 'ChatMessages',
          id: threadId ? `LIST-${conversationId}-${threadId}` : `LIST-${conversationId}`,
        },
        { type: 'ChatConversations', id: conversationId },
        'ChatConversations',
        'ChatThreads',
      ],
    }),

    /**
     * Send a file message
     */
    sendFileMessage: build.mutation<{ message: ChatMessage }, SendFileMessageDto>({
      query: ({ conversationId, threadId, message, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (threadId) formData.append('threadId', threadId);
        if (message) formData.append('message', message);

        return {
          url: `/chat/conversations/${conversationId}/messages/file`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: (result, error, { conversationId, threadId }) => [
        {
          type: 'ChatMessages',
          id: threadId ? `LIST-${conversationId}-${threadId}` : `LIST-${conversationId}`,
        },
        { type: 'ChatConversations', id: conversationId },
        'ChatConversations',
        'ChatThreads',
      ],
    }),

    /**
     * Edit a message
     */
    editMessage: build.mutation<
      ChatMessage,
      { messageId: string; message: string }
    >({
      query: ({ messageId, message }) => ({
        url: `/chat/messages/${messageId}`,
        method: 'PUT',
        body: { message },
      }),
      invalidatesTags: (result, error, { messageId }) => [
        { type: 'ChatMessages', id: messageId },
        'ChatMessages',
      ],
    }),

    /**
     * Delete a message (soft delete)
     */
    deleteMessage: build.mutation<void, string>({
      query: (id) => ({
        url: `/chat/messages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ChatMessages', id },
        'ChatMessages',
      ],
    }),

    /**
     * Mark message as read
     */
    markMessageAsRead: build.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/chat/messages/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ChatMessages', id },
        'ChatMessages',
        'ChatConversations',
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useFindOrCreateAdminMentorConversationMutation,
  useGetConversationsQuery,
  useGetConversationQuery,
  useFindOrCreateConversationMutation,
  useFindOrCreateCounselorConversationMutation,
  useMarkConversationAsReadMutation,
  useGetUnreadCountQuery,
  useGetThreadsQuery,
  useGetThreadQuery,
  useCreateThreadMutation,
  useMarkThreadAsReadMutation,
  useGetConversationMessagesQuery,
  useGetThreadMessagesQuery,
  useGetMessageQuery,
  useSendMessageMutation,
  useSendFileMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useMarkMessageAsReadMutation,
} = chatApi;

