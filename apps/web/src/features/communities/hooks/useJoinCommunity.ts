/**
 * useJoinCommunity - join a community
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, endpoints } from '@/lib/api';

export function useJoinCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communityId: string) => {
      return apiClient.post(endpoints.communities.join(communityId), {});
    },
    onSuccess: () => {
      // Invalidate communities queries
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });
}
