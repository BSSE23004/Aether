/**
 * WebSocket event types
 */

import type { Message, Notification } from '@/types';

export interface MessageReceivedEvent {
  message: Message;
}

export interface UserTypingEvent {
  userId: string;
  username: string;
  communityId: string;
}

export interface UserPresenceEvent {
  userId: string;
  username: string;
  status: 'online' | 'offline';
}

export interface NotificationEvent {
  notification: Notification;
}

export interface ProposalUpdateEvent {
  proposalId: string;
  status: string;
  votesFor: number;
  votesAgainst: number;
}

export const WebSocketEvents = {
  // Connection
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',

  // Chat
  MESSAGE_RECEIVED: 'message:received',
  USER_TYPING: 'user:typing',
  USER_STOPPED_TYPING: 'user:stopped_typing',

  // Presence
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  // Notifications
  NOTIFICATION: 'notification',

  // Proposals
  PROPOSAL_UPDATED: 'proposal:updated',
} as const;
