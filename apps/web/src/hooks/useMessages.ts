'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Message, PaginatedResponse } from '@/types';

export function useMessages(communityId: string) {
  const { data, isLoading, error } = useQuery<
    PaginatedResponse<Message>
  >({
    queryKey: ['messages', communityId],
    queryFn: () =>
      apiClient.get(`/api/communities/${communityId}/messages`),
    enabled: !!communityId,
  });

  return {
    messages: data?.items || [],
    isLoading,
    error,
    hasNextPage: data?.hasMore,
    total: data?.total || 0,
  };
}

export function useSendMessage() {
  return useMutation({
    mutationFn: ({
      communityId,
      content,
    }: {
      communityId: string;
      content: string;
    }) =>
      apiClient.post(`/api/communities/${communityId}/messages`, {
        content,
      }),
  });
}
