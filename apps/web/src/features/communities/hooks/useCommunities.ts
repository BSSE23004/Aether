/**
 * useCommunities - fetch communities list
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, endpoints } from '@/lib/api';
import { CACHE_TIMES } from '@/config';
import type { Community, PaginatedResponse } from '@/types';

export function useCommunities(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['communities', page, limit],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<Community>>(
        endpoints.communities.list,
        { params: { page, limit } }
      );
    },
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
  });
}
