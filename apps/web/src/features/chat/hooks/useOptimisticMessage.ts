/**
 * useOptimisticMessage - hook for optimistic message updates
 */

'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Message } from '@/types';
import type { OptimisticMessage } from '../types';
import { generateTempId } from '../utils';

export function useOptimisticMessage(channelId: string) {
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const queryClient = useQueryClient();

  const addOptimisticMessage = useCallback((content: string, author: any) => {
    const optimisticMessage: OptimisticMessage = {
      tempId: generateTempId(),
      content,
      author,
      communityId: channelId,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setOptimisticMessages(prev => [...prev, optimisticMessage]);

    // Update the query cache optimistically
    queryClient.setQueryData(['messages', channelId], (old: any) => {
      if (!old) return [optimisticMessage];
      return [optimisticMessage, ...old];
    });

    return optimisticMessage.tempId;
  }, [channelId, queryClient]);

  const removeOptimisticMessage = useCallback((tempId: string) => {
    setOptimisticMessages(prev => prev.filter(msg => msg.tempId !== tempId));

    // Remove from query cache
    queryClient.setQueryData(['messages', channelId], (old: any) => {
      if (!old) return [];
      return old.filter((msg: any) => msg.tempId !== tempId);
    });
  }, [channelId, queryClient]);

  const confirmOptimisticMessage = useCallback((tempId: string, realMessage: Message) => {
    setOptimisticMessages(prev => prev.filter(msg => msg.tempId !== tempId));

    // Replace optimistic message with real message in cache
    queryClient.setQueryData(['messages', channelId], (old: any) => {
      if (!old) return [realMessage];
      return old.map((msg: any) => 
        msg.tempId === tempId ? realMessage : msg
      );
    });
  }, [channelId, queryClient]);

  const clearOptimisticMessages = useCallback(() => {
    setOptimisticMessages([]);
  }, []);

  const hasOptimisticMessage = useCallback((tempId: string) => {
    return optimisticMessages.some(msg => msg.tempId === tempId);
  }, [optimisticMessages]);

  return {
    optimisticMessages,
    addOptimisticMessage,
    removeOptimisticMessage,
    confirmOptimisticMessage,
    clearOptimisticMessages,
    hasOptimisticMessage,
  };
}