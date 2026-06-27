/**
 * Chat feature types
 */

import type { Message, User } from '@/types';

export interface ChatState {
  selectedCommunityId: string | null;
  selectedChannelId: string | null;
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
}

export interface SendMessagePayload {
  content: string;
  channelId: string;
  metadata?: Record<string, unknown>;
}

export interface TypingUser {
  userId: string;
  username?: string;
  channelId: string;
  timestamp: number;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export interface OptimisticMessage extends Omit<Message, 'id'> {
  tempId: string;
  isOptimistic: boolean;
}

export interface ChatSocketEvents {
  'new_message': Message;
  'message_edited': Message;
  'message_deleted': { messageId: string; channelId: string; deletedAt: string };
  'user_typing': { userId: string; channelId: string };
  'user_stop_typing': { userId: string; channelId: string };
  'message_read': { userId: string; messageId: string; channelId: string };
}

export interface MessageGroup {
  user: User;
  messages: Message[];
  showAvatar: boolean;
}
