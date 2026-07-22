/**
 * MessageBubble - displays a single message bubble
 */

'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import { formatMessageTime, isOwnMessage } from '../../utils';
import { AttachmentDisplay } from '@/features/storage';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  showAvatar?: boolean;
  showHeader?: boolean;
  isOptimistic?: boolean;
}

export const MessageBubble = memo<MessageBubbleProps>(({
  message,
  currentUserId,
  showAvatar = true,
  showHeader = true,
  isOptimistic = false,
}) => {
  const isOwn = isOwnMessage(message, currentUserId);
  const time = formatMessageTime(message.createdAt);

  return (
    <div
      className={cn(
        'flex gap-3 mb-4',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className={cn('flex-shrink-0', isOwn ? 'ml-2' : 'mr-2')}>
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              isOwn ? 'bg-blue-600' : 'bg-gray-600'
            )}
          >
            {message.author.username?.[0]?.toUpperCase() || message.author.address[2]?.toUpperCase()}
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start', 'max-w-[70%]')}>
        {/* Header */}
        {showHeader && !isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {message.author.username || message.author.address}
            </span>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'px-4 py-2 rounded-2xl',
            isOwn
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm',
            isOptimistic && 'opacity-60'
          )}
        >
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
          {message.files && message.files.length > 0 && (
            <AttachmentDisplay
              files={message.files}
              className={cn(isOwn ? 'text-left' : 'text-left')}
            />
          )}
        </div>

        {/* Time for own messages */}
        {isOwn && (
          <span className="text-xs text-gray-500 mt-1">{time}</span>
        )}

        {/* Optimistic indicator */}
        {isOptimistic && (
          <span className="text-xs text-gray-400 mt-1">Sending...</span>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';