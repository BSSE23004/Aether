/**
 * useProfile - fetch user profile
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, endpoints } from '@/lib/api';
import { CACHE_TIMES } from '@/config';
import type { User } from '@/types';

export function useProfile(address: string | undefined) {
  return useQuery({
    queryKey: ['profile', address],
    queryFn: async () => {
      if (!address) return null;
      return apiClient.get<User>(endpoints.users.profile(address));
    },
    enabled: !!address,
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
  });
}
