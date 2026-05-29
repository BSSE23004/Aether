/**
 * useVote - vote on proposal
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, endpoints } from '@/lib/api';

export function useVote(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ proposalId, vote }: { proposalId: string; vote: 'for' | 'against' }) => {
      return apiClient.post(
        endpoints.proposals.vote(communityId, proposalId),
        { vote }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', communityId] });
    },
  });
}
