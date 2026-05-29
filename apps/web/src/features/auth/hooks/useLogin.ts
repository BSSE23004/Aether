/**
 * useLogin - login hook
 */

'use client';

import { useCallback } from 'react';
import { useSignMessage } from 'wagmi';
import { useAsync } from '@/hooks';
import { apiClient, endpoints } from '@/lib/api';
import { useAuthStore } from '../stores/authStore';
import type { LoginResponse } from '../types';

export function useLogin() {
  const { signMessageAsync } = useSignMessage();
  const { setUser, setToken } = useAuthStore();

  const login = useCallback(
    async (address: string) => {
      if (!signMessageAsync) {
        throw new Error('Message signing not available');
      }

      // Sign message for authentication
      const message = `Sign this message to authenticate with Aether: ${address}`;
      const signature = await signMessageAsync({ message });

      // Send to backend
      const response = await apiClient.post<LoginResponse>(
        endpoints.auth.me,
        { address, signature, message }
      );

      if (response) {
        setUser(response.user as any);
        setToken(response.token);
        return response;
      }
    },
    [signMessageAsync, setUser, setToken]
  );

  const { data, error, isLoading, execute } = useAsync(
    () => Promise.resolve(null),
    false
  );

  return {
    login,
    isLoading,
    error,
  };
}
