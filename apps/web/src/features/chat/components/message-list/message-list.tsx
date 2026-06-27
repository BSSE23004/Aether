/**
 * MessageList - displays messages with scroll and loading states
 */

'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Message, MessageReaction } from '@/types';
import { MessageItem } from './message-item';
import { TypingIndicator } from './typing-indicator';
import { groupMessages } from '../../utils';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  typingUsers?: any[];
  reactions?: Record<string, MessageReaction[]>;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  canReact?: boolean;
  className?: string;
}

export function MessageList({
  messages,
  currentUserId,
  isLoading = false,
  isLoadingMore = false,
  onLoadMore,
  typingUsers = [],
  reactions = {},
  onAddReaction,
  onRemoveReaction,
  canReact = true,
  className,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use smooth scroll but debounced to avoid excessive scrolling
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages.length]);

  // Handle scroll for infinite loading
  const handleScroll = () => {
    if (!containerRef.current || !onLoadMore || isLoadingMore) return;

    const { scrollTop } = containerRef.current;
    if (scrollTop === 0) {
      onLoadMore();
    }
  };

  const messageGroups = groupMessages(messages);

  if (isLoading && messages.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to say hello!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        'flex-1 overflow-y-auto',
        'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
        'scrollbar-track-transparent',
        className
      )}
    >
      <div className="px-4 py-4">
        {/* Loading More Indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Messages */}
        {messageGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-4">
            {group.messages.map((message, messageIndex) => {
              const showAvatar = messageIndex === 0;
              const showHeader = messageIndex === 0;
              const messageReactions = reactions[message.id] || [];

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  currentUserId={currentUserId}
                  showAvatar={showAvatar}
                  showHeader={showHeader}
                  reactions={messageReactions}
                  onAddReaction={(emoji) => onAddReaction?.(message.id, emoji)}
                  onRemoveReaction={(emoji) => onRemoveReaction?.(message.id, emoji)}
                  canReact={canReact}
                />
              );
            })}
          </div>
        ))}

        {/* Typing Indicator */}
        <TypingIndicator typingUsers={typingUsers} currentUserId={currentUserId} />

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}