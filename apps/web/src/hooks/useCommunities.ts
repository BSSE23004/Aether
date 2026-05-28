'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Community, PaginatedResponse } from '@/types';

export function useCommunities() {
  const { data, isLoading, error } = useQuery<
    PaginatedResponse<Community>
  >({
    queryKey: ['communities'],
    queryFn: () => apiClient.get('/api/communities'),
  });

  return {
    communities: data?.items || [],
    total: data?.total || 0,
    isLoading,
    error,
  };
}

export function useCommunity(id: string) {
  const { data, isLoading, error } = useQuery<Community>({
    queryKey: ['community', id],
    queryFn: () => apiClient.get(`/api/communities/${id}`),
    enabled: !!id,
  });

  return {
    community: data,
    isLoading,
    error,
  };
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (communityId: string) =>
      apiClient.post(`/api/communities/${communityId}/join`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });
}
