/**
 * useApi - wrapper for API requests with error handling
 */

'use client';

import { useCallback, useState } from 'react';
import { apiClient, type RequestConfig } from '@/lib/api';
import type { AetherError } from '@/types';

interface UseApiState<T> {
  data: T | null;
  error: AetherError | null;
  isLoading: boolean;
}

export function useApi<T, P = unknown>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (
      method: 'GET' | 'POST' | 'PUT' | 'DELETE',
      endpoint: string,
      body?: P,
      config?: RequestConfig
    ): Promise<T | null> => {
      setState({ data: null, error: null, isLoading: true });

      try {
        let result: T;

        switch (method) {
          case 'GET':
            result = await apiClient.get<T>(endpoint, config);
            break;
          case 'POST':
            result = await apiClient.post<T>(endpoint, body, config);
            break;
          case 'PUT':
            result = await apiClient.put<T>(endpoint, body, config);
            break;
          case 'DELETE':
            result = await apiClient.delete<T>(endpoint, config);
            break;
          default:
            throw new Error(`Unknown method: ${method}`);
        }

        setState({ data: result, error: null, isLoading: false });
        return result;
      } catch (error) {
        const err = error instanceof Error ? (error as AetherError) : new Error(String(error));
        setState({ data: null, error: err as AetherError, isLoading: false });
        return null;
      }
    },
    []
  );

  const get = useCallback(
    (endpoint: string, config?: RequestConfig) =>
      execute('GET', endpoint, undefined, config),
    [execute]
  );

  const post = useCallback(
    (endpoint: string, body?: P, config?: RequestConfig) =>
      execute('POST', endpoint, body, config),
    [execute]
  );

  const put = useCallback(
    (endpoint: string, body?: P, config?: RequestConfig) =>
      execute('PUT', endpoint, body, config),
    [execute]
  );

  const del = useCallback(
    (endpoint: string, config?: RequestConfig) =>
      execute('DELETE', endpoint, undefined, config),
    [execute]
  );

  return { ...state, get, post, put, del };
}
