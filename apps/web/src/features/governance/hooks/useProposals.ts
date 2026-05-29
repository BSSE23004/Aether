/**
 * useProposals - fetch proposals
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, endpoints } from '@/lib/api';
import { CACHE_TIMES } from '@/config';
import type { Proposal, PaginatedResponse } from '@/types';

export function useProposals(communityId: string) {
  return useQuery({
    queryKey: ['proposals', communityId],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<Proposal>>(
        endpoints.proposals.list(communityId)
      );
    },
    enabled: !!communityId,
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
  });
}
