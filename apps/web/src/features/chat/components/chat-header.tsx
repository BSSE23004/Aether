/**
 * ChatHeader - header for chat interface with channel info and actions
 */

'use client';

import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  channelName?: string;
  channelDescription?: string;
  memberCount?: number;
  isConnected?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

export function ChatHeader({
  channelName = 'General',
  channelDescription,
  memberCount = 0,
  isConnected = true,
  onMenuClick,
  className,
}: ChatHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800', className)}>
      {/* Channel Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{channelName}</h2>
            {channelDescription && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{channelDescription}</p>
            )}
          </div>
        </div>
        
        {memberCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>{memberCount}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Connection Status */}
        {!isConnected && (
          <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span>Reconnecting</span>
          </div>
        )}

        {/* Menu Button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Channel options"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}