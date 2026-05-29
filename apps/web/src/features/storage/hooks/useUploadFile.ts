/**
 * useUploadFile - upload file to IPFS
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, endpoints } from '@/lib/api';
import type { UploadFileOutput } from '../types';

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(endpoints.files.upload, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json() as Promise<UploadFileOutput>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}
