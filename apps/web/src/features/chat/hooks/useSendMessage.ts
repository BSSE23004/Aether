/**
 * useSendMessage - send a message
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, endpoints } from '@/lib/api';
import type { Message, SendMessageRequest, SendMessageResponse } from '@/lib/api';

export function useSendMessage(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendMessageRequest) => {
      return apiClient.post<SendMessageResponse>(
        endpoints.messages.send(communityId),
        data
      );
    },
    onSuccess: (data) => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({
        queryKey: ['messages', communityId],
      });
    },
  });
}
