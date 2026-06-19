/**
 * useLogin - SIWE login hook
 */

'use client';

import { useCallback } from 'react';
import { useSignMessage } from 'wagmi';
import { useAsync } from '@/hooks';
import { apiClient, endpoints } from '@/lib/api';
import { useAuthStore } from '../stores/authStore';
import type { LoginResponse, NonceRequest, NonceResponse } from '../types';

export function useLogin() {
  const { signMessageAsync } = useSignMessage();
  const { setUser, setTokens } = useAuthStore();

  const login = useCallback(
    async (address: string) => {
      if (!signMessageAsync) {
        throw new Error('Message signing not available');
      }

      // 1. Fetch Nonce
      const nonceRes = await apiClient.post<NonceResponse>(
        endpoints.auth.nonce,
        { address } as NonceRequest
      );

      // 2. Format SIWE challenge message matching the backend
      const message = `Aether SIWE challenge\nNonce: ${nonceRes.nonce}\nAddress: ${address.toLowerCase()}`;

      // 3. Sign message
      const signature = await signMessageAsync({ message });

      // 4. Send to backend
      const response = await apiClient.post<LoginResponse>(
        endpoints.auth.login,
        { address: address.toLowerCase(), signature }
      );

      if (response) {
        setUser(response.user as any);
        setTokens(response.accessToken, response.refreshToken);
        return response;
      }
      return undefined;
    },
    [signMessageAsync, setUser, setTokens]
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
