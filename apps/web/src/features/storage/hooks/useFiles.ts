/**
 * useFiles - fetch user files
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, endpoints } from '@/lib/api';
import { CACHE_TIMES } from '@/config';
import type { PaginatedResponse, StorageFile } from '@/types';

export function useFiles(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['files', page, limit],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<StorageFile>>(
        endpoints.files.list,
        { params: { page, limit } }
      );
    },
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
  });
}
