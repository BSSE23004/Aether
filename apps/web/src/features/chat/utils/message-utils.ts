/**
 * Message utilities for chat functionality
 */

import type { Message, User } from '@/types';
import type { MessageGroup } from '../types';

/**
 * Group messages by user and time for better UI display
 */
export function groupMessages(messages: Message[]): MessageGroup[] {
  if (!messages.length) return [];

  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  messages.forEach((message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const shouldGroup = prevMessage && 
      prevMessage.author.id === message.author.id &&
      isWithinTimeWindow(prevMessage.createdAt, message.createdAt, 5 * 60 * 1000); // 5 minutes

    if (shouldGroup && currentGroup) {
      currentGroup.messages.push(message);
    } else {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        user: message.author,
        messages: [message],
        showAvatar: true,
      };
    }
  });

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Check if two timestamps are within a time window
 */
function isWithinTimeWindow(timestamp1: string, timestamp2: string, windowMs: number): boolean {
  const time1 = new Date(timestamp1).getTime();
  const time2 = new Date(timestamp2).getTime();
  return Math.abs(time2 - time1) < windowMs;
}

/**
 * Format message timestamp
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
  if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  }
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Generate a temporary ID for optimistic messages
 */
export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a message is from the current user
 */
export function isOwnMessage(message: Message, currentUserId: string): boolean {
  return message.author.id === currentUserId;
}

/**
 * Truncate message content for previews
 */
export function truncateMessage(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

/**
 * Detect URLs in message content
 */
export function extractUrls(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = content.match(urlRegex);
  return matches || [];
}

/**
 * Sanitize message content (basic HTML escaping)
 */
export function sanitizeContent(content: string): string {
  const div = document.createElement('div');
  div.textContent = content;
  return div.innerHTML;
}