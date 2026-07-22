/**
 * ChatContainer - main chat component integrating all chat features
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useChatSocket } from '../hooks/use-chat-socket';
import { useTyping } from '../hooks/useTyping';
import { useReactions } from '../hooks/useReactions';
import { useOptimisticMessage } from '../hooks/useOptimisticMessage';
import { useMessages } from '../hooks/useMessages';
import { MessageList } from './message-list/message-list';
import { MessageInput } from './message-input/message-input';
import type { Message } from '@/types';
import type { MessageReaction } from '../types';

interface ChatContainerProps {
  channelId: string;
  communityId?: string;
  className?: string;
}

export function ChatContainer({ channelId, communityId, className }: ChatContainerProps) {
  const queryClient = useQueryClient();
  const { user, accessToken } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  // Hooks
  const { data: messagesData, isLoading } = useMessages(communityId || channelId);
  const { typingUsers, addUserTyping, removeUserTyping } = useTyping(channelId);
  const { reactions, addReaction, removeReaction, getMessageReactions } = useReactions();
  const { addOptimisticMessage, confirmOptimisticMessage, removeOptimisticMessage } = useOptimisticMessage(channelId);

  const messages = messagesData?.items || [];

  // Socket connection
  const { sendMessage: socketSendMessage, setTyping: socketSetTyping, markAsRead } = useChatSocket({
    channelId,
    token: accessToken || undefined,
    onMessageReceived: (message: Message) => {
      // Handle optimistic message confirmation
      queryClient.setQueryData(['messages', channelId], (old: any) => {
        if (!old) return [message];
        return [message, ...old];
      });
    },
    onUserTyping: (data) => {
      addUserTyping(data.userId, user?.username);
    },
    onUserStopTyping: (data) => {
      removeUserTyping(data.userId);
    },
  });

  // Update connection state
  useEffect(() => {
    setIsConnected(true);
  }, []);

  // Handle sending messages
  const handleSendMessage = useCallback(async (content: string, metadata?: any) => {
    if (!user) return;

    // Add optimistic message
    const tempId = addOptimisticMessage(content, user);

    try {
      // Send via socket
      const success = socketSendMessage(content, metadata);
      
      if (!success) {
        // Fallback to HTTP API if socket fails
        // This would call the API client directly
        removeOptimisticMessage(tempId);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      removeOptimisticMessage(tempId);
    }
  }, [user, addOptimisticMessage, socketSendMessage, removeOptimisticMessage]);

  // Handle typing
  const handleTypingStart = useCallback(() => {
    socketSetTyping(true);
  }, [socketSetTyping]);

  const handleTypingEnd = useCallback(() => {
    socketSetTyping(false);
  }, [socketSetTyping]);

  // Handle reactions
  const handleAddReaction = useCallback((messageId: string, emoji: string) => {
    if (!user) return;
    addReaction(messageId, emoji, user.id);
    // Would also emit to socket here
  }, [user, addReaction]);

  const handleRemoveReaction = useCallback((messageId: string, emoji: string) => {
    if (!user) return;
    removeReaction(messageId, emoji, user.id);
    // Would also emit to socket here
  }, [user, removeReaction]);

  // Handle read receipts
  useEffect(() => {
    if (messages.length > 0 && user) {
      const lastMessage = messages[0];
      if (lastMessage.author.id !== user.id) {
        markAsRead(lastMessage.id);
      }
    }
  }, [messages, user, markAsRead]);

  if (!user) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <p className="text-gray-500">Please connect to view messages</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900', className)}>
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-sm">
          Reconnecting to chat...
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={user.id}
        isLoading={isLoading}
        typingUsers={typingUsers}
        reactions={reactions}
        onAddReaction={handleAddReaction}
        onRemoveReaction={handleRemoveReaction}
        canReact={true}
        className="flex-1"
      />

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
        placeholder="Type a message..."
      />
    </div>
  );
}