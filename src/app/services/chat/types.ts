// Chat feature types for frontend

export type ConversationKind = 'MENTOR_STUDENT' | 'PEER' | 'COUNSELOR_STUDENT' | 'ADMIN_MENTOR';

export interface Conversation {
  id: string;
  mentorId: string;
  studentId: string;
  conversationType?: ConversationKind;
  /** Populated for PEER threads: shared interest labels vs current user */
  peerOverlapLabels?: string[];
  lastMessageAt?: string;
  unreadCountMentor: number;
  unreadCountStudent: number;
  createdAt: string;
  updatedAt: string;
  mentor?: {
    id: string;
    email: string;
    profile?: {
      name: string;
      username?: string | null;
      avatar?: string;
      media?: Array<{ url?: string; createdAt?: string; type?: string; tags?: string[] }>;
    };
  };
  student?: {
    id: string;
    email: string;
    profile?: {
      name: string;
      username?: string | null;
      avatar?: string;
      media?: Array<{ url?: string; createdAt?: string; type?: string; tags?: string[] }>;
    };
  };
}

export interface ConversationThread {
  id: string;
  conversationId: string;
  sessionId: string;
  title?: string;
  lastMessageAt?: string;
  unreadCountMentor: number;
  unreadCountStudent: number;
  createdAt: string;
  updatedAt: string;
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  DOCUMENT = 'document',
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  threadId?: string;
  senderId: string;
  messageType: MessageType;
  message?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  status: MessageStatus;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  editedAt?: string;
  editHistory: Array<{
    message: string;
    editedAt: string;
  }>;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  sender?: {
    id: string;
    email: string;
    profile?: {
      name: string;
      avatar?: string;
    };
  };
}

export interface SendMessageDto {
  conversationId: string;
  threadId?: string;
  message: string;
  messageType?: MessageType;
}

export interface SendFileMessageDto {
  conversationId: string;
  threadId?: string;
  message?: string;
  file: File;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
}

export interface ConversationsResponse {
  conversations?: Conversation[];
}

// Type guard to check if response is an array
export function isConversationArray(
  data: Conversation[] | ConversationsResponse
): data is Conversation[] {
  return Array.isArray(data);
}

export interface ThreadsResponse {
  threads: ConversationThread[];
}

