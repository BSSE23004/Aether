/**
 * useMessages - fetch messages for a channel
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, endpoints } from '@/lib/api';
import { CACHE_TIMES } from '@/config';
import type { Message, PaginatedResponse } from '@/types';

export function useMessages(channelId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['messages', channelId],
    queryFn: async () => {
      if (!channelId) return null;
      const response = await apiClient.get<PaginatedResponse<Message>>(
        endpoints.messages.list(channelId)
      );
      return response;
    },
    enabled: !!channelId && enabled,
    staleTime: CACHE_TIMES.INSTANT,
    gcTime: CACHE_TIMES.MEDIUM,
  });
}
