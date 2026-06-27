/**
 * MessageHeader - displays message author and timestamp
 */

'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import { formatMessageTime } from '../../utils';

interface MessageHeaderProps {
  author: User;
  timestamp: string;
  isOwn?: boolean;
}

export const MessageHeader = memo<MessageHeaderProps>(({ author, timestamp, isOwn = false }) => {
  const time = formatMessageTime(timestamp);
  const displayName = author.username || author.address;

  return (
    <div className={cn('flex items-center gap-2 mb-1', isOwn && 'flex-row-reverse')}>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {displayName}
      </span>
      <span className="text-xs text-gray-500">{time}</span>
    </div>
  );
});

MessageHeader.displayName = 'MessageHeader';