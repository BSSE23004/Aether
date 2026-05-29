/**
 * useMessages - fetch messages for a community
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, endpoints } from '@/lib/api';
import { CACHE_TIMES } from '@/config';
import type { Message, PaginatedResponse } from '@/types';

export function useMessages(communityId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['messages', communityId],
    queryFn: async () => {
      if (!communityId) return null;
      const response = await apiClient.get<PaginatedResponse<Message>>(
        endpoints.messages.list(communityId)
      );
      return response;
    },
    enabled: !!communityId && enabled,
    staleTime: CACHE_TIMES.INSTANT,
    gcTime: CACHE_TIMES.MEDIUM,
  });
}
