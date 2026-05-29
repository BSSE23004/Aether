/**
 * usePagination - pagination logic hook
 */

'use client';

import { useState, useCallback } from 'react';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export function usePagination(initialLimit = 20) {
  const [state, setState] = useState<PaginationState>({
    page: 1,
    limit: initialLimit,
    total: 0,
    hasMore: false,
  });

  const goToPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, page }));
  }, []);

  const nextPage = useCallback(() => {
    setState(prev =>
      prev.hasMore ? { ...prev, page: prev.page + 1 } : prev
    );
  }, []);

  const previousPage = useCallback(() => {
    setState(prev =>
      prev.page > 1 ? { ...prev, page: prev.page - 1 } : prev
    );
  }, []);

  const setTotal = useCallback((total: number) => {
    setState(prev => ({
      ...prev,
      total,
      hasMore: prev.page * prev.limit < total,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      page: 1,
      limit: initialLimit,
      total: 0,
      hasMore: false,
    });
  }, [initialLimit]);

  return {
    ...state,
    goToPage,
    nextPage,
    previousPage,
    setTotal,
    reset,
  };
}
