/**
 * useAsync - generic async state management
 */

'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

interface UseAsyncState<T, E> {
  data: T | null;
  error: E | null;
  isLoading: boolean;
}

export function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [state, setState] = useState<UseAsyncState<T, E>>({
    data: null,
    error: null,
    isLoading: immediate,
  });

  const executeRef = useRef<() => Promise<T>>();

  const execute = useCallback(async () => {
    setState({ data: null, error: null, isLoading: true });
    try {
      const response = await asyncFunction();
      setState({ data: response, error: null, isLoading: false });
      return response;
    } catch (error) {
      setState({ data: null, error: error as E, isLoading: false });
      throw error;
    }
  }, [asyncFunction]);

  executeRef.current = execute;

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}
