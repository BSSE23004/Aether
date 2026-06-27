/**
 * TypingIndicator - shows when users are typing
 */

'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { TypingUser } from '../../types';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  currentUserId?: string;
}

export const TypingIndicator = memo<TypingIndicatorProps>(({ typingUsers, currentUserId }) => {
  // Filter out current user and users not in current channel
  const visibleTypingUsers = typingUsers.filter(
    user => user.userId !== currentUserId
  );

  if (visibleTypingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    const count = visibleTypingUsers.length;
    if (count === 1) {
      const user = visibleTypingUsers[0];
      return `${user.username || 'Someone'} is typing...`;
    } else if (count === 2) {
      return `${visibleTypingUsers[0].username || 'Someone'} and ${visibleTypingUsers[1].username || 'someone'} are typing...`;
    } else {
      return `${count} people are typing...`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';