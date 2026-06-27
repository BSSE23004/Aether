/**
 * UnreadBadge - displays unread message count
 */

'use client';

import { cn } from '@/lib/utils';

interface UnreadBadgeProps {
  count: number;
  maxCount?: number;
  className?: string;
}

export function UnreadBadge({ count, maxCount = 99, className }: UnreadBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count;

  return (
    <span
      className={cn(
        'flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium',
        'bg-red-500 text-white',
        'animate-pulse',
        className
      )}
    >
      {displayCount}
    </span>
  );
}